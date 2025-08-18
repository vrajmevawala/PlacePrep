import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Send notification to specific user
  async sendToUser(userId, notification) {
    try {
      // Save notification to database
      const savedNotification = await prisma.notification.create({
        data: {
          userId: parseInt(userId),
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data || {},
          isRead: false,
          createdAt: new Date()
        }
      });

      // Send real-time notification via Socket.IO
      this.io.to(`user-${userId}`).emit('new-notification', savedNotification);

      console.log(`Notification sent to user ${userId}:`, savedNotification.title);
      return savedNotification;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      throw error;
    }
  }

  // Send notification to all users
  async sendToAllUsers(notification) {
    try {
      // Get all user IDs
      const users = await prisma.user.findMany({
        select: { id: true }
      });

      // Create notifications for all users
      const notifications = await Promise.all(
        users.map(user => 
          prisma.notification.create({
            data: {
              userId: user.id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              data: notification.data || {},
              isRead: false,
              createdAt: new Date()
            }
          })
        )
      );

      // Send real-time notification to all connected users
      this.io.emit('new-notification', notification);

      console.log(`Notification sent to all users (${users.length}):`, notification.title);
      return notifications;
    } catch (error) {
      console.error('Error sending notification to all users:', error);
      throw error;
    }
  }

  // Send notification to users by role
  async sendToUsersByRole(role, notification) {
    try {
      const users = await prisma.user.findMany({
        where: { role },
        select: { id: true }
      });

      const notifications = await Promise.all(
        users.map(user => 
          prisma.notification.create({
            data: {
              userId: user.id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              data: notification.data || {},
              isRead: false,
              createdAt: new Date()
            }
          })
        )
      );

      // Send real-time notification to users with specific role
      users.forEach(user => {
        this.io.to(`user-${user.id}`).emit('new-notification', notification);
      });

      console.log(`Notification sent to ${users.length} users with role ${role}:`, notification.title);
      return notifications;
    } catch (error) {
      console.error('Error sending notification to users by role:', error);
      throw error;
    }
  }

  // Contest notifications
  async notifyContestAnnounced(contestData) {
    const startTime = new Date(contestData.startTime);
    const notification = {
      title: '🎉 New Contest Announced!',
      message: `A new contest "${contestData.title}" has been announced. Starts on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()}. Don't miss out!`,
      type: 'CONTEST_ANNOUNCED',
      data: { 
        contestId: contestData.id, 
        contestTitle: contestData.title,
        startTime: contestData.startTime,
        endTime: contestData.endTime
      }
    };

    return await this.sendToAllUsers(notification);
  }

  async notifyContestStartingSoon(contestData, minutesAway = 30) {
    const notification = {
      title: '⏰ Contest Starting Soon!',
      message: `The contest "${contestData.title}" starts in ${minutesAway} minutes. Get ready!`,
      type: 'CONTEST_STARTING_SOON',
      data: { 
        contestId: contestData.id, 
        contestTitle: contestData.title,
        startTime: contestData.startTime
      }
    };

    return await this.sendToAllUsers(notification);
  }

  async notifyContestStarted(contestData) {
    const notification = {
      title: '🚀 Contest Started!',
      message: `The contest "${contestData.title}" has started. Good luck!`,
      type: 'CONTEST_STARTED',
      data: { 
        contestId: contestData.id, 
        contestTitle: contestData.title,
        startTime: contestData.startTime
      }
    };

    return await this.sendToAllUsers(notification);
  }

  async notifyContestEndingSoon(contestData, minutesLeft = 30) {
    const notification = {
      title: '⚠️ Contest Ending Soon!',
      message: `The contest "${contestData.title}" ends in ${minutesLeft} minutes. Submit your answers!`,
      type: 'CONTEST_ENDING_SOON',
      data: { 
        contestId: contestData.id, 
        contestTitle: contestData.title,
        endTime: contestData.endTime
      }
    };

    return await this.sendToAllUsers(notification);
  }

  async notifyContestEnded(contestData) {
    const notification = {
      title: '🏁 Contest Ended',
      message: `The contest "${contestData.title}" has ended. Results will be available soon.`,
      type: 'CONTEST_ENDED',
      data: { 
        contestId: contestData.id, 
        contestTitle: contestData.title,
        endTime: contestData.endTime
      }
    };

    return await this.sendToAllUsers(notification);
  }

  // Result notifications
  async notifyResultAvailable(userId, resultData) {
    const notification = {
      title: '📊 Your Result is Available!',
      message: `Your result for "${resultData.title}" is now available. Check your dashboard to view your performance.`,
      type: 'RESULT_AVAILABLE',
      data: { resultId: resultData.id, title: resultData.title }
    };

    return await this.sendToUser(userId, notification);
  }

  // Performance notifications
  async notifyHighScore(userId, contestData, score, totalQuestions) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const notification = {
      title: '🏆 Excellent Performance!',
      message: `Congratulations! You scored ${score}/${totalQuestions} (${percentage}%) in "${contestData.title}". Great job!`,
      type: 'HIGH_SCORE',
      data: { 
        contestId: contestData.id, 
        contestTitle: contestData.title,
        score,
        totalQuestions,
        percentage
      }
    };

    return await this.sendToUser(userId, notification);
  }

  // System update notifications
  async notifySystemUpdate(message) {
    const notification = {
      title: '🔧 System Update',
      message: message,
      type: 'SYSTEM_UPDATE',
      data: {}
    };

    return await this.sendToAllUsers(notification);
  }

  // New question notifications (for moderators/admins)
  async notifyNewQuestion(questionData) {
    const notification = {
      title: '📝 New Question Added',
      message: `A new ${questionData.category} question has been added to the platform.`,
      type: 'NEW_QUESTION',
      data: { questionId: questionData.id, category: questionData.category }
    };

    return await this.sendToUsersByRole('moderator', notification);
  }

  // Welcome notification for new users
  async notifyWelcome(userId, userData) {
    const notification = {
      title: '👋 Welcome to PlacePrep!',
      message: `Welcome ${userData.fullName}! Start your preparation journey with our practice tests and contests.`,
      type: 'WELCOME',
      data: { userId: userData.id, userName: userData.fullName }
    };

    return await this.sendToUser(userId, notification);
  }

  // Reminder notifications
  async notifyPracticeReminder(userId, daysSinceLastPractice) {
    const notification = {
      title: '💡 Time to Practice!',
      message: `It's been ${daysSinceLastPractice} days since your last practice session. Keep up the momentum!`,
      type: 'PRACTICE_REMINDER',
      data: { daysSinceLastPractice }
    };

    return await this.sendToUser(userId, notification);
  }

  async notifyAutoSubmission(userId, contestData, score, totalQuestions) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const notification = {
      title: '⏰ Contest Auto-Submitted',
      message: `Your contest "${contestData.title}" was automatically submitted when time expired. You scored ${score}/${totalQuestions} (${percentage}%). Check your results!`,
      type: 'AUTO_SUBMISSION',
      data: { 
        contestId: contestData.id,
        contestTitle: contestData.title,
        score,
        totalQuestions,
        percentage
      }
    };

    return await this.sendToUser(userId, notification);
  }
}

export default NotificationService; 