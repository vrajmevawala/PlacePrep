import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Create a new freePractice test (user starts a practice test)
export const createFreePractice = async (req, res) => {
  try {
    let { category, subcategory, level, numQuestions, title } = req.body;
    const userId = req.user.id;
    // Ensure subcategory is always a string
    if (!subcategory || subcategory === '' || subcategory === 'All') subcategory = 'All';

    // Fetch random questions matching criteria
    const questionWhere = { category, visibility: true };
    if (subcategory && subcategory !== 'All') questionWhere.subcategory = subcategory;
    if (level && level !== "") questionWhere.level = level;
    const take = Number(numQuestions); // Ensure it's a number
    
    // Get all questions first, then shuffle and take required number
    const allQuestions = await prisma.question.findMany({
      where: questionWhere,
    });
    
    if (allQuestions.length < numQuestions) {
      return res.status(400).json({ message: 'Not enough questions available.' });
    }
    
    // Shuffle the questions array
    const questions = allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, take);

    // Generate title if not provided
    let practiceTitle = title;
    if (!practiceTitle || practiceTitle.trim() === "") {
      const now = new Date();
      const pad = n => n.toString().padStart(2, '0');
      const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      practiceTitle = `${category}_${subcategory}_${dateStr}`;
    }
    // Create freePractice test
    const data = {
      title: practiceTitle,
      category,
      subcategory,
      createdBy: userId,
      startTime: new Date(),
      questions: {
        connect: questions.map(q => ({ id: q.id })),
      },
    };
    if (level && level !== "") data.level = level;
    const freePractice = await prisma.freePractice.create({
      data,
      include: { questions: { select: { id: true, question: true, options: true, level: true, category: true, subcategory: true } } },
    });

    res.status(201).json({ freePractice });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Submit a freePractice test (user finishes the test)
export const submitFreePractice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Only allow the creator to submit
    const freePractice = await prisma.freePractice.findUnique({ where: { id: Number(id) } });
    if (!freePractice || freePractice.createdBy !== userId) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    // Set endTime
    const updated = await prisma.freePractice.update({
      where: { id: Number(id) },
      data: { endTime: new Date() },
    });

    res.json({ message: 'Test submitted.', freePractice: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all freePractice tests for the logged-in user
export const getUserFreePractices = async (req, res) => {
  try {
    const userId = req.user.id;
    const tests = await prisma.freePractice.findMany({
      where: { createdBy: userId },
      include: { questions: { select: { id: true, question: true, options: true, level: true, category: true, subcategory: true } } },
    });
    res.json({ freePractices: tests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start a practice test (creates freePractice entry and returns questions)
export const startPracticeTest = async (req, res) => {
  try {
    let { category, subcategory, level, numQuestions } = req.body;
    const userId = req.user.id;
    // Ensure subcategory is always a string
    if (!subcategory || subcategory === '' || subcategory === 'All') subcategory = 'All';
    // Fetch random questions matching criteria
    const questionWhere2 = { category, visibility: true };
    if (subcategory && subcategory !== 'All') questionWhere2.subcategory = subcategory;
    if (level && level !== "") questionWhere2.level = level;
    const take2 = Number(numQuestions); // Ensure it's a number
    
    // Get all questions first, then shuffle and take required number
    const allQuestions = await prisma.question.findMany({
      where: questionWhere2,
    });
    
    if (allQuestions.length < numQuestions) {
      return res.status(400).json({ message: 'Not enough questions available.' });
    }
    
    // Shuffle the questions array
    const shuffledQuestions = allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, take2);
    // Generate title for practice test
    let practiceTitle2 = req.body.title;
    if (!practiceTitle2 || practiceTitle2.trim() === "") {
      const now = new Date();
      const pad = n => n.toString().padStart(2, '0');
      const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      practiceTitle2 = `${category}_${subcategory}_${dateStr}`;
    }
    // Create freePractice test
    const data2 = {
      title: practiceTitle2,
      category,
      subcategory,
      createdBy: userId,
      startTime: new Date(),
      questions: {
        connect: shuffledQuestions.map(q => ({ id: q.id })),
      },
    };
    if (level && level !== "") data2.level = level;
    const freePractice = await prisma.freePractice.create({
      data: data2,
    });
    // Create Participation entry with startTime as now and endTime null (until submitted)
    const now = new Date();
    await prisma.participation.create({
      data: {
        sid: userId,
        freePracticeId: freePractice.id,
        startTime: now,
        endTime: null,
        practiceTest: true,
        contest: false,
      }
    });
    res.status(201).json({ freePracticeId: freePractice.id, questions: shuffledQuestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit a practice test (updates endTime and logs student activity)
export const submitPracticeTest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { answers } = req.body; // [{ questionId, selectedOption }]
    // Only allow the creator to submit
    const freePractice = await prisma.freePractice.findUnique({ where: { id: Number(id) } });
    if (!freePractice || freePractice.createdBy !== userId) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    // Set endTime
    await prisma.freePractice.update({
      where: { id: Number(id) },
      data: { endTime: new Date() },
    });
    // Log student activity for each question
    const now = new Date();
    for (const ans of answers) {
      await prisma.studentActivity.create({
        data: {
          sid: userId,
          qid: ans.questionId,
          freePracticeId: Number(id),
          time: now,
          selectedAnswer: ans.selectedOption
        }
      });
    }
    // Update endTime of latest Participation for this user and freePractice
    await prisma.participation.updateMany({
      where: {
        sid: userId,
        freePracticeId: Number(id),
      },
      data: {
        endTime: now
      }
    });
    res.json({ message: 'Practice test submitted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Participation entries for freePractice for the logged-in user
export const getUserFreePracticeParticipations = async (req, res) => {
  try {
    const userId = req.user.id;
    const participations = await prisma.participation.findMany({
      where: {
        sid: userId,
        freePracticeId: { not: null },
        endTime: { not: null }
      },
      include: {
        freePractice: true
      },
      orderBy: { startTime: 'desc' }
    });
    res.json({ participations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get result for a free practice participation
export const getFreePracticeResult = async (req, res) => {
  try {
    const { pid } = req.query;
    const userId = req.user.id;
    if (!pid) return res.status(400).json({ message: 'Participation id required.' });
    const participation = await prisma.participation.findUnique({
      where: { pid: Number(pid) },
      include: { freePractice: { include: { questions: true } } }
    });
    if (!participation || participation.sid !== userId) {
      return res.status(404).json({ message: 'Participation not found.' });
    }
    // Do not expose results until the practice test is submitted
    if (!participation.endTime) {
      return res.status(403).json({ message: 'Result not available until the practice test is submitted.' });
    }
    const freePracticeId = participation.freePracticeId;
    const questions = participation.freePractice.questions;
    const totalQuestions = questions.length;
    if (totalQuestions <= 0) {
      return res.status(404).json({ message: 'No questions available for this practice test.' });
    }
    // Get all student activities for this participation
    const activities = await prisma.studentActivity.findMany({
      where: { sid: userId, freePracticeId },
    });
    let attempted = 0, correct = 0;
    const details = questions.map(q => {
      const act = activities.find(a => a.qid === q.id);
      const selected = act ? act.selectedAnswer : null;
      const isCorrect = selected != null && selected === q.correctAns;
      if (selected != null) attempted++;
      if (isCorrect) correct++;
      return {
        questionId: q.id,
        selected,
        correct: q.correctAns,
        isCorrect
      };
    });
    res.json({ attempted, correct, totalQuestions, details });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student dashboard stats
export const getStudentStats = async (req, res) => {
  try {
    const userId = req.user.id;
    // Example stats: tests taken, average score, time spent, completed
    const participations = await prisma.participation.findMany({ where: { sid: userId, freePracticeId: { not: null }, endTime: { not: null } } });
    const testsTaken = participations.length;
    const completed = participations.filter(p => p.endTime !== null).length;
    const totalTime = participations.reduce((sum, p) => {
      if (p.startTime && p.endTime) {
        return sum + (p.endTime - p.startTime);
      }
      return sum;
    }, 0);
    // Calculate average score (robust, even if no score field)
    let totalScore = 0;
    let scoredCount = 0;
    for (const p of participations) {
      // Fetch questions for this freePractice
      const freePractice = await prisma.freePractice.findUnique({
        where: { id: p.freePracticeId },
        include: { questions: true }
      });
      const totalQuestions = freePractice?.questions?.length || 0;
      const activities = await prisma.studentActivity.findMany({
        where: { sid: userId, freePracticeId: p.freePracticeId }
      });
      let correct = 0;
      if (freePractice && freePractice.questions) {
        for (const q of freePractice.questions) {
          const act = activities.find(a => a.qid === q.id);
          if (act && act.selectedAnswer === q.correctAns) correct++;
        }
      }
      if (totalQuestions > 0) {
        totalScore += (correct / totalQuestions) * 100;
        scoredCount++;
      }
    }
    const averageScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : null;
    // Calculate time spent in h/m
    let hours = Math.floor(totalTime / 3600000);
    let minutes = Math.round((totalTime % 3600000) / 60000);
    let timeSpent = hours > 0 ? `${hours}h${minutes > 0 ? ' ' + minutes + 'm' : ''}` : `${minutes}m`;
    const stats = [
      { label: 'Tests Taken', value: testsTaken },
      { label: 'Average Score', value: averageScore !== null ? `${averageScore}%` : 'N/A' },
      { label: 'Time Spent', value: timeSpent },
      { label: 'Completed', value: completed }
    ];
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get recent tests for student
export const getStudentRecentTests = async (req, res) => {
  try {
    const userId = req.user.id;
    // Get last 10 completed participations (freePractice)
    const participations = await prisma.participation.findMany({
      where: { sid: userId, freePracticeId: { not: null }, endTime: { not: null } },
      include: { freePractice: { include: { questions: true } } },
      orderBy: { startTime: 'desc' },
      take: 10
    });
    // Map to expected format
    const recentTests = await Promise.all(participations.map(async p => {
      let score = p.score;
      if (score == null) {
        // Calculate score from studentActivity
        const activities = await prisma.studentActivity.findMany({
          where: { sid: userId, freePracticeId: p.freePracticeId }
        });
        const freePractice = p.freePractice;
        const totalQuestions = freePractice?.questions?.length || 0;
        let correct = 0;
        if (freePractice && freePractice.questions) {
          for (const q of freePractice.questions) {
            const act = activities.find(a => a.qid === q.id);
            if (act && act.selectedAnswer === q.correctAns) correct++;
          }
        }
        score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : null;
      }
      return {
        name: p.freePractice?.title || 'Practice Test',
        score,
        date: p.startTime ? p.startTime.toISOString().split('T')[0] : '',
        type: p.freePractice?.category || 'Practice'
      };
    }));
    res.json(recentTests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: delete free practice tests by title (and optional date)
export const adminDeleteFreePracticeByTitle = async (req, res) => {
  try {
    const { title, date } = req.query;
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'title is required' });
    }

    // Build where clause
    const where = { title: title.trim() };
    if (date) {
      const day = new Date(date);
      if (!isNaN(day.getTime())) {
        const startOfDay = new Date(day);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(day);
        endOfDay.setHours(23, 59, 59, 999);
        where.startTime = { gte: startOfDay, lte: endOfDay };
      }
    }

    const targets = await prisma.freePractice.findMany({ where, select: { id: true } });
    if (!targets.length) {
      return res.status(404).json({ message: 'No matching free practice tests found.' });
    }

    let deletedCount = 0;
    for (const t of targets) {
      // Delete related activities and participations first to satisfy FK constraints
      await prisma.studentActivity.deleteMany({ where: { freePracticeId: t.id } });
      await prisma.participation.deleteMany({ where: { freePracticeId: t.id } });
      await prisma.freePractice.delete({ where: { id: t.id } });
      deletedCount += 1;
    }

    return res.json({ deleted: deletedCount, ids: targets.map(t => t.id) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
