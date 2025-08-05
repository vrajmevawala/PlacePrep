import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.js';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../lib/emailService.js';

export const signup = async (req, res) => {
    const { fullName, email, password, role } = req.body;
    
    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const result = await prisma.user.create({
            data: {
                role: role || 'user',
                fullName,
                email,
                password: hashedPassword
            },
            select: {
                id: true,
                role: true,
                fullName: true,
                email: true,
                created_at: true
            }
        });

        if (result) {
            // Send welcome notification
            const notificationService = req.app.get('notificationService');
            if (notificationService) {
                try {
                    await notificationService.notifyWelcome(result.id, result);
                } catch (error) {
                    console.error('Failed to send welcome notification:', error);
                }
            }

            // Send welcome email (non-blocking)
            sendWelcomeEmail(result.email, result.fullName)
                .then(() => {
                    console.log(`Welcome email sent to: ${result.email}`);
                })
                .catch((error) => {
                    console.error('Failed to send welcome email:', error);
                    // Don't block the signup process if email fails
                });

            generateToken(result.id, result.role, res);
            res.status(201).json({
                role: result.role,
                _id: result.id,
                fullName: result.fullName,
                email: result.email,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Error in signup controller:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userResult = await prisma.user.findUnique({ where: { email } });
        const user = userResult;
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        generateToken(user.id, user.role, res);
        res.status(200).json({
            role: user.role,
            _id: user.id,
            fullName: user.fullName,
            email: user.email,
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const createModerator = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const result = await prisma.user.create({
            data: {
                role: 'moderator',
                fullName,
                email,
                password: hashedPassword
            },
            select: {
                id: true,
                role: true,
                fullName: true,
                email: true,
                created_at: true
            }
        });
        
        // Send welcome email to new moderator (non-blocking)
        sendWelcomeEmail(result.email, result.fullName)
            .then(() => {
                console.log(`Welcome email sent to new moderator: ${result.email}`);
            })
            .catch((error) => {
                console.error('Failed to send welcome email to moderator:', error);
            });
        
        res.status(201).json({
            _id: result.id,
            role: result.role,
            fullName: result.fullName,
            email: result.email,
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const googleAuth = async (req, res) => {
    const { id_token } = req.body;
    
    if(!id_token){
        return res.status(400).json({ message: "ID token is missing" });
    }
    
    try {
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        let userResult = await prisma.user.findUnique({ where: { email } });
        let user = userResult;

        if(!user){
            const insertResult = await prisma.user.create({
                data: {
                    role: 'user',
                    fullName: name,
                    email,
                    password: 'google-oauth'
                },
                select: {
                    id: true,
                    role: true,
                    fullName: true,
                    email: true,
                    created_at: true
                }
            });
            user = insertResult;
            
            // Send welcome email for new Google OAuth users (non-blocking)
            sendWelcomeEmail(user.email, user.fullName)
                .then(() => {
                    console.log(`Welcome email sent to Google OAuth user: ${user.email}`);
                })
                .catch((error) => {
                    console.error('Failed to send welcome email to Google OAuth user:', error);
                });
        }
        
        const token = jwt.sign(
            { userID: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        generateToken(user.id, user.role, res);
        
        const responseData = {
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },  
        };
        
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error in googleAuth controller:", error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const userResult = await prisma.user.findUnique({ where: { email } });
        const user = userResult;
        if (!user) {
            return res.status(404).json({ message: 'User is not registered' });
        }

        const resetToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        await sendPasswordResetEmail(email, resetLink);
        res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (error) {
        console.log('Error in forgotPassword controller', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.log('Error in resetPassword controller', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'Reset token has expired.' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const me = async (req, res) => {
    try {
        // User is already authenticated by authMiddleware
        // Just return the user data from the request object
        res.status(200).json({
            _id: req.user.id,
            role: req.user.role,
            fullName: req.user.fullName,
            email: req.user.email
        });
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, role: true }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'user' } });
    const totalModerators = await prisma.user.count({ where: { role: 'moderator' } });
    const totalTests = await prisma.testSeries.count();
    // Calculate success rate (example: average score from Activity logs)
    const scores = await prisma.Activity.findMany({
      where: { score: { not: null } },
      select: { score: true }
    });
    const successRate = scores.length
      ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
      : 0;

    res.json({
      totalUsers,
      totalModerators,
      totalTests,
      successRate
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getModerators = async (req, res) => {
  try {
    const moderators = await prisma.user.findMany({
      where: { role: 'moderator' },
      select: {
        id: true,
        fullName: true,
        email: true,
        testSeries: {
          select: { startTime: true } 
        }
      }
    });

    const result = moderators.map(m => {
      const testsCreated = m.testSeries.length;
      let lastActive = null;
      if (testsCreated > 0) {
        lastActive = m.testSeries.reduce(
          (latest, t) => t.startTime > latest ? t.startTime : latest,
          m.testSeries[0].startTime
        );
      }
      const status = testsCreated > 0 ? 'Active' : 'Inactive';
      return {
        id: m.id,
        name: m.fullName,
        email: m.email,
        status,
        testsCreated,
        lastActive
      };
    });

    res.json({ moderators: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getUserAnalytics = async (req, res) => {
  try {
    // Example: join user and activity tables, adjust as per your schema
    const analytics = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        activities: true // or join with your activity table
      }
    });
    res.json({ analytics });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const logs = await prisma.Activity.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteModerator = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the user exists and is a moderator
    const moderator = await prisma.user.findFirst({
      where: { 
        id: parseInt(id),
        role: 'moderator'
      }
    });

    if (!moderator) {
      return res.status(404).json({ message: 'Moderator not found' });
    }

    // Delete the moderator
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Moderator deleted successfully' });
  } catch (error) {
    console.error('Error deleting moderator:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

