import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import freePracticeRoutes from './routes/freePractice.routes.js';
import testSeriesRoutes from './routes/testSeries.routes.js';
import questionRoutes from './routes/question.routes.js';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

dotenv.config();

const app = express();
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
app.use('/api/freepractice', freePracticeRoutes);
app.use('/api/testseries', testSeriesRoutes);

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});

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
});