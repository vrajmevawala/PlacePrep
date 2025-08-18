import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes.js';
import freePracticeRoutes from './routes/freePractice.routes.js';
import testSeriesRoutes from './routes/testSeries.routes.js';
import questionRoutes from './routes/question.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import resultsRoutes from './routes/results.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import NotificationService from './lib/notificationService.js';
import { sendContestReminderEmail } from './lib/emailService.js';
const prisma = new PrismaClient();

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

const PORT = process.env.PORT;

app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/free-practice', freePracticeRoutes);
app.use('/api/testseries', testSeriesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/resources', resourceRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Initialize notification service
const notificationService = new NotificationService(io);

// Make io and notificationService available to routes
app.set('io', io);
app.set('notificationService', notificationService);

server.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});

// Cron job for contest management and notifications
cron.schedule('*/5 * * * *', async () => { // every 5 minutes
  const now = new Date();
  
  try {
    // Auto-submit expired contests
    const { autoSubmitExpiredContests } = await import('./controllers/testSeries.controller.js');
    await autoSubmitExpiredContests();
    
    // Find all test series that have ended but whose questions are still hidden
    const endedSeries = await prisma.testSeries.findMany({
      where: {
        endTime: { lt: now }
      },
      include: { questions: true }
    });

    for (const series of endedSeries) {
      const hiddenQuestionIds = series.questions.filter(q => !q.visibility).map(q => q.id);
      if (hiddenQuestionIds.length > 0) {
        await prisma.question.updateMany({
          where: { id: { in: hiddenQuestionIds } },
          data: { visibility: true }
        });
      }
    }

    // Check for contests that just started (within last 5 minutes)
    const justStartedSeries = await prisma.testSeries.findMany({
      where: {
        startTime: {
          gte: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
          lte: now
        }
      }
    });

    for (const series of justStartedSeries) {
      await notificationService.notifyContestStarted(series);
    }

    // Check for contests that just ended (within last 5 minutes)
    const justEndedSeries = await prisma.testSeries.findMany({
      where: {
        endTime: {
          gte: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
          lte: now
        }
      }
    });

    for (const series of justEndedSeries) {
      await notificationService.notifyContestEnded(series);
    }

    // Check for contests starting in 30 minutes
    const startingSoonSeries = await prisma.testSeries.findMany({
      where: {
        startTime: {
          gte: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
          lte: new Date(now.getTime() + 35 * 60 * 1000)  // 35 minutes from now
        }
      }
    });

    for (const series of startingSoonSeries) {
      await notificationService.notifyContestStartingSoon(series, 30);
    }

    // Check for contests ending in 30 minutes
    const endingSoonSeries = await prisma.testSeries.findMany({
      where: {
        endTime: {
          gte: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
          lte: new Date(now.getTime() + 35 * 60 * 1000)  // 35 minutes from now
        }
      }
    });

    for (const series of endingSoonSeries) {
      await notificationService.notifyContestEndingSoon(series, 30);
    }

    // Check for contests starting in 1 hour (for email reminders)
    const startingInOneHour = await prisma.testSeries.findMany({
      where: {
        startTime: {
          gte: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
          lte: new Date(now.getTime() + 65 * 60 * 1000)  // 1 hour 5 minutes from now
        }
      }
    });

    for (const series of startingInOneHour) {
      try {
        // Get all users who have joined this contest
        const participants = await prisma.participation.findMany({
          where: { testSeriesId: series.id },
          include: {
            user: {
              select: { email: true, fullName: true }
            }
          }
        });

        // Send reminder emails to all participants
        for (const participant of participants) {
          if (participant.user && participant.user.email) {
            const contestDetails = {
              id: series.id,
              title: series.title,
              startTime: series.startTime,
              duration: Math.round((new Date(series.endTime) - new Date(series.startTime)) / (1000 * 60)), // duration in minutes
              questionCount: series.questions?.length || 0
            };

            await sendContestReminderEmail(
              participant.user.email, 
              participant.user.fullName, 
              contestDetails
            );
            console.log(`Contest reminder email sent to: ${participant.user.email} for contest: ${series.title}`);
          }
        }
      } catch (error) {
        console.error(`Failed to send contest reminder emails for contest ${series.id}:`, error);
      }
    }

  } catch (error) {
    console.error('Error in cron job:', error);
  }
});

// Daily cron job for practice reminders
cron.schedule('0 9 * * *', async () => { // every day at 9 AM
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find users who haven't practiced in the last week
    const inactiveUsers = await prisma.user.findMany({
      where: {
        studentActivities: {
          none: {
            time: { gte: oneWeekAgo }
          }
        }
      },
      select: { id: true, fullName: true }
    });

    for (const user of inactiveUsers) {
      await notificationService.notifyPracticeReminder(user.id, 7);
    }

    console.log(`Sent practice reminders to ${inactiveUsers.length} users`);
  } catch (error) {
    console.error('Error in daily cron job:', error);
  }
});