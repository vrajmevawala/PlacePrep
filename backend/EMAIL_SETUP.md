# Email Functionality Setup Guide

This document explains how to set up and use the email functionality in PlacePrep.

## 📧 Email Features Implemented

### 1. Welcome Email
- **Trigger**: When a new user signs up
- **Content**: Welcome message, platform features, getting started guide
- **Function**: `sendWelcomeEmail(email, fullName)`

### 2. Password Reset Email
- **Trigger**: When user requests password reset
- **Content**: Secure reset link, security notice, expiration warning
- **Function**: `sendPasswordResetEmail(email, resetLink)`

### 3. Contest Reminder Email
- **Trigger**: 1 hour before contest starts (automated cron job)
- **Content**: Contest details, start time, duration, preparation tips
- **Function**: `sendContestReminderEmail(email, fullName, contestDetails)`

### 4. Result Notification Email
- **Trigger**: When user completes a contest
- **Content**: Performance summary, score breakdown, encouragement message
- **Function**: `sendResultNotificationEmail(email, fullName, resultDetails)`

## 🔧 Setup Instructions

### 1. Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Email Configuration
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
FRONTEND_URL="http://localhost:5173"

# Other required variables
JWT_SECRET="your-jwt-secret"
DATABASE_URL="your-database-url"
PORT=5001
NODE_ENV="development"
```

### 2. Gmail Setup (Recommended)

#### Option A: App Password (Recommended for Production)
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security > App passwords
4. Select "Mail" and generate a new app password
5. Use this password in `EMAIL_PASS`

#### Option B: Less Secure App Access (Development Only)
1. Go to Google Account settings
2. Security > Less secure app access
3. Turn on "Allow less secure apps"
4. Use your regular Gmail password

### 3. Testing Email Functionality

Run the email test script to verify everything is working:

```bash
cd backend
npm run test-email
```

This will test all four email types with sample data.

## 📋 Email Templates

### Welcome Email Features
- Professional design with PlacePrep branding
- Feature highlights (Live Contests, Practice Resources, Progress Tracking, Smart Notifications)
- Call-to-action button to start using the platform
- Support section with contact information

### Password Reset Email Features
- Secure reset link with 1-hour expiration
- Clear security warnings
- Alternative link display for copy-paste
- Professional styling with security-focused messaging

### Contest Reminder Email Features
- Contest details (title, start time, duration, question count)
- Preparation tips for optimal performance
- Direct link to join the contest
- Motivational messaging

### Result Notification Email Features
- Dynamic color coding based on performance (excellent/good/needs improvement)
- Score percentage and points breakdown
- Detailed performance metrics
- Encouraging messages based on performance level
- Link to view detailed results

## 🔄 Automated Email Triggers

### Cron Jobs
The system uses cron jobs to automatically send emails:

```javascript
// Runs every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  // Contest reminder emails (1 hour before start)
  // Contest start/end notifications
  // Question visibility updates
});
```

### Manual Triggers
- **Welcome Email**: Triggered in `auth.controller.js` during signup
- **Password Reset**: Triggered in `auth.controller.js` during forgot password
- **Result Notification**: Triggered in `testSeries.controller.js` after contest submission

## 🛠️ Troubleshooting

### Common Issues

1. **"Email credentials not configured"**
   - Check that `EMAIL_USER` and `EMAIL_PASS` are set in `.env`
   - Verify the email and password are correct

2. **"Authentication failed"**
   - For Gmail: Use App Password instead of regular password
   - Enable 2-Factor Authentication and generate App Password
   - Or enable "Less secure app access" (development only)

3. **"Connection timeout"**
   - Check internet connection
   - Verify Gmail SMTP settings
   - Try using a different email provider

4. **"Emails not being sent"**
   - Check server logs for error messages
   - Verify cron jobs are running
   - Test with the email test script

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV="development"
```

This will show detailed email sending logs in the console.

## 📊 Email Analytics

The system logs all email activities:
- Successful email sends
- Failed email attempts
- Email types and recipients
- Error messages for debugging

Check the server logs for email-related messages.

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **App Passwords**: Use App Passwords instead of regular passwords
3. **Token Expiration**: Password reset tokens expire after 1 hour
4. **Rate Limiting**: Consider implementing rate limiting for email endpoints
5. **Email Validation**: All email addresses are validated before sending

## 📝 Customization

### Modifying Email Templates
All email templates are in `src/lib/emailService.js`. You can customize:
- HTML structure and styling
- Content and messaging
- Colors and branding
- Call-to-action buttons

### Adding New Email Types
1. Create a new function in `emailService.js`
2. Add the function to the appropriate controller
3. Update the test script to include the new email type
4. Add any necessary cron jobs for automated sending

## 🚀 Production Deployment

For production deployment:

1. **Use a dedicated email service** (SendGrid, Mailgun, etc.)
2. **Set up proper DNS records** (SPF, DKIM, DMARC)
3. **Monitor email delivery rates**
4. **Implement email queuing** for high-volume sending
5. **Set up email analytics and tracking**

## 📞 Support

If you encounter issues with email functionality:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Test with the email test script
4. Verify environment variable configuration 