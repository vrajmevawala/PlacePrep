import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.js';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

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
        const existingUser = await prisma.users.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const result = await prisma.users.create({
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
        console.log("Error in signup controller", error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userResult = await prisma.users.findUnique({ where: { email } });
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
            fullName: user.fullname || user.fullName,
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
        const existingUser = await prisma.users.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await prisma.users.create({
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
        res.status(201).json({
            _id: result.id,
            role: result.role,
            fullName: result.fullName,
            email: result.email,
        });
    } catch (error) {
        console.log("Error in createModerator controller", error.message);
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
        const { email, name } = payload;

        let userResult = await prisma.users.findUnique({ where: { email } });
        let user = userResult;

        if(!user){
            const insertResult = await prisma.users.create({
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
        }
        const token = jwt.sign(
            { userID: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.status(200).json({  
            token,
            user: {
                id: user.id,
                fullName: user.fullname || user.fullName,
                email: user.email,
                role: user.role,
            },  
        });
    } catch (error) {
        console.log("Error in googleAuth controller", error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const userResult = await prisma.users.findUnique({ where: { email } });
        const user = userResult;
        if (!user) {
            return res.status(404).json({ message: 'User is not registered' });
        }

        const resetToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS 
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset Your Password - Action Required',
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 40px;">
                    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                        <h2 style="color: #333333;">Password Reset Request</h2>
                        <p style="font-size: 16px; color: #555555;">
                            We received a request to reset your password. If you did not make this request, you can safely ignore this email.
                        </p>
                        <p style="font-size: 16px; color: #555555;">
                            To reset your password, click the button below. This link will expire in <strong>1 hour</strong>.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="background-color: #007BFF; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                Reset Password
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #999999;">
                            If the button doesn't work, you can copy and paste the following link into your browser:
                        </p>
                        <p style="font-size: 14px; color: #007BFF; word-break: break-all;">
                            ${resetLink}
                        </p>
                        <hr style="margin-top: 40px; border: none; border-top: 1px solid #eeeeee;" />
                        <p style="font-size: 12px; color: #aaaaaa; text-align: center;">
                            This email was sent automatically. Please do not reply to this message.
                        </p>
                    </div>
                </div>
            `
        };


        await transporter.sendMail(mailOptions);
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

        await prisma.users.update({
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