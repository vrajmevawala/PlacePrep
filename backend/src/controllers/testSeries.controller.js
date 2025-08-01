import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get notification service from app
const getNotificationService = (req) => {
  return req.app.get('notificationService');
};

// Generate a unique contest code
const generateContestCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create a new TestSeries (admin/moderator only)
export const createTestSeries = async (req, res) => {
  try {
    const { title, questionIds, startTime, endTime, requiresCode } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ message: 'Only admin or moderator can create test series.' });
    }

    // Validate questionIds
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ message: 'Provide at least one question.' });
    }

    // Generate contest code if required
    let contestCode = null;
    if (requiresCode) {
      let isUnique = false;
      while (!isUnique) {
        contestCode = generateContestCode();
        const existingContest = await prisma.testSeries.findUnique({
          where: { contestCode }
        });
        if (!existingContest) {
          isUnique = true;
        }
      }
    }

    // Create TestSeries
    const testSeries = await prisma.testSeries.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        requiresCode: requiresCode || false,
        contestCode,
        createdBy: userId,
        questions: {
          connect: questionIds.map(id => ({ id })),
        },
      },
      include: { questions: { select: { id: true, question: true, options: true, level: true, category: true, subcategory: true } }, creator: true },
    });

    await prisma.question.updateMany({
      where: { id: { in: questionIds } },
      data: { visibility: false }
    });

    // Send notification about new contest
    const notificationService = getNotificationService(req);
    if (notificationService) {
      try {
        await notificationService.notifyContestAnnounced(testSeries);
        console.log(`Contest announcement notification sent for: ${testSeries.title}`);
      } catch (error) {
        console.error('Failed to send contest announcement notification:', error);
      }
    }

    res.status(201).json({ testSeries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all TestSeries (optionally filter by creator)
export const getAllTestSeries = async (req, res) => {
  try {
    const tests = await prisma.testSeries.findMany({
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        requiresCode: true,
        contestCode: true,
        creator: {
          select: {
            fullName: true
          }
        }
      }
    });
    res.json({ testSeries: tests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single TestSeries by ID
export const getTestSeriesById = async (req, res) => {
  try {
    const { id } = req.params;
    const testSeries = await prisma.testSeries.findUnique({
      where: { id: Number(id) },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            correctAns: true,
            level: true,
            category: true,
            subcategory: true,
            explanation: true
          }
        },
        creator: {
          select: {
            fullName: true
          }
        }
      }
    });
    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found.' });
    }
    res.json({ testSeries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get questions for a specific TestSeries (without correct answers)
export const getTestSeriesQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const testSeries = await prisma.testSeries.findUnique({
      where: { id: Number(id) },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            level: true,
            category: true,
            subcategory: true
          }
        }
      }
    });
    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found.' });
    }
    res.json({ questions: testSeries.questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add joinTestSeries endpoint
export const joinTestSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get contest details
    const contest = await prisma.testSeries.findUnique({
      where: { id: Number(id) },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            level: true,
            category: true,
            subcategory: true
          }
        }
      }
    });
    
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found.' });
    }
    
    // Check if participation already exists
    let participation = await prisma.participation.findFirst({
      where: { sid: userId, testSeriesId: Number(id) }
    });
    if (!participation) {
      participation = await prisma.participation.create({
        data: {
          practiceTest: false,
          contest: true,
          startTime: new Date(),
          endTime: null,
          user: { connect: { id: userId } }, // Connect to user
          testSeries: { connect: { id: Number(id) } }
        }
      });
    }
    
    res.status(201).json({ 
      participation,
      contest: {
        id: contest.id,
        title: contest.title,
        questions: contest.questions
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update submitTestSeriesAnswers
export const submitTestSeriesAnswers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { answers, autoSubmitted = false } = req.body; // [{ questionId, selectedOption }]
    
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers are required.' });
    }
    
    // Fetch correct answers for the questions in this test series
    const testSeries = await prisma.testSeries.findUnique({
      where: { id: Number(id) },
      include: {
        questions: {
          select: { 
            id: true, 
            correctAns: true,
            question: true,
            options: true
          }
        }
      }
    });
    
    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found.' });
    }
    
    // Map questionId to correctAns and question details
    const correctMap = {};
    const questionMap = {};
    testSeries.questions.forEach(q => {
      correctMap[q.id] = q.correctAns;
      questionMap[q.id] = q;
    });
    

    
    // Calculate score - only count questions with actual answers
    let score = 0;
    let attempted = 0;
    const questionResults = [];
    
    answers.forEach(ans => {
      const hasAnswer = ans.selectedOption && ans.selectedOption.trim() !== '' && ans.selectedOption !== 'null';
      
      if (hasAnswer) {
        attempted++;
        if (correctMap[ans.questionId] && correctMap[ans.questionId] === ans.selectedOption) {
          score++;
        }
      }
      
      // Create result object for each question
      questionResults.push({
        questionId: ans.questionId,
        question: questionMap[ans.questionId]?.question || '',
        options: questionMap[ans.questionId]?.options || {},
        userAnswer: ans.selectedOption || '',
        correctAnswer: correctMap[ans.questionId] || '',
        isCorrect: hasAnswer && correctMap[ans.questionId] === ans.selectedOption,
        isAttempted: hasAnswer
      });
    });
    
    // Update participation (set endTime and submittedAt)
    await prisma.participation.updateMany({
      where: { sid: userId, testSeriesId: Number(id) },
      data: { 
        endTime: new Date(),
        submittedAt: new Date()
      }
    });
    
    // Log student activity for each question (create a new record for every answer)
    const now = new Date();
    
    for (const ans of answers) {
      const activityData = {
        sid: userId,
        qid: ans.questionId,
        testSeriesId: Number(id),
        time: now,
        selectedAnswer: ans.selectedOption && ans.selectedOption.trim() !== '' && ans.selectedOption !== 'null' ? ans.selectedOption : null
      };
      
      await prisma.studentActivity.create({
        data: activityData
      });
    }
    
    // Send performance notification for high scores (80% or above)
    const percentage = Math.round((score / testSeries.questions.length) * 100);
    const notificationService = getNotificationService(req);
    if (notificationService && percentage >= 80) {
      try {
        await notificationService.notifyHighScore(userId, testSeries, score, testSeries.questions.length);
        console.log(`High score notification sent for user ${userId}: ${percentage}%`);
      } catch (error) {
        console.error('Failed to send high score notification:', error);
      }
    }

    res.json({ 
      score, 
      correct: score, // Add this for consistency
      total: testSeries.questions.length,
      attempted,
      autoSubmitted,
      results: {
        correctAnswers: score,
        correct: score, // Add this for consistency
        totalQuestions: testSeries.questions.length,
        attemptedQuestions: attempted,
        timeTaken: 0, // You can calculate this from start/end time if needed
        questionResults
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserContestResult = async (req, res) => {
  try {
    const { id } = req.params; // contest id
    const { pid } = req.query; // participation id (optional)
    const userId = req.user.id;

    // Get contest start/end time and questions with correct answers
    const contest = await prisma.testSeries.findUnique({
      where: { id: Number(id) },
      select: { 
        startTime: true, 
        endTime: true, 
        questions: { 
          select: { 
            id: true, 
            question: true, 
            options: true, 
            correctAns: true 
          } 
        } 
      }
    });
    if (!contest) return res.status(404).json({ message: 'Contest not found' });

    // Check if contest has ended
    const now = new Date();
    const contestEndTime = new Date(contest.endTime);
    
    if (now < contestEndTime) {
      return res.status(403).json({ 
        message: 'Results not available yet',
        contestEndTime: contest.endTime,
        timeUntilEnd: contestEndTime.getTime() - now.getTime()
      });
    }

    // Get StudentActivity for this user/contest
    let activities;
    if (pid) {
      // If participation ID is provided, get activities for that specific participation
      const participation = await prisma.participation.findFirst({
        where: {
          pid: Number(pid),
          sid: userId,
          testSeriesId: Number(id)
        }
      });
      
      if (!participation) {
        return res.status(404).json({ message: 'Participation not found' });
      }
      
      // Get activities for this user/contest without strict time filtering
      activities = await prisma.studentActivity.findMany({
        where: {
          sid: userId,
          testSeriesId: Number(id)
        }
      });
    } else {
      // Get all activities for this user/contest without strict time filtering
      activities = await prisma.studentActivity.findMany({
        where: {
          sid: userId,
          testSeriesId: Number(id)
        }
      });
    }

    // Map questionId to correctAns and question details
    const correctMap = {};
    const questionMap = {};
    contest.questions.forEach(q => { 
      correctMap[q.id] = q.correctAns;
      questionMap[q.id] = q;
    });

    // Calculate stats
    let correct = 0;
    let attempted = 0;
    const questionResults = [];
    
    // Process each question
    contest.questions.forEach(question => {
      const activity = activities.find(act => act.qid === question.id);
      const hasAnswer = activity && activity.selectedAnswer && activity.selectedAnswer.trim() !== '' && activity.selectedAnswer !== 'null';
      
      if (hasAnswer) {
        attempted++;
        if (correctMap[question.id] === activity.selectedAnswer) {
          correct++;
        }
      }
      
      questionResults.push({
        questionId: question.id,
        question: question.question,
        options: question.options,
        userAnswer: activity?.selectedAnswer || '',
        correctAnswer: correctMap[question.id],
        isCorrect: hasAnswer && correctMap[question.id] === activity.selectedAnswer,
        isAttempted: hasAnswer
      });
    });
    


    res.json({
      totalQuestions: contest.questions.length,
      attempted,
      correct,
      correctAnswers: correct, // Add this for consistency
      questionResults
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getContestStats = async (req, res) => {
  try {
    const { id } = req.params;
    // Get all participations for this contest
    const participations = await prisma.participation.findMany({
      where: { testSeriesId: Number(id) },
      select: { sid: true, startTime: true, endTime: true }
    });

    // Get all users' StudentActivity for this contest
    const allActivities = await prisma.studentActivity.findMany({
      where: { testSeriesId: Number(id) }
    });

    // Get correct answers for all questions in this contest
    const contest = await prisma.testSeries.findUnique({
      where: { id: Number(id) },
      select: { 
        questions: { 
          select: { 
            id: true, 
            correctAns: true,
            question: true,
            options: true
          } 
        } 
      }
    });
    const correctMap = {};
    contest.questions.forEach(q => { correctMap[q.id] = q.correctAns; });
    const totalQuestions = contest.questions.length;

    // Calculate scores for each user
    const userScores = {};
    allActivities.forEach(act => {
      if (!userScores[act.sid]) userScores[act.sid] = { correct: 0, attempted: 0 };
      const hasAnswer = act.selectedAnswer && act.selectedAnswer.trim() !== '' && act.selectedAnswer !== 'null';
      if (hasAnswer) userScores[act.sid].attempted++;
      if (hasAnswer && correctMap[act.qid] === act.selectedAnswer) userScores[act.sid].correct++;
    });

    // Build array of scores
    const scores = Object.values(userScores).map(u => u.correct);

    // Calculate average
    const average = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const averagePercentage = scores.length ? ((average / totalQuestions) * 100) : 0;

    // Calculate question-wise statistics
    const questionStats = {};
    contest.questions.forEach(q => {
      questionStats[q.id] = {
        questionId: q.id,
        question: q.question,
        options: q.options,
        correctAns: q.correctAns,
        totalAttempts: 0,
        correctAttempts: 0,
        incorrectAttempts: 0,
        notAttempted: 0
      };
    });

    // Populate question statistics
    allActivities.forEach(act => {
      if (questionStats[act.qid]) {
        questionStats[act.qid].totalAttempts++;
        const hasAnswer = act.selectedAnswer && act.selectedAnswer.trim() !== '' && act.selectedAnswer !== 'null';
        if (hasAnswer) {
          if (act.selectedAnswer === correctMap[act.qid]) {
            questionStats[act.qid].correctAttempts++;
          } else {
            questionStats[act.qid].incorrectAttempts++;
          }
        } else {
          questionStats[act.qid].notAttempted++;
        }
      }
    });

    // Calculate not attempted for each question
    const totalParticipants = participations.length;
    Object.values(questionStats).forEach(q => {
      q.notAttempted = totalParticipants - q.totalAttempts;
    });

    // Find most/least statistics
    const questionStatsArray = Object.values(questionStats);
    const mostCorrect = questionStatsArray.reduce((max, q) => 
      q.correctAttempts > max.correctAttempts ? q : max, questionStatsArray[0]);
    const mostIncorrect = questionStatsArray.reduce((max, q) => 
      q.incorrectAttempts > max.incorrectAttempts ? q : max, questionStatsArray[0]);
    const mostAttempted = questionStatsArray.reduce((max, q) => 
      q.totalAttempts > max.totalAttempts ? q : max, questionStatsArray[0]);
    const leastAttempted = questionStatsArray.reduce((min, q) => 
      q.totalAttempts < min.totalAttempts ? q : min, questionStatsArray[0]);

    res.json({
      scores,
      average,
      averagePercentage,
      totalQuestions,
      totalParticipants,
      questionStats: questionStatsArray,
      mostCorrect,
      mostIncorrect,
      mostAttempted,
      leastAttempted
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get statistics for all contests
export const getAllContestStats = async (req, res) => {
  try {
    const contests = await prisma.testSeries.findMany({
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        questions: {
          select: {
            id: true,
            correctAns: true
          }
        }
      }
    });

    const allContestStats = [];

    for (const contest of contests) {
      // Get all participations for this contest
      const participations = await prisma.participation.findMany({
        where: { testSeriesId: contest.id },
        select: { sid: true }
      });

      // Get all activities for this contest
      const allActivities = await prisma.studentActivity.findMany({
        where: { testSeriesId: contest.id }
      });

      const totalQuestions = contest.questions.length;
      const totalParticipants = participations.length;

      if (totalParticipants === 0) {
        allContestStats.push({
          contestId: contest.id,
          contestTitle: contest.title,
          startTime: contest.startTime,
          endTime: contest.endTime,
          totalQuestions,
          totalParticipants,
          averageScore: 0,
          averagePercentage: 0,
          status: new Date() < contest.startTime ? 'upcoming' : 
                 new Date() > contest.endTime ? 'completed' : 'live'
        });
        continue;
      }

      // Calculate scores
      const correctMap = {};
      contest.questions.forEach(q => { correctMap[q.id] = q.correctAns; });

      const userScores = {};
      allActivities.forEach(act => {
        if (!userScores[act.sid]) userScores[act.sid] = { correct: 0, attempted: 0 };
        if (act.selectedAnswer) userScores[act.sid].attempted++;
        if (act.selectedAnswer && correctMap[act.qid] === act.selectedAnswer) userScores[act.sid].correct++;
      });

      const scores = Object.values(userScores).map(u => u.correct);
      const averageScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const averagePercentage = scores.length ? ((averageScore / totalQuestions) * 100) : 0;

      allContestStats.push({
        contestId: contest.id,
        contestTitle: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
        totalQuestions,
        totalParticipants,
        averageScore,
        averagePercentage,
        status: new Date() < contest.startTime ? 'upcoming' : 
               new Date() > contest.endTime ? 'completed' : 'live'
      });
    }

    res.json({ contestStats: allContestStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserParticipations = async (req, res) => {
  try {
    const userId = req.user.id;
    // Get all participations for this user, with contest info
    const participations = await prisma.participation.findMany({
      where: { sid: userId, testSeriesId: { not: null } },
      include: {
        testSeries: { select: { id: true, title: true } }
      },
      orderBy: { startTime: 'desc' }
    });
    res.json({ participations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get upcoming contests (test series)
export const getUpcomingContests = async (req, res) => {
  try {
    const now = new Date();
    const contests = await prisma.testSeries.findMany({
      where: { startTime: { gte: now } },
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        requiresCode: true,
        contestCode: true,
        participations: true,
      }
    });
    
    // Map to expected frontend format with proper timezone handling
    const result = contests.map(c => {
      // Convert UTC to local time
      const startTime = new Date(c.startTime);
      const endTime = new Date(c.endTime);
      
      // Format date and time in local timezone
      const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      };
      
      const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      };
      
      // Calculate time until start
      const timeUntilStart = startTime.getTime() - now.getTime();
      const hoursUntilStart = Math.floor(timeUntilStart / (1000 * 60 * 60));
      const minutesUntilStart = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));
      
      let timeStatus = '';
      if (hoursUntilStart > 24) {
        const daysUntilStart = Math.floor(hoursUntilStart / 24);
        timeStatus = `${daysUntilStart} day${daysUntilStart > 1 ? 's' : ''} away`;
      } else if (hoursUntilStart > 0) {
        timeStatus = `${hoursUntilStart}h ${minutesUntilStart}m away`;
      } else if (minutesUntilStart > 0) {
        timeStatus = `${minutesUntilStart}m away`;
      } else {
        timeStatus = 'Starting now';
      }
      
      return {
        id: c.id,
        name: c.title,
        date: formatDate(startTime),
        time: formatTime(startTime),
        endDate: formatDate(endTime),
        endTime: formatTime(endTime),
        participants: c.participations ? c.participations.length : 0,
        requiresCode: c.requiresCode,
        contestCode: c.contestCode,
        timeStatus,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update TestSeries (admin/moderator only)
export const updateTestSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, startTime, endTime, requiresCode } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ message: 'Only admin or moderator can update test series.' });
    }

    // Check if contest exists
    const existingContest = await prisma.testSeries.findUnique({
      where: { id: Number(id) }
    });

    if (!existingContest) {
      return res.status(404).json({ message: 'Test series not found.' });
    }

    // Check if contest has already started
    const now = new Date();
    const contestStartTime = new Date(existingContest.startTime);
    
    if (now >= contestStartTime) {
      return res.status(400).json({ message: 'Cannot update contest that has already started.' });
    }

    // Validate times
    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);
    
    if (newStartTime <= now) {
      return res.status(400).json({ message: 'Start time cannot be in the past.' });
    }
    
    if (newEndTime <= newStartTime) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    // Update the contest
    const updatedContest = await prisma.testSeries.update({
      where: { id: Number(id) },
      data: {
        title: title.trim(),
        startTime: newStartTime,
        endTime: newEndTime,
        requiresCode: requiresCode || false
      },
      include: { 
        questions: { select: { id: true, question: true, options: true, level: true, category: true, subcategory: true } }, 
        creator: true 
      },
    });

    res.json({ testSeries: updatedContest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Join contest using code
export const joinContestByCode = async (req, res) => {
  try {
    const { contestCode } = req.body;
    const userId = req.user.id;

    if (!contestCode) {
      return res.status(400).json({ message: 'Contest code is required.' });
    }

    // Find contest by code
    const contest = await prisma.testSeries.findUnique({
      where: { contestCode },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            level: true,
            category: true,
            subcategory: true
          }
        }
      }
    });

    if (!contest) {
      return res.status(404).json({ message: 'Invalid contest code.' });
    }

    // Check if contest is active
    const now = new Date();
    if (now < contest.startTime || now > contest.endTime) {
      return res.status(400).json({ message: 'Contest is not currently active.' });
    }

    // Check if user already participated
    const existingParticipation = await prisma.participation.findFirst({
      where: {
        sid: userId,
        testSeriesId: contest.id
      }
    });

    if (existingParticipation) {
      return res.status(400).json({ message: 'You have already joined this contest.' });
    }

    // Create participation
    const participation = await prisma.participation.create({
      data: {
        practiceTest: false,
        contest: true,
        startTime: new Date(),
        endTime: null,
        user: { connect: { id: userId } },
        testSeries: { connect: { id: contest.id } }
      }
    });

    res.status(201).json({ 
      message: 'Successfully joined contest!',
      contest: {
        id: contest.id,
        title: contest.title,
        questions: contest.questions
      },
      participation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
