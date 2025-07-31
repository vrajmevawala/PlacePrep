import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.middleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyBrrB6b2ju8NvJuti0s5Jq32");

// Validate API key on startup
console.log('Gemini API Key configured:', process.env.GEMINI_API_KEY ? 'Yes' : 'No (using fallback)');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resources/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
    }
  }
});

// Add new resource
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  // Handle multer errors
  if (req.fileValidationError) {
    return res.status(400).json({ message: req.fileValidationError });
  }
  try {
    const { type, title, description, category, subcategory, level } = req.body;
    
    // Check if user has permission (admin or moderator)
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ message: 'Access denied. Only admins and moderators can add resources.' });
    }

    let resourceData = {
      title,
      description,
      category,
      subcategory,
      level,
      createdBy: req.user.id,
      type: type.toUpperCase()
    };

    if (type === 'mcq') {
      const { question, correctAnswer, explanation } = req.body;
      
      // Extract options from form data
      const options = [];
      for (let i = 0; i < 4; i++) {
        if (req.body[`options[${i}]`]) {
          options.push(req.body[`options[${i}]`]);
        }
      }
      
      // Create MCQ
      const mcq = await prisma.question.create({
        data: {
          question,
          options: options,
          correctAns: options[parseInt(correctAnswer)],
          explanation,
          category,
          subcategory,
          level,
          createdBy: req.user.id,
          visibility: true
        }
      });

      return res.status(201).json({
        message: 'MCQ added successfully',
        resource: mcq
      });

    } else if (type === 'pdf') {
      if (!req.file) {
        return res.status(400).json({ message: 'PDF file is required' });
      }

      // Create PDF resource
      const pdfResource = await prisma.resource.create({
        data: {
          ...resourceData,
          fileUrl: req.file.path,
          fileName: req.file.originalname,
          fileSize: req.file.size
        }
      });

      return res.status(201).json({
        message: 'PDF resource added successfully',
        resource: pdfResource
      });

    } else if (type === 'video') {
      const { videoUrl } = req.body;
      
      if (!videoUrl) {
        return res.status(400).json({ message: 'Video URL is required' });
      }

      // Create video resource
      const videoResource = await prisma.resource.create({
        data: {
          ...resourceData,
          videoUrl
        }
      });

      return res.status(201).json({
        message: 'Video resource added successfully',
        resource: videoResource
      });

    } else {
      return res.status(400).json({ message: 'Invalid resource type' });
    }

  } catch (error) {
    console.error('Error adding resource:', error);
    res.status(500).json({ message: 'Failed to add resource' });
  }
});

// Get all resources
router.get('/', async (req, res) => {
  try {
    const { type, category, level } = req.query;
    
    const where = {};
    if (type) where.type = type.toUpperCase();
    if (category) where.category = category;
    if (level) where.level = level;

    const resources = await prisma.resource.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Failed to fetch resources' });
  }
});

// Download PDF resource
router.get('/download/:id', async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (resource.type !== 'PDF' || !resource.fileUrl) {
      return res.status(400).json({ message: 'This resource is not a downloadable PDF' });
    }

    // Check if file exists
    if (!fs.existsSync(resource.fileUrl)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resource.fileName || 'document.pdf'}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(resource.fileUrl);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ message: 'Failed to download resource' });
  }
});

// Bookmark a resource
router.post('/bookmark/:id', authMiddleware, async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    
    // Check if resource exists
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        userId: req.user.id,
        resourceId: resourceId
      }
    });

    if (existingBookmark) {
      return res.status(400).json({ message: 'Resource already bookmarked' });
    }

    // Create bookmark
    await prisma.bookmark.create({
      data: {
        userId: req.user.id,
        resourceId: resourceId
      }
    });

    res.json({ message: 'Resource bookmarked successfully' });
  } catch (error) {
    console.error('Error bookmarking resource:', error);
    res.status(500).json({ message: 'Failed to bookmark resource' });
  }
});

// Remove bookmark
router.delete('/bookmark/:id', authMiddleware, async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    
    // Delete bookmark
    await prisma.bookmark.deleteMany({
      where: {
        userId: req.user.id,
        resourceId: resourceId
      }
    });

    res.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ message: 'Failed to remove bookmark' });
  }
});

// Get user's bookmarked resources
router.get('/bookmarks', authMiddleware, async (req, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: req.user.id,
        resourceId: { not: null }
      },
      include: {
        resource: {
          include: {
            creator: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ bookmarks });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Failed to fetch bookmarks' });
  }
});

// Get all bookmarks (questions and resources)
router.get('/all-bookmarks', authMiddleware, async (req, res) => {
  try {
    const { category, subcategory, level, type } = req.query;
    
    // Build where clause for filtering
    const whereClause = {
      userId: req.user.id,
      OR: [
        { questionId: { not: null } },
        { resourceId: { not: null } }
      ]
    };

    // Add filters if provided
    if (category || subcategory || level || type) {
      whereClause.AND = [];
      
      if (category) {
        whereClause.AND.push({
          OR: [
            { question: { category } },
            { resource: { category } }
          ]
        });
      }
      
      if (subcategory) {
        whereClause.AND.push({
          OR: [
            { question: { subcategory } },
            { resource: { subcategory } }
          ]
        });
      }
      
      if (level) {
        whereClause.AND.push({
          OR: [
            { question: { level } },
            { resource: { level } }
          ]
        });
      }
      
      if (type) {
        whereClause.AND.push({
          resource: { type }
        });
      }
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: whereClause,
      include: {
        question: {
          include: {
            author: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        },
        resource: {
          include: {
            creator: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ bookmarks });
  } catch (error) {
    console.error('Error fetching all bookmarks:', error);
    res.status(500).json({ message: 'Failed to fetch bookmarks' });
  }
});

// Remove bookmark (for both questions and resources)
router.post('/remove-bookmark', authMiddleware, async (req, res) => {
  try {
    const { questionId, resourceId } = req.body;
    
    if (!questionId && !resourceId) {
      return res.status(400).json({ message: 'Either questionId or resourceId is required' });
    }

    const whereClause = {
      userId: req.user.id
    };

    if (questionId) {
      whereClause.questionId = parseInt(questionId);
    }

    if (resourceId) {
      whereClause.resourceId = parseInt(resourceId);
    }

    await prisma.bookmark.deleteMany({
      where: whereClause
    });

    res.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ message: 'Failed to remove bookmark' });
  }
});

// Test Gemini API connection
router.get('/ai/test', authMiddleware, async (req, res) => {
  try {
    // Test with a simple prompt
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Hello, this is a test message.");
    const response = await result.response;
    const text = response.text();
    
    res.json({ 
      success: true,
      message: 'API connection successful',
      response: text
    });
  } catch (error) {
    console.error('Gemini API test error:', error);
    
    // Provide more detailed error information
    let errorMessage = 'API connection failed';
    if (error.message.includes('API key')) {
      errorMessage = 'Invalid API key. Please check your Gemini API key.';
    } else if (error.message.includes('models/')) {
      errorMessage = 'Model not found. Please check API key and model availability.';
    } else if (error.status === 404) {
      errorMessage = 'API endpoint not found. Please check API configuration.';
    }
    
    res.status(500).json({ 
      success: false,
      message: errorMessage,
      error: error.message,
      suggestion: 'Please verify your Gemini API key is correct and has proper permissions.'
    });
  }
});

// AI Assistant Chat
router.post('/ai/chat', authMiddleware, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Create a more intelligent prompt based on context
    let systemPrompt = `You are an AI study assistant for a placement preparation platform. You help students with:

1. Aptitude questions and problem-solving techniques
2. DSA (Data Structures and Algorithms) concepts and implementations
3. Technical interview preparation
4. General education and learning guidance

Current context: ${context || 'General study assistance'}

Please provide helpful, accurate, and educational responses. If you're not sure about something, say so rather than guessing.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent([systemPrompt, message]);
    const response = await result.response;
    const text = response.text();

    res.json({ 
      message: text,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to get AI response';
    if (error.message.includes('API key')) {
      errorMessage = 'Invalid API key. Please check your Gemini API key.';
    } else if (error.message.includes('models/')) {
      errorMessage = 'Model not found. Please check API key and model availability.';
    } else if (error.status === 404) {
      errorMessage = 'API endpoint not found. Please check API configuration.';
    }
    
    res.status(500).json({ 
      message: errorMessage,
      suggestion: 'Please verify your Gemini API key is correct and has proper permissions.'
    });
  }
});

// AI File Analysis (PDF/Image)
router.post('/ai/analyze', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const { analysisType } = req.body; // 'summary', 'explanation', 'questions'
    
    // Read the file
    const fileBuffer = fs.readFileSync(req.file.path);
    const mimeType = req.file.mimetype;
    
    let model;
    let prompt;
    let content;
    
    if (mimeType === 'application/pdf') {
      // For PDFs, use Gemini Pro Vision
      model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const imageData = {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType
        }
      };
      
      prompt = `Analyze this educational content from a PDF and provide a comprehensive ${analysisType || 'summary'}. 
      
      Please provide:
      - Key concepts and topics covered
      - Important formulas, algorithms, or technical terms mentioned
      - Study recommendations and learning points
      - Practice questions if relevant to the content
      - Summary of main educational value
      
      Analysis type: ${analysisType || 'summary'}
      
      Format your response in a clear, structured manner suitable for students.`;
      
      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      return res.json({ 
        analysis: text,
        type: 'pdf',
        timestamp: new Date()
      });
      
    } else if (mimeType.startsWith('image/')) {
      // For images, use Gemini Pro Vision
      model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const imageData = {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType
        }
      };
      
      prompt = `Analyze this educational image and provide a comprehensive ${analysisType || 'explanation'}. 
      
      Please include:
      - What the image shows or represents
      - Key concepts or topics covered
      - Educational value and learning points
      - How it relates to aptitude, DSA, or technical education
      - Study recommendations based on the content
      
      Analysis type: ${analysisType || 'explanation'}`;
      
      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      return res.json({ 
        analysis: text,
        type: 'image',
        timestamp: new Date()
      });
    } else {
      return res.status(400).json({ message: 'Unsupported file type' });
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({ 
      analysis: text,
      type: 'pdf',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error in AI file analysis:', error);
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Provide more detailed error information
    let errorMessage = 'Failed to analyze file';
    if (error.message.includes('API key')) {
      errorMessage = 'Invalid API key. Please check your Gemini API key.';
    } else if (error.message.includes('models/')) {
      errorMessage = 'Model not found. Please check API key and model availability.';
    } else if (error.status === 404) {
      errorMessage = 'API endpoint not found. Please check API configuration.';
    }
    
    res.status(500).json({ 
      message: errorMessage,
      suggestion: 'Please verify your Gemini API key is correct and has proper permissions.'
    });
  }
});

// Get resource by ID
router.get('/:id', async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json(resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ message: 'Failed to fetch resource' });
  }
});

// Update resource
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(id) }
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const updatedResource = await prisma.resource.update({
      where: { id: parseInt(id) },
      data: req.body
    });

    res.json(updatedResource);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ message: 'Failed to update resource' });
  }
});

// Delete resource
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ message: 'Access denied. Only admins and moderators can delete resources.' });
    }

    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(id) }
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Delete associated file if it exists
    if (resource.fileUrl && fs.existsSync(resource.fileUrl)) {
      fs.unlinkSync(resource.fileUrl);
    }

    // Delete associated bookmarks
    await prisma.bookmark.deleteMany({
      where: { resourceId: parseInt(id) }
    });

    await prisma.resource.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: 'Failed to delete resource' });
  }
});

// Delete MCQ (question)
router.delete('/mcq/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ message: 'Access denied. Only admins and moderators can delete MCQs.' });
    }

    const question = await prisma.question.findUnique({
      where: { id: parseInt(id) }
    });

    if (!question) {
      return res.status(404).json({ message: 'MCQ not found' });
    }

    // Delete associated bookmarks
    await prisma.bookmark.deleteMany({
      where: { questionId: parseInt(id) }
    });

    // Delete the question
    await prisma.question.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'MCQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting MCQ:', error);
    res.status(500).json({ message: 'Failed to delete MCQ' });
  }
});

export default router; 