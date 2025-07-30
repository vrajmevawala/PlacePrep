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
});