import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
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
      include: { questions: { select: { id: true, question: true, options: true, level: true, category: true, subcategory: true, correctAnswers: true } }, creator: true },
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
        _count: {
          select: {
            participations: true
          }
        },
        creator: {
          select: {
            fullName: true
          }
        }
      }
    });
    const mapped = tests.map(t => ({
      id: t.id,
      title: t.title,
      startTime: t.startTime,
      endTime: t.endTime,
      requiresCode: t.requiresCode,
      contestCode: t.contestCode,
      participantsCount: t._count?.participations || 0,
      creator: t.creator
    }));
    res.json({ testSeries: mapped });
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
            correctAnswers: true,
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
            subcategory: true,
            correctAnswers: true
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
    const { answers, autoSubmitted = false, violationType = null } = req.body; // [{ questionId, selectedOption }]
    
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
            correctAnswers: true,
            question: true,
            options: true
          }
        }
      }
    });
    
    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found.' });
    }
    
    // Map questionId to correct answers and question details
    const correctMap = {};
    const questionMap = {};
    testSeries.questions.forEach(q => {
      correctMap[q.id] = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];
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
        correctAnswer: (correctMap[ans.questionId] || []).join(', '),
        isCorrect: hasAnswer && (correctMap[ans.questionId] || []).includes(ans.selectedOption),
        isAttempted: hasAnswer
      });
    });
    
    // Get current participation to check violations
    const participation = await prisma.participation.findFirst({
      where: { sid: userId, testSeriesId: Number(id) }
    });

    if (!participation) {
      return res.status(404).json({ message: 'Participation not found.' });
    }

    // Handle violations
    let currentViolations = participation.violations || 0;
    if (violationType) {
      currentViolations += 1;
    }

    // Update participation (set endTime, submittedAt, and violations)
    const endTime = new Date();
    await prisma.participation.updateMany({
      where: { sid: userId, testSeriesId: Number(id) },
      data: { 
        endTime: endTime,
        submittedAt: endTime,
        violations: currentViolations
      }
    });
    
    // Calculate time taken in minutes
    const timeTaken = participation.startTime ? 
      Math.round((endTime.getTime() - new Date(participation.startTime).getTime()) / (1000 * 60)) : 0;
    
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
      timeTaken: timeTaken, // Add time taken to top level
      autoSubmitted,
      violations: currentViolations,
      results: {
        correctAnswers: score,
        correct: score, // Add this for consistency
        totalQuestions: testSeries.questions.length,
        attemptedQuestions: attempted,
        timeTaken: timeTaken, // Calculate time taken in minutes
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
            correctAnswers: true 
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
    let activities = [];
    let participation = null;
    
    if (pid) {
      // If participation ID is provided, get activities for that specific participation
      participation = await prisma.participation.findFirst({
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
      // Get participation and activities for this user/contest
      participation = await prisma.participation.findFirst({
        where: {
          sid: userId,
          testSeriesId: Number(id)
        }
      });
      
      // If user participated, get their activities
      if (participation) {
        activities = await prisma.studentActivity.findMany({
          where: {
            sid: userId,
            testSeriesId: Number(id)
          }
        });
      }
      // If no participation, we'll still show contest info but no personal results
    }

    // Map questionId to correct answers and question details
    const correctMap = {};
    const questionMap = {};
    contest.questions.forEach(q => { 
      correctMap[q.id] = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];
      questionMap[q.id] = q;
    });

    // Calculate stats
    let correct = 0;
    let attempted = 0;
    const questionResults = [];
    
    // Calculate time taken if participation exists
    let timeTaken = 0;
    if (participation && participation.startTime && participation.endTime) {
      timeTaken = Math.round((new Date(participation.endTime).getTime() - new Date(participation.startTime).getTime()) / (1000 * 60));
    }
    
    // Process each question
    contest.questions.forEach(question => {
      const activity = activities.find(act => act.qid === question.id);
      const hasAnswer = activity && activity.selectedAnswer && activity.selectedAnswer.trim() !== '' && activity.selectedAnswer !== 'null';
      
      if (hasAnswer) {
        attempted++;
        if ((correctMap[question.id] || []).includes(activity.selectedAnswer)) {
          correct++;
        }
      }
      
      questionResults.push({
        questionId: question.id,
        question: question.question,
        options: question.options,
        userAnswer: activity?.selectedAnswer || '',
        correctAnswer: (correctMap[question.id] || []).join(', '),
        isCorrect: hasAnswer && (correctMap[question.id] || []).includes(activity.selectedAnswer),
        isAttempted: hasAnswer
      });
    });
    


    res.json({
      totalQuestions: contest.questions.length,
      attempted,
      correct,
      correctAnswers: correct, // Add this for consistency
      timeTaken: timeTaken,
      violations: participation?.violations || 0,
      autoSubmitted: participation?.violations >= 2,
      hasParticipated: !!participation,
      questionResults
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get contest leaderboard
export const getContestLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get all participations for this contest with user details
    const participations = await prisma.participation.findMany({
      where: { testSeriesId: Number(id) },
      select: {
        sid: true,
        startTime: true,
        endTime: true,
        submittedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        submittedAt: 'asc' // First to submit gets higher rank in case of tie
      }
    });
    
    console.log('Raw participations data:', JSON.stringify(participations, null, 2));

    // Get all users' StudentActivity for this contest
    const allActivities = await prisma.studentActivity.findMany({
      where: { testSeriesId: Number(id) }
    });

    // Get correct answers for all questions in this contest
    const contest = await prisma.testSeries.findUnique({
      where: { id: Number(id) },
      select: { 
        startTime: true,
        endTime: true,
        questions: { 
          select: { 
            id: true, 
            correctAnswers: true
          } 
        } 
      }
    });

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found.' });
    }

    const correctMap = {};
    contest.questions.forEach(q => { correctMap[q.id] = q.correctAnswers; });
    const totalQuestions = contest.questions.length;

    // Calculate scores for each user
    const userScores = {};
    allActivities.forEach(act => {
      if (!userScores[act.sid]) userScores[act.sid] = { correct: 0, attempted: 0 };
      const hasAnswer = act.selectedAnswer && act.selectedAnswer.trim() !== '' && act.selectedAnswer !== 'null';
      if (hasAnswer) userScores[act.sid].attempted++;
      if (hasAnswer && correctMap[act.qid] === act.selectedAnswer) userScores[act.sid].correct++;
    });

    // Create leaderboard entries
    const leaderboard = participations.map(participation => {
      const userScore = userScores[participation.sid] || { correct: 0, attempted: 0 };
      const percentage = totalQuestions > 0 ? (userScore.correct / totalQuestions) * 100 : 0;
      const accuracy = userScore.attempted > 0 ? (userScore.correct / userScore.attempted) * 100 : 0;
      
      // Debug logging for time calculation
      console.log(`=== Time calculation for ${participation.user.fullName} ===`);
      console.log('Participation data:', {
        startTime: participation.startTime,
        endTime: participation.endTime,
        submittedAt: participation.submittedAt
      });
      console.log('Contest data:', {
        startTime: contest.startTime,
        endTime: contest.endTime
      });
      
      let timeTaken = 0;
      
      // Method 1: Use participation startTime and endTime
      if (participation.startTime && participation.endTime) {
        const startTime = new Date(participation.startTime);
        const endTime = new Date(participation.endTime);
        
        // Validate dates
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.log('Invalid dates detected:', { startTime: participation.startTime, endTime: participation.endTime });
        } else {
          timeTaken = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
          console.log('Method 1 (startTime-endTime):', timeTaken, 'minutes');
          console.log('Start time:', startTime.toISOString());
          console.log('End time:', endTime.toISOString());
        }
      }
      // Method 2: Use participation startTime and submittedAt
      else if (participation.startTime && participation.submittedAt) {
        const startTime = new Date(participation.startTime);
        const submittedAt = new Date(participation.submittedAt);
        
        // Validate dates
        if (isNaN(startTime.getTime()) || isNaN(submittedAt.getTime())) {
          console.log('Invalid dates detected:', { startTime: participation.startTime, submittedAt: participation.submittedAt });
        } else {
          timeTaken = Math.round((submittedAt.getTime() - startTime.getTime()) / (1000 * 60));
          console.log('Method 2 (startTime-submittedAt):', timeTaken, 'minutes');
          console.log('Start time:', startTime.toISOString());
          console.log('Submitted at:', submittedAt.toISOString());
        }
      }
      // Method 2.5: Use contest startTime and participation submittedAt (fallback for missing participation startTime)
      else if (contest.startTime && participation.submittedAt) {
        const startTime = new Date(contest.startTime);
        const submittedAt = new Date(participation.submittedAt);
        
        // Validate dates
        if (isNaN(startTime.getTime()) || isNaN(submittedAt.getTime())) {
          console.log('Invalid dates detected:', { startTime: contest.startTime, submittedAt: participation.submittedAt });
        } else {
          timeTaken = Math.round((submittedAt.getTime() - startTime.getTime()) / (1000 * 60));
          console.log('Method 2.5 (contest startTime-submittedAt):', timeTaken, 'minutes');
          console.log('Contest start time:', startTime.toISOString());
          console.log('Submitted at:', submittedAt.toISOString());
        }
      }
      // Method 3: Use contest startTime and endTime
      else if (contest.startTime && contest.endTime) {
        const startTime = new Date(contest.startTime);
        const endTime = new Date(contest.endTime);
        
        // Validate dates
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.log('Invalid contest dates detected:', { startTime: contest.startTime, endTime: contest.endTime });
        } else {
          timeTaken = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
          console.log('Method 3 (contest duration):', timeTaken, 'minutes');
          console.log('Contest start time:', startTime.toISOString());
          console.log('Contest end time:', endTime.toISOString());
        }
      }
      else {
        console.log('No time data available, using 0');
      }
      
      console.log('Final timeTaken:', timeTaken, 'minutes');
      console.log('=====================================');
      
      return {
        rank: 0, // Will be calculated below
        userId: participation.sid,
        userName: participation.user.fullName,
        userEmail: participation.user.email,
        correct: userScore.correct,
        attempted: userScore.attempted,
        totalQuestions: totalQuestions,
        percentage: Math.round(percentage * 100) / 100,
        accuracy: Math.round(accuracy * 100) / 100,
        submittedAt: participation.submittedAt,
        timeTaken: timeTaken
      };
    });

    // Sort by score (descending), then by submission time (ascending for tie-break)
    leaderboard.sort((a, b) => {
      if (b.correct !== a.correct) return b.correct - a.correct;
      if (a.submittedAt && b.submittedAt) {
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      }
      return 0;
    });

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    res.json({
      contestId: Number(id),
      totalParticipants: leaderboard.length,
      totalQuestions: totalQuestions,
      leaderboard: leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
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
            correctAnswers: true,
            question: true,
            options: true
          } 
        } 
      }
    });

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found.' });
    }

    const correctMap = {};
    contest.questions.forEach(q => { correctMap[q.id] = q.correctAnswers; });
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
        correctAns: q.correctAnswers,
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
            correctAnswers: true
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

      if (totalQuestions === 0) {
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
      contest.questions.forEach(q => { correctMap[q.id] = q.correctAnswers; });

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

    // Validate times
    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);
    const now = new Date();
    // Allow edits during live contests but keep sane validations
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

// Delete a TestSeries (admin/moderator only)
export const deleteTestSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ message: 'Only admin or moderator can delete test series.' });
    }

    const contestId = Number(id);
    const contest = await prisma.testSeries.findUnique({
      where: { id: contestId },
      include: { questions: true }
    });
    if (!contest) {
      return res.status(404).json({ message: 'Test series not found.' });
    }

    await prisma.$transaction(async (tx) => {
      // Make previously hidden questions visible again
      const questionIds = contest.questions.map(q => q.id);
      if (questionIds.length > 0) {
        await tx.question.updateMany({
          where: { id: { in: questionIds } },
          data: { visibility: true }
        });
      }

      // Remove related activities and participations
      await tx.studentActivity.deleteMany({ where: { testSeriesId: contestId } });
      await tx.participation.deleteMany({ where: { testSeriesId: contestId } });

      // Finally delete the test series
      await tx.testSeries.delete({ where: { id: contestId } });
    });

    res.json({ message: 'Test series deleted successfully.' });
  } catch (error) {
    console.error('Error deleting test series:', error);
    res.status(500).json({ message: error.message });
  }
};

// Bulk delete TestSeries (admin/moderator only)
export const deleteMultipleTestSeries = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ message: 'Only admin or moderator can delete test series.' });
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids must be a non-empty array' });
    }

    await prisma.$transaction(async (tx) => {
      // For each contest, cleanup related data and delete
      for (const id of ids) {
        const contestId = Number(id);
        const contest = await tx.testSeries.findUnique({ where: { id: contestId }, include: { questions: true } });
        if (!contest) continue;
        const questionIds = contest.questions.map(q => q.id);
        if (questionIds.length > 0) {
          await tx.question.updateMany({ where: { id: { in: questionIds } }, data: { visibility: true } });
        }
        await tx.studentActivity.deleteMany({ where: { testSeriesId: contestId } });
        await tx.participation.deleteMany({ where: { testSeriesId: contestId } });
        await tx.testSeries.delete({ where: { id: contestId } });
      }
    });

    res.json({ message: 'Selected test series deleted successfully.' });
  } catch (error) {
    console.error('Error bulk deleting test series:', error);
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

// Record a violation for a contest
export const recordViolation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { violationType } = req.body;

    if (!violationType) {
      return res.status(400).json({ message: 'Violation type is required.' });
    }

    // Get current participation
    const participation = await prisma.participation.findFirst({
      where: { sid: userId, testSeriesId: Number(id) }
    });

    if (!participation) {
      return res.status(404).json({ message: 'Participation not found.' });
    }

    // Update violation count
    const currentViolations = (participation.violations || 0) + 1;
    
    await prisma.participation.updateMany({
      where: { sid: userId, testSeriesId: Number(id) },
      data: { violations: currentViolations }
    });

    res.json({ 
      violations: currentViolations,
      shouldAutoSubmit: currentViolations >= 2
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all participants for a specific contest
export const getContestParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    
    const participants = await prisma.participation.findMany({
      where: {
        testSeriesId: Number(id),
        contest: true
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    // Calculate scores and stats for each participant
    const participantsWithStats = await Promise.all(
      participants.map(async (participation) => {
        try {
          // Get all answers for this participant
          const answers = await prisma.studentActivity.findMany({
            where: {
              sid: participation.sid,
              testSeriesId: Number(id)
            },
            include: {
              question: {
                select: {
                  id: true,
                  correctAnswers: true
                }
              }
            }
          });

          const totalQuestions = await prisma.question.count({
            where: {
              testSeries: {
                some: {
                  id: Number(id)
                }
              }
            }
          });

          const correctAnswers = answers.filter(a => a.selectedAnswer === a.question.correctAnswers).length;
          const percentage = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : '0';
          const timeTaken = participation.submittedAt && participation.startTime 
            ? Math.round((new Date(participation.submittedAt) - new Date(participation.startTime)) / (1000 * 60))
            : 0;

          return {
            id: participation.pid,
            userId: participation.user?.id || 'unknown',
            name: participation.user?.fullName || 'Unknown User',
            email: participation.user?.email || 'No email',
            score: correctAnswers,
            totalQuestions,
            percentage: parseFloat(percentage),
            accuracy: parseFloat(percentage),
            timeTaken,
            submittedAt: participation.submittedAt,
            startTime: participation.startTime
          };
        } catch (error) {
          console.error('Error processing participant:', participation.pid, error);
          return {
            id: participation.pid,
            userId: 'unknown',
            name: 'Unknown User',
            email: 'No email',
            score: 0,
            totalQuestions: 0,
            percentage: 0,
            accuracy: 0,
            timeTaken: 0,
            submittedAt: participation.submittedAt,
            startTime: participation.startTime
          };
        }
      })
    );

    // Sort by score (highest first)
    participantsWithStats.sort((a, b) => b.score - a.score);

    res.json({ participants: participantsWithStats });
  } catch (error) {
    console.error('Error getting contest participants:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get detailed answers for a specific participant
export const getParticipantAnswers = async (req, res) => {
  try {
    const { contestId, participantId } = req.params;
    
    const participation = await prisma.participation.findFirst({
      where: {
        pid: Number(participantId),
        testSeriesId: Number(contestId),
        contest: true
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        testSeries: {
          select: {
            id: true,
            title: true,
            questions: {
              select: {
                id: true,
                question: true,
                options: true,
                correctAnswers: true,
                explanation: true
              }
            }
          }
        }
      }
    });

    if (!participation) {
      return res.status(404).json({ message: 'Participation not found.' });
    }

    // Build answers from StudentActivity since Result may not exist
    const activities = await prisma.studentActivity.findMany({
      where: {
        sid: participation.sid,
        testSeriesId: participation.testSeriesId
      }
    });

    const questionOrder = participation.testSeries.questions.map(q => q.id);
    const answersByQuestionId = new Map(activities.map(a => [a.qid, a.selectedAnswer]));
    const answers = questionOrder.map(qid => answersByQuestionId.get(qid) || null);
    const totalQuestions = participation.testSeries.questions.length;
    const correctAnswers = participation.testSeries.questions.reduce((acc, q) => {
      const ans = answersByQuestionId.get(q.id);
      return acc + (ans && ans === q.correctAnswers ? 1 : 0);
    }, 0);
    const percentage = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : '0';
    const timeTaken = participation.submittedAt && participation.startTime 
      ? Math.round((new Date(participation.submittedAt) - new Date(participation.startTime)) / 1000 / 60)
      : 0;

    // Map questions with user answers
    const questionsWithAnswers = participation.testSeries.questions.map((question, index) => {
      const userAnswer = answers[index] || null;
      const isCorrect = userAnswer === question.correctAnswers;
      
      return {
        id: question.id,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswers,
        userAnswer,
        isCorrect,
        explanation: question.explanation
      };
    });

    res.json({
      participant: {
        id: participation.pid,
        userId: participation.user?.id || 'unknown',
        name: participation.user?.fullName || 'Unknown User',
        email: participation.user?.email || 'No email',
        score: correctAnswers,
        totalQuestions,
        percentage: parseFloat(percentage),
        accuracy: parseFloat(percentage),
        timeTaken,
        submittedAt: participation.submittedAt,
        startTime: participation.startTime
      },
      contest: {
        id: participation.testSeries?.id || 'unknown',
        title: participation.testSeries?.title || 'Unknown Contest'
      },
      questions: questionsWithAnswers
    });
  } catch (error) {
    console.error('Error getting participant answers:', error);
    res.status(500).json({ message: error.message });
  }
};

// Export contest results as CSV
export const exportContestResults = async (req, res) => {
  try {
    const { id } = req.params;
    
    const participants = await prisma.participation.findMany({
      where: {
        testSeriesId: Number(id),
        contest: true
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    // Get results for all participants
    const participantsWithResults = await Promise.all(
      participants.map(async (participation) => {
        const result = await prisma.result.findFirst({
          where: { pid: participation.id }
        });

        const totalQuestions = await prisma.question.count({
          where: {
            testSeries: {
              some: {
                id: Number(id)
              }
            }
          }
        });

        const correctAnswers = result?.correct || 0;
        const percentage = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : '0';
        const timeTaken = participation.submittedAt && participation.startTime 
          ? Math.round((new Date(participation.submittedAt) - new Date(participation.startTime)) / 1000 / 60)
          : 0;

        return {
          name: participation.user?.fullName || 'Unknown User',
          email: participation.user?.email || 'No email',
          score: correctAnswers,
          totalQuestions,
          percentage,
          timeTaken: `${timeTaken} minutes`,
          submittedAt: participation.submittedAt ? new Date(participation.submittedAt).toLocaleString() : 'Not submitted'
        };
      })
    );

    // Sort by score (highest first)
    participantsWithResults.sort((a, b) => b.score - a.score);

    // Create CSV content
    const csvHeaders = ['Rank', 'Name', 'Email', 'Score', 'Total Questions', 'Percentage', 'Time Taken', 'Submitted At'];
    const csvRows = participantsWithResults.map((participant, index) => [
      index + 1,
      participant.name,
      participant.email,
      participant.score,
      participant.totalQuestions,
      `${participant.percentage}%`,
      participant.timeTaken,
      participant.submittedAt
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const contest = await prisma.testSeries.findUnique({
      where: { id: Number(id) },
      select: { title: true }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${contest?.title || 'contest'}-results.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting contest results:', error);
    res.status(500).json({ message: error.message });
  }
};

// Download contest results as Excel with detailed answers
export const downloadContestResultsExcel = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Downloading Excel for contest ID:', id);
    console.log('User making request:', req.user);
    
    // Get contest details
    const contest = await prisma.testSeries.findUnique({
      where: { id: Number(id) },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            correctAnswers: true,
            level: true,
            category: true,
            subcategory: true
          }
        }
      }
    });

    if (!contest) {
      console.log('Contest not found for ID:', id);
      return res.status(404).json({ message: 'Contest not found' });
    }

    console.log('Found contest:', contest.title, 'with', contest.questions.length, 'questions');

    // Get all participants with their results
    const participants = await prisma.participation.findMany({
      where: {
        testSeriesId: Number(id),
        contest: true
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    console.log('Found participants:', participants.length);

    // Get detailed answers for each participant
    const participantsWithAnswers = await Promise.all(
      participants.map(async (participation) => {
        const answers = await prisma.studentActivity.findMany({
          where: { 
            sid: participation.sid,
            testSeriesId: participation.testSeriesId
          },
          include: {
            question: {
              select: {
                id: true,
                question: true,
                options: true,
                correctAnswers: true
              }
            }
          },
          orderBy: {
            qid: 'asc'
          }
        });

        const totalQuestions = contest.questions.length;
        const correctAnswers = answers.filter(a => a.selectedAnswer === a.question.correctAnswers).length;
        const percentage = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : '0';
        const timeTaken = participation.submittedAt && participation.startTime 
          ? Math.round((new Date(participation.submittedAt) - new Date(participation.startTime)) / 1000 / 60)
          : 0;

        return {
          participant: {
            name: participation.user?.fullName || 'Unknown User',
            email: participation.user?.email || 'No email',
            score: correctAnswers,
            totalQuestions,
            percentage,
            timeTaken,
            submittedAt: participation.submittedAt ? new Date(participation.submittedAt).toLocaleString() : 'Not submitted',
            rank: 0 // Will be calculated later
          },
          answers: answers.map(answer => ({
            questionId: answer.qid,
            question: answer.question.question,
            options: answer.question.options,
            userAnswer: answer.selectedAnswer,
            correctAnswer: answer.question.correctAnswers,
            isCorrect: answer.selectedAnswer === answer.question.correctAnswers,
            questionNumber: contest.questions.findIndex(q => q.id === answer.qid) + 1
          }))
        };
      })
    );

    // Sort by score (highest first) and assign ranks
    participantsWithAnswers.sort((a, b) => b.participant.score - a.participant.score);
    participantsWithAnswers.forEach((participant, index) => {
      participant.participant.rank = index + 1;
    });

    // Create Excel workbook using exceljs
    const workbook = new ExcelJS.Workbook();

    // Summary worksheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Rank', key: 'rank', width: 8 },
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Total Questions', key: 'totalQuestions', width: 16 },
      { header: 'Percentage', key: 'percentage', width: 12 },
      { header: 'Time Taken (minutes)', key: 'timeTaken', width: 20 },
      { header: 'Submitted At', key: 'submittedAt', width: 24 }
    ];
    participantsWithAnswers.forEach(p => {
      summarySheet.addRow({
        rank: p.participant.rank,
        name: p.participant.name,
        email: p.participant.email,
        score: p.participant.score,
        totalQuestions: p.participant.totalQuestions,
        percentage: `${p.participant.percentage}%`,
        timeTaken: p.participant.timeTaken,
        submittedAt: p.participant.submittedAt
      });
    });

    // Detailed answers worksheets per participant
    participantsWithAnswers.forEach((participant) => {
      const participantName = participant.participant.name.replace(/[^a-zA-Z0-9]/g, '_');
      const sheetName = `${participant.participant.rank}_${participantName}`.substring(0, 31);
      const ws = workbook.addWorksheet(sheetName);
      ws.columns = [
        { header: 'Question Number', key: 'questionNumber', width: 16 },
        { header: 'Question', key: 'question', width: 80 },
        { header: 'Options', key: 'options', width: 60 },
        { header: 'User Answer', key: 'userAnswer', width: 14 },
        { header: 'Correct Answer', key: 'correctAnswer', width: 16 },
        { header: 'Status', key: 'status', width: 12 }
      ];
      participant.answers.forEach(answer => {
        ws.addRow({
          questionNumber: answer.questionNumber,
          question: answer.question,
          options: JSON.stringify(answer.options),
          userAnswer: answer.userAnswer || 'Not answered',
          correctAnswer: answer.correctAnswer,
          status: answer.isCorrect ? 'Correct' : (answer.userAnswer ? 'Incorrect' : 'Not answered')
        });
      });
    });

    // Questions worksheet
    const questionsSheet = workbook.addWorksheet('Questions');
    questionsSheet.columns = [
      { header: 'Question Number', key: 'number', width: 16 },
      { header: 'Question', key: 'question', width: 80 },
      { header: 'Options', key: 'options', width: 60 },
      { header: 'Correct Answer(s)', key: 'correct', width: 20 },
      { header: 'Level', key: 'level', width: 12 },
      { header: 'Category', key: 'category', width: 16 },
      { header: 'Subcategory', key: 'subcategory', width: 16 }
    ];
    contest.questions.forEach((q, index) => {
      questionsSheet.addRow({
        number: index + 1,
        question: q.question,
        options: JSON.stringify(q.options),
        correct: Array.isArray(q.correctAnswers) ? q.correctAnswers.join(', ') : '',
        level: q.level,
        category: q.category,
        subcategory: q.subcategory
      });
    });

    // Generate Excel as buffer and send
    const fileName = `${contest.title}_Detailed_Results_${new Date().toISOString().split('T')[0]}.xlsx`;
    const excelBuffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.byteLength);
    res.send(Buffer.from(excelBuffer));
  } catch (error) {
    console.error('Error downloading contest results Excel:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

// Get detailed analysis for contest
export const getDetailedAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Getting detailed analysis for contest ID:', id);
    
    // Get contest with questions
    const contest = await prisma.testSeries.findUnique({
      where: { id: Number(id) },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            correctAnswers: true,
            level: true,
            category: true,
            subcategory: true
          }
        }
      }
    });

    if (!contest) {
      console.log('Contest not found for detailed analysis ID:', id);
      return res.status(404).json({ message: 'Contest not found' });
    }

    console.log('Found contest for analysis:', contest.title, 'with', contest.questions.length, 'questions');

    // Get all participants with their answers
    const participants = await prisma.participation.findMany({
      where: {
        testSeriesId: Number(id),
        contest: true
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        },
        // We'll get answers separately since they're in StudentActivity
      }
    });

    // Get all answers for this contest
    const allAnswers = await prisma.studentActivity.findMany({
      where: {
        testSeriesId: Number(id)
      },
      include: {
        question: {
          select: {
            id: true,
            question: true,
            options: true,
            correctAnswers: true,
            level: true,
            category: true,
            subcategory: true
          }
        }
      }
    });

    // Question Analysis with option counts
    const questionAnalysis = contest.questions.map(question => {
      const answersForQuestion = allAnswers.filter(a => a.qid === question.id);

      const correctAnswers = answersForQuestion.filter(a =>
        a.selectedAnswer === question.correctAnswers
      ).length;

      const successRate = answersForQuestion.length > 0 ?
        (correctAnswers / answersForQuestion.length) * 100 : 0;

      // Count selections per option and not attempted
      const optionCounts = { a: 0, b: 0, c: 0, d: 0, notAttempted: 0 };
      answersForQuestion.forEach(a => {
        const value = (a.selectedAnswer || '').toLowerCase();
        if (!value || value === 'null') {
          optionCounts.notAttempted += 1;
        } else if (['a','b','c','d'].includes(value)) {
          optionCounts[value] += 1;
        } else {
          optionCounts.notAttempted += 1;
        }
      });

      return {
        questionId: question.id,
        question: question.question,
        options: question.options,
        difficulty: question.level || 'medium',
        category: question.category || 'General',
        subcategory: question.subcategory || 'General',
        successRate,
        totalAttempts: answersForQuestion.length,
        correctAttempts: correctAnswers,
        optionCounts
      };
    });

    // Performance Metrics
    const performanceMetrics = {
      totalParticipants: participants.length,
      completedParticipants: participants.filter(p => p.submittedAt).length,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      standardDeviation: 0
    };

    if (participants.length > 0) {
      const scores = participants.map(p => {
        const participantAnswers = allAnswers.filter(a => a.sid === p.sid);
        const correctAnswers = participantAnswers.filter(a => 
          a.selectedAnswer === a.question.correctAnswers
        ).length;
        return correctAnswers;
      });

      performanceMetrics.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      performanceMetrics.highestScore = Math.max(...scores);
      performanceMetrics.lowestScore = Math.min(...scores);
      
      const mean = performanceMetrics.averageScore;
      const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
      performanceMetrics.standardDeviation = Math.sqrt(variance);
    }

    // Time Analysis
    const timeAnalysis = {};
    participants.forEach(participant => {
      if (participant.startTime && participant.submittedAt) {
        const timeTaken = Math.round((new Date(participant.submittedAt) - new Date(participant.startTime)) / (1000 * 60));
        
        let timeRange;
        if (timeTaken <= 30) timeRange = '0-30 min';
        else if (timeTaken <= 60) timeRange = '31-60 min';
        else if (timeTaken <= 90) timeRange = '61-90 min';
        else timeRange = '90+ min';
        
        timeAnalysis[timeRange] = (timeAnalysis[timeRange] || 0) + 1;
      }
    });

    // Category Analysis (fixed to use StudentActivity instead of non-existent p.answers)
    const categoryAnalysis = {};
    contest.questions.forEach(question => {
      const category = question.category || 'General';
      if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = {
          questionCount: 0,
          totalAttempts: 0,
          correctAttempts: 0,
          averageScore: 0,
          successRate: 0
        };
      }

      categoryAnalysis[category].questionCount++;

      const answersForQuestion = allAnswers.filter(a => a.qid === question.id);

      categoryAnalysis[category].totalAttempts += answersForQuestion.length;
      categoryAnalysis[category].correctAttempts += answersForQuestion.filter(a =>
        a.selectedAnswer === question.correctAnswers
      ).length;
    });

    // Calculate category metrics
    Object.keys(categoryAnalysis).forEach(category => {
      const data = categoryAnalysis[category];
      data.averageScore = data.totalAttempts > 0 ? data.correctAttempts / data.totalAttempts : 0;
      data.successRate = data.totalAttempts > 0 ? (data.correctAttempts / data.totalAttempts) * 100 : 0;
    });

    console.log('Detailed analysis completed successfully');
    res.json({
      questionAnalysis,
      performanceMetrics,
      timeAnalysis,
      categoryAnalysis,
      totalQuestions: contest.questions.length
    });
  } catch (error) {
    console.error('Error getting detailed analysis:', error);
    res.status(500).json({ message: error.message });
  }
};






