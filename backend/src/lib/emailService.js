import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
    console.log('Email sending will be skipped due to missing credentials');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS 
    }
  });
};

// Send welcome email to new users
export const sendWelcomeEmail = async (email, fullName) => {
  try {
    const transporter = createTransporter();
    
    // Skip email sending if transporter is null (missing credentials)
    if (!transporter) {
      return;
    }
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to PlacePrep - Your Success Journey Begins',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to PlacePrep</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 1px;">Welcome to PlacePrep</h1>
                      <p style="color: #e3f2fd; margin: 10px 0 0 0; font-size: 16px; font-weight: 300;">Your Gateway to Success</p>
                    </td>
                  </tr>

                  <!-- Welcome Message -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Hello ${fullName},</h2>
                      <p style="color: #555555; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                        Welcome to PlacePrep! We're thrilled to have you join our community of learners and achievers. Your journey towards professional excellence starts now.
                      </p>
                      <p style="color: #555555; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                        At PlacePrep, we provide comprehensive preparation resources, live contests, and personalized learning experiences to help you achieve your career goals.
                      </p>
                    </td>
                  </tr>

                  <!-- Features Grid -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="padding: 0 10px 20px 0; width: 50%;">
                            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #007bff; height: 100%;">
                              <div style="font-size: 28px; margin-bottom: 15px;">🎯</div>
                              <h3 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Live Contests</h3>
                              <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.5;">Participate in real-time competitions and benchmark your skills against peers.</p>
                            </div>
                          </td>
                          <td style="padding: 0 0 20px 10px; width: 50%;">
                            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #28a745; height: 100%;">
                              <div style="font-size: 28px; margin-bottom: 15px;">📚</div>
                              <h3 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Practice Resources</h3>
                              <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.5;">Access comprehensive question banks and study materials.</p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 10px 0 0; width: 50%;">
                            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #ffc107; height: 100%;">
                              <div style="font-size: 28px; margin-bottom: 15px;">📊</div>
                              <h3 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Progress Tracking</h3>
                              <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.5;">Monitor your performance and track improvement over time.</p>
                            </div>
                          </td>
                          <td style="padding: 0 0 0 10px; width: 50%;">
                            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #dc3545; height: 100%;">
                              <div style="font-size: 28px; margin-bottom: 15px;">🔔</div>
                              <h3 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Smart Notifications</h3>
                              <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.5;">Stay updated with new contests and important announcements.</p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Call to Action -->
                  <tr>
                    <td style="padding: 0 30px 40px 30px; text-align: center;">
                      <a href="${frontendUrl}" 
                         style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                        Get Started Now
                      </a>
                    </td>
                  </tr>

                  <!-- Support Section -->
                  <tr>
                    <td style="padding: 0 30px 40px 30px;">
                      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; text-align: center;">
                        <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Need Assistance?</h3>
                        <p style="color: #666666; margin: 0; font-size: 15px; line-height: 1.6;">
                          Our support team is here to help you succeed. Don't hesitate to reach out if you have any questions or need guidance.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #2c3e50; padding: 30px; text-align: center;">
                      <p style="color: #bdc3c7; margin: 0 0 10px 0; font-size: 14px;">
                        © 2024 PlacePrep. All rights reserved.
                      </p>
                      <p style="color: #95a5a6; margin: 0; font-size: 12px;">
                        This email was sent to ${email}. If you didn't create an account, please ignore this email.
                      </p>
                      <div style="margin-top: 20px;">
                        <a href="#" style="color: #3498db; text-decoration: none; margin: 0 10px; font-size: 12px;">Privacy Policy</a>
                        <span style="color: #7f8c8d;">|</span>
                        <a href="#" style="color: #3498db; text-decoration: none; margin: 0 10px; font-size: 12px;">Terms of Service</a>
                        <span style="color: #7f8c8d;">|</span>
                        <a href="#" style="color: #3498db; text-decoration: none; margin: 0 10px; font-size: 12px;">Contact Us</a>
                      </div>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to: ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const transporter = createTransporter();
    
    // Skip email sending if transporter is null (missing credentials)
    if (!transporter) {
      console.log('Skipping password reset email due to missing credentials');
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your PlacePrep Password',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">Password Reset</h1>
                      <p style="color: #e3f2fd; margin: 10px 0 0 0; font-size: 16px; font-weight: 300;">Secure Your Account</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
                      <p style="color: #555555; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password for your PlacePrep account. If you didn't make this request, you can safely ignore this email.
                      </p>
                      <p style="color: #555555; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                        To reset your password, click the button below. This link will expire in <strong>1 hour</strong> for security purposes.
                      </p>
                      
                      <!-- Reset Button -->
                      <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetLink}" 
                           style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                          Reset Password
                        </a>
                      </div>
                      
                      <!-- Alternative Link -->
                      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
                        <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">
                          If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <p style="color: #007bff; margin: 0; font-size: 14px; word-break: break-all; line-height: 1.4;">
                          ${resetLink}
                        </p>
                      </div>
                      
                      <!-- Security Notice -->
                      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 30px 0;">
                        <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
                          <strong>Security Notice:</strong> This link will expire in 1 hour. If you need to reset your password after that, please request a new reset link.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #2c3e50; padding: 30px; text-align: center;">
                      <p style="color: #bdc3c7; margin: 0 0 10px 0; font-size: 14px;">
                        © 2024 PlacePrep. All rights reserved.
                      </p>
                      <p style="color: #95a5a6; margin: 0; font-size: 12px;">
                        This email was sent to ${email}. If you didn't request a password reset, please ignore this email.
                      </p>
                      <div style="margin-top: 20px;">
                        <a href="#" style="color: #3498db; text-decoration: none; margin: 0 10px; font-size: 12px;">Privacy Policy</a>
                        <span style="color: #7f8c8d;">|</span>
                        <a href="#" style="color: #3498db; text-decoration: none; margin: 0 10px; font-size: 12px;">Terms of Service</a>
                        <span style="color: #7f8c8d;">|</span>
                        <a href="#" style="color: #3498db; text-decoration: none; margin: 0 10px; font-size: 12px;">Contact Us</a>
                      </div>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent successfully to: ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Send contest reminder email
export const sendContestReminderEmail = async (email, fullName, contestDetails) => {
  try {
    const transporter = createTransporter();
    
    // Skip email sending if transporter is null (missing credentials)
    if (!transporter) {
      console.log('Skipping contest reminder email due to missing credentials');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const contestUrl = `${frontendUrl}/take-contest/${contestDetails.id}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Reminder: ${contestDetails.title} starts in 1 hour!`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contest Reminder</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">Contest Reminder</h1>
                      <p style="color: #fff3e0; margin: 10px 0 0 0; font-size: 16px; font-weight: 300;">Don't miss out on this opportunity!</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Hello ${fullName},</h2>
                      <p style="color: #555555; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                        This is a friendly reminder that the contest <strong>"${contestDetails.title}"</strong> starts in <strong>1 hour</strong>!
                      </p>
                      
                      <!-- Contest Details -->
                      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0;">
                        <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Contest Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #666666; font-weight: 600; width: 120px;">Title:</td>
                            <td style="padding: 8px 0; color: #2c3e50;">${contestDetails.title}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666666; font-weight: 600;">Start Time:</td>
                            <td style="padding: 8px 0; color: #2c3e50;">${new Date(contestDetails.startTime).toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666666; font-weight: 600;">Duration:</td>
                            <td style="padding: 8px 0; color: #2c3e50;">${contestDetails.duration} minutes</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666666; font-weight: 600;">Questions:</td>
                            <td style="padding: 8px 0; color: #2c3e50;">${contestDetails.questionCount || 'Multiple'} questions</td>
                          </tr>
                        </table>
                      </div>
                      
                      <!-- Call to Action -->
                      <div style="text-align: center; margin: 40px 0;">
                        <a href="${contestUrl}" 
                           style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                          Join Contest Now
                        </a>
                      </div>
                      
                      <!-- Tips Section -->
                      <div style="background-color: #e8f5e8; border: 1px solid #c3e6c3; padding: 20px; border-radius: 6px; margin: 30px 0;">
                        <h4 style="color: #2d5a2d; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">💡 Quick Tips</h4>
                        <ul style="color: #2d5a2d; margin: 0; padding-left: 20px; line-height: 1.6;">
                          <li>Make sure you have a stable internet connection</li>
                          <li>Find a quiet environment to focus</li>
                          <li>Keep your device charged</li>
                          <li>Review the contest rules before starting</li>
                        </ul>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #2c3e50; padding: 30px; text-align: center;">
                      <p style="color: #bdc3c7; margin: 0 0 10px 0; font-size: 14px;">
                        © 2024 PlacePrep. All rights reserved.
                      </p>
                      <p style="color: #95a5a6; margin: 0; font-size: 12px;">
                        This email was sent to ${email}. You can manage your notification preferences in your account settings.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Contest reminder email sent successfully to: ${email}`);
  } catch (error) {
    console.error('Error sending contest reminder email:', error);
    throw error;
  }
};

// Send result notification email
export const sendResultNotificationEmail = async (email, fullName, resultDetails) => {
  try {
    const transporter = createTransporter();
    
    // Skip email sending if transporter is null (missing credentials)
    if (!transporter) {
      console.log('Skipping result notification email due to missing credentials');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resultUrl = `${frontendUrl}/contest-results/${resultDetails.contestId}`;

    // Calculate performance indicators
    const scorePercentage = Math.round((resultDetails.score / resultDetails.totalScore) * 100);
    const isGoodPerformance = scorePercentage >= 70;
    const isExcellentPerformance = scorePercentage >= 90;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Your Results: ${resultDetails.contestTitle}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contest Results</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, ${isExcellentPerformance ? '#28a745' : isGoodPerformance ? '#17a2b8' : '#dc3545'} 0%, ${isExcellentPerformance ? '#20c997' : isGoodPerformance ? '#6f42c1' : '#e74c3c'} 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">Contest Results</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; font-weight: 300; opacity: 0.9;">Your performance summary</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Hello ${fullName},</h2>
                      <p style="color: #555555; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                        Your results for <strong>"${resultDetails.contestTitle}"</strong> are now available! Here's how you performed:
                      </p>
                      
                      <!-- Score Display -->
                      <div style="background: linear-gradient(135deg, ${isExcellentPerformance ? '#28a745' : isGoodPerformance ? '#17a2b8' : '#dc3545'} 0%, ${isExcellentPerformance ? '#20c997' : isGoodPerformance ? '#6f42c1' : '#e74c3c'} 100%); padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0;">
                        <div style="font-size: 48px; color: #ffffff; font-weight: bold; margin-bottom: 10px;">
                          ${scorePercentage}%
                        </div>
                        <div style="color: #ffffff; font-size: 18px; margin-bottom: 15px;">
                          ${resultDetails.score} / ${resultDetails.totalScore} points
                        </div>
                        <div style="color: #ffffff; font-size: 16px; opacity: 0.9;">
                          ${isExcellentPerformance ? '🎉 Excellent Performance!' : isGoodPerformance ? '👍 Good Job!' : '📚 Keep Practicing!'}
                        </div>
                      </div>
                      
                      <!-- Detailed Results -->
                      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0;">
                        <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Detailed Breakdown</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #666666; font-weight: 600; width: 150px;">Contest:</td>
                            <td style="padding: 8px 0; color: #2c3e50;">${resultDetails.contestTitle}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666666; font-weight: 600;">Completed:</td>
                            <td style="padding: 8px 0; color: #2c3e50;">${new Date(resultDetails.completedAt).toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666666; font-weight: 600;">Time Taken:</td>
                            <td style="padding: 8px 0; color: #2c3e50;">${resultDetails.timeTaken || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666666; font-weight: 600;">Rank:</td>
                            <td style="padding: 8px 0; color: #2c3e50;">${resultDetails.rank || 'N/A'}</td>
                          </tr>
                        </table>
                      </div>
                      
                      <!-- Call to Action -->
                      <div style="text-align: center; margin: 40px 0;">
                        <a href="${resultUrl}" 
                           style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                          View Detailed Results
                        </a>
                      </div>
                      
                      <!-- Performance Message -->
                      <div style="background-color: ${isExcellentPerformance ? '#d4edda' : isGoodPerformance ? '#d1ecf1' : '#f8d7da'}; border: 1px solid ${isExcellentPerformance ? '#c3e6cb' : isGoodPerformance ? '#bee5eb' : '#f5c6cb'}; padding: 20px; border-radius: 6px; margin: 30px 0;">
                        <h4 style="color: ${isExcellentPerformance ? '#155724' : isGoodPerformance ? '#0c5460' : '#721c24'}; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                          ${isExcellentPerformance ? '🎉 Outstanding Performance!' : isGoodPerformance ? '👍 Well Done!' : '📚 Areas for Improvement'}
                        </h4>
                        <p style="color: ${isExcellentPerformance ? '#155724' : isGoodPerformance ? '#0c5460' : '#721c24'}; margin: 0; line-height: 1.6;">
                          ${isExcellentPerformance 
                            ? 'Your performance is exceptional! Keep up the great work and continue challenging yourself with more contests.' 
                            : isGoodPerformance 
                            ? 'You\'ve shown good understanding of the concepts. Keep practicing to improve further!' 
                            : 'Don\'t worry, every attempt is a learning opportunity. Review the questions and practice more to improve your score.'}
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #2c3e50; padding: 30px; text-align: center;">
                      <p style="color: #bdc3c7; margin: 0 0 10px 0; font-size: 14px;">
                        © 2024 PlacePrep. All rights reserved.
                      </p>
                      <p style="color: #95a5a6; margin: 0; font-size: 12px;">
                        This email was sent to ${email}. You can manage your notification preferences in your account settings.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Result notification email sent successfully to: ${email}`);
  } catch (error) {
    console.error('Error sending result notification email:', error);
    throw error;
  }
}; 