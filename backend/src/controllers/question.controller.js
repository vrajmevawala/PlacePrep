import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

// Multer setup for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Add a new question (admin/moderator only)
export const addQuestion = async (req, res) => {
  try {
    const { category, subcategory, level, question, options, explanation, visibility } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ message: 'Only admin or moderator can add questions.' });
    }

    if (!category || !subcategory || !level || !question || !options || !Array.isArray(options)) {
      return res.status(400).json({ message: 'All required fields must be provided. Options must be an array.' });
    }
    
    // Validate options array has 4 elements
    if (options.length !== 4) {
      return res.status(400).json({ message: 'Options must be an array with exactly 4 elements.' });
    }
    
    // Validate all options have content
    if (options.some(opt => !opt || opt.trim() === '')) {
      return res.status(400).json({ message: 'All options must have content.' });
    }
    
    const normalizedCorrectAnswers = Array.isArray(req.body.correctAnswers)
      ? req.body.correctAnswers.map(s => String(s).trim()).filter(Boolean)
      : (req.body.correctAnswers || req.body.correctAns)
        ? String(req.body.correctAnswers || req.body.correctAns).split(',').map(s => s.trim()).filter(Boolean)
        : [];

    if (normalizedCorrectAnswers.length === 0) {
      return res.status(400).json({ message: 'At least one correct answer must be provided.' });
    }
    
    // Validate that correct answers exist in options
    const validCorrectAnswers = normalizedCorrectAnswers.filter(correct => 
      options.some(opt => opt.trim() === correct.trim())
    );
    
    if (validCorrectAnswers.length === 0) {
      return res.status(400).json({ message: 'Correct answers must match one of the provided options exactly.' });
    }

    const newQuestion = await prisma.question.create({
      data: {
        category,
        subcategory,
        level,
        question,
        options,
        correctAnswers: normalizedCorrectAnswers,
        explanation: explanation || '',
        visibility: visibility !== undefined ? visibility : true,
        createdBy: userId,
      },
    });

    res.status(201).json({ question: newQuestion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add questions from Excel file (admin/moderator only)
export const addQuestionsFromExcel = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ message: 'Only admin or moderator can add questions.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    // Parse Excel file using exceljs
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];
    const rows = [];
    // Read header row to map columns
    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values.map(v => (typeof v === 'string' ? v.trim() : v));
    const headerIndexMap = new Map();
    headers.forEach((name, idx) => {
      if (typeof name === 'string' && name.length > 0) headerIndexMap.set(name, idx);
    });
    for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      if (!row || row.cellCount === 0) continue;
      const record = {
        category: row.getCell(headerIndexMap.get('category') || 1).value ?? '',
        subcategory: row.getCell(headerIndexMap.get('subcategory') || 2).value ?? '',
        level: row.getCell(headerIndexMap.get('level') || 3).value ?? '',
        question: row.getCell(headerIndexMap.get('question') || 4).value ?? '',
        options: row.getCell(headerIndexMap.get('options') || 5).value ?? '',
        correctAnswers: row.getCell(headerIndexMap.get('correctAnswers') || 6).value ?? '',
        explanation: row.getCell(headerIndexMap.get('explanation') || 7).value ?? '',
        visibility: row.getCell(headerIndexMap.get('visibility') || 8).value
      };
      // Convert RichText/object values to primitive strings
      Object.keys(record).forEach(key => {
        const value = record[key];
        if (value && typeof value === 'object' && 'text' in value) {
          record[key] = value.text;
        } else if (value && typeof value === 'object' && 'richText' in value) {
          record[key] = value.richText.map(t => t.text).join('');
        }
      });
      rows.push(record);
    }
    
    // Get visibility from form data or default to true
    const defaultVisibility = req.body.visibility === 'false' ? false : true;
    
    // Validate and insert questions
    const questionsToInsert = rows.map(row => ({
      category: row.category,
      subcategory: row.subcategory,
      level: row.level,
      question: row.question,
      options: typeof row.options === 'string' ? 
        (row.options.startsWith('[') ? JSON.parse(row.options) : row.options.split(',').map(s => s.trim())) : 
        (Array.isArray(row.options) ? row.options : []),
      correctAnswers: row.correctAnswers
        ? (Array.isArray(row.correctAnswers) ? row.correctAnswers : String(row.correctAnswers).split(',').map(s => s.trim()).filter(Boolean))
        : [],
      explanation: row.explanation || '',
      visibility: row.visibility !== undefined ? row.visibility : defaultVisibility,
      createdBy: userId,
    }));
    
    // Basic validation
    for (const q of questionsToInsert) {
      if (!q.category || !q.subcategory || !q.level || !q.question || !Array.isArray(q.options) || q.options.length !== 4 || !q.correctAnswers || q.correctAnswers.length === 0) {
        return res.status(400).json({ message: 'Missing required fields or invalid options structure in one or more rows.' });
      }
      
      // Validate all options have content
      if (q.options.some(opt => !opt || opt.trim() === '')) {
        return res.status(400).json({ message: 'All options must have content in one or more rows.' });
      }
      
      // Validate that correct answers exist in options
      const validCorrectAnswers = q.correctAnswers.filter(correct => 
        q.options.some(opt => opt.trim() === correct.trim())
      );
      
      if (validCorrectAnswers.length === 0) {
        return res.status(400).json({ message: 'Correct answers must match one of the provided options exactly in one or more rows.' });
      }
    }
    const createdQuestions = await prisma.question.createMany({ data: questionsToInsert });
    res.status(201).json({ message: `${createdQuestions.count} questions added.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add questions from JSON file (admin/moderator only)
export const addQuestionsFromJson = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ message: 'Only admin or moderator can add questions.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    let rows;
    try {
      rows = JSON.parse(req.file.buffer.toString('utf-8'));
    } catch (err) {
      return res.status(400).json({ message: 'Invalid JSON file.' });
    }
    if (!Array.isArray(rows)) {
      return res.status(400).json({ message: 'JSON must be an array of questions.' });
    }
    
    // Get visibility from form data or default to true
    const defaultVisibility = req.body.visibility === 'false' ? false : true;
    
    // Validate and insert questions
    const questionsToInsert = rows.map(q => ({
      category: q.category,
      subcategory: q.subcategory,
      level: q.level,
      question: q.question,
      options: Array.isArray(q.options) ? q.options : 
        (typeof q.options === 'string' ? q.options.split(',').map(s => s.trim()) : []),
      correctAnswers: q.correctAnswers
        ? (Array.isArray(q.correctAnswers) ? q.correctAnswers : String(q.correctAnswers).split(',').map(s => s.trim()).filter(Boolean))
        : [],
      explanation: q.explanation || '',
      visibility: q.visibility !== undefined ? q.visibility : defaultVisibility,
      createdBy: userId,
    }));
    
    // Basic validation
    for (const q of questionsToInsert) {
      if (!q.category || !q.subcategory || !q.level || !q.question || !Array.isArray(q.options) || q.options.length !== 4 || !q.correctAnswers || q.correctAnswers.length === 0) {
        return res.status(400).json({ message: 'Missing required fields or invalid options structure in one or more questions.' });
      }
      
      // Validate all options have content
      if (q.options.some(opt => !opt || opt.trim() === '')) {
        return res.status(400).json({ message: 'All options must have content in one or more questions.' });
      }
      
      // Validate that correct answers exist in options
      const validCorrectAnswers = q.correctAnswers.filter(correct => 
        q.options.some(opt => opt.trim() === correct.trim())
      );
      
      if (validCorrectAnswers.length === 0) {
        return res.status(400).json({ message: 'Correct answers must match one of the provided options exactly in one or more questions.' });
      }
    }
    const createdQuestions = await prisma.question.createMany({ data: questionsToInsert });
    res.status(201).json({ message: `${createdQuestions.count} questions added.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all questions (admin/moderator only)
export const getAllQuestions = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ message: 'Only admin or moderator can view questions.' });
    }
    const questions = await prisma.question.findMany({
      include: {
        author: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubcategories = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ message: 'Category is required.' });
    }
    const subcategories = await prisma.question.findMany({
      where: { category },
      select: { subcategory: true },
      distinct: ['subcategory']
    });
    const subcatList = subcategories.map(s => s.subcategory).filter(Boolean);
    if (!subcatList.includes('All')) subcatList.unshift('All');
    res.json({ subcategories: subcatList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const practiceQuestions = async (req, res) => {
  try {
    const { category, subcategory, level, num } = req.query;
    if (!category) {
      return res.status(400).json({ message: 'Category is required.' });
    }
    const where = {
      category,
      visibility: true
    };
    if (subcategory && subcategory !== '') {
      where.subcategory = { equals: decodeURIComponent(subcategory), mode: 'insensitive' };
    }
    if (level && level !== '') where.level = level;
    const take = num ? Number(num) : undefined;
    const questions = await prisma.question.findMany({
      where,
      ...(take ? { take } : {}),
      orderBy: { id: 'asc' },
      include: {
        author: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a question (admin/moderator only)
export const deleteQuestion = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ message: 'Only admin or moderator can delete questions.' });
    }
    const { id } = req.params;
    await prisma.question.delete({ where: { id: Number(id) } });
    res.json({ message: 'Question deleted successfully.' });
  } catch (error) {
    if (error.code === 'P2025') {
      // Prisma error for record not found
      return res.status(404).json({ message: 'Question not found.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Edit a question (admin/moderator only)
export const updateQuestion = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (!['admin', 'moderator'].includes(userRole)) {
      return res.status(403).json({ message: 'Only admin or moderator can edit questions.' });
    }
    const { id } = req.params;
    const { category, subcategory, level, question, options, explanation, visibility } = req.body;
    const normalizedCorrectAnswersUpdate = req.body.correctAnswers !== undefined || req.body.correctAns !== undefined
      ? (Array.isArray(req.body.correctAnswers)
          ? req.body.correctAnswers.map(s => String(s).trim()).filter(Boolean)
          : String((req.body.correctAnswers ?? req.body.correctAns) || '').split(',').map(s => s.trim()).filter(Boolean))
      : undefined;
    const updated = await prisma.question.update({
      where: { id: Number(id) },
      data: { 
        category, 
        subcategory, 
        level, 
        question, 
        options, 
        explanation, 
        visibility,
        ...(normalizedCorrectAnswersUpdate !== undefined ? { correctAnswers: normalizedCorrectAnswersUpdate } : {})
      }
    });
    res.json({ message: 'Question updated successfully.', question: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's bookmarked questions
export const getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, subcategory, level } = req.query;
    // Build question filter
    const questionFilter = { };
    if (category) questionFilter.category = category;
    if (subcategory) questionFilter.subcategory = { equals: decodeURIComponent(subcategory), mode: 'insensitive' };
    if (level) questionFilter.level = level;
    questionFilter.visibility = true;
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId,
        question: {
          ...questionFilter
        }
      },
      include: {
        question: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ bookmarks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a bookmark
export const addBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { questionId } = req.body;

    if (!questionId) {
      return res.status(400).json({ message: 'Question ID is required' });
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: Number(questionId) }
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        userId,
        questionId: Number(questionId)
      }
    });

    if (existingBookmark) {
      return res.status(400).json({ message: 'Question already bookmarked' });
    }

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        questionId: Number(questionId)
      },
      include: {
        question: true
      }
    });

    res.status(201).json({ bookmark });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a bookmark
export const removeBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { questionId } = req.body;

    if (!questionId) {
      return res.status(400).json({ message: 'Question ID is required' });
    }

    // Check if bookmark exists
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        userId,
        questionId: Number(questionId)
      }
    });

    if (!existingBookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }

    await prisma.bookmark.delete({
      where: { id: existingBookmark.id }
    });

    res.json({ message: 'Bookmark removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 