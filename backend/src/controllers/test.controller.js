import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


export const practiceTest = async (req, res) => {
    const { level, category, subcategory, numQuestions } = req.body;
    try {
    // Validate input
    if (!level || !category || !subcategory || !numQuestions) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Fetch questions matching criteria
    const questions = await getQuestions({ level, category, subcategory, limit: numQuestions });

    if (questions.length < numQuestions) {
      return res.status(400).json({ message: 'Not enough questions available for the selected criteria.' });
    }

    // Create the test object (you might want to save it in DB)
    const test = {
      level,
      category,
      subcategory,
      questions,
      createdAt: new Date(),
    };

    // Respond with the test
    res.status(201).json({ test });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
