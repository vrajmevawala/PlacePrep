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
          data: notification.data || {}
        }
      });

      // Send real-time notification via Socket.IO
      this.io.to(`user-${userId}`).emit('new-notification', savedNotification);

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
              data: notification.data || {}
            }
          })
        )
      );

      // Send real-time notification to all connected users
      this.io.emit('new-notification', notification);

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
              data: notification.data || {}
            }
          })
        )
      );

      // Send real-time notification to users with specific role
      users.forEach(user => {
        this.io.to(`user-${user.id}`).emit('new-notification', notification);
      });

      return notifications;
    } catch (error) {
      console.error('Error sending notification to users by role:', error);
      throw error;
    }
  }

  // Contest notifications
  async notifyContestAnnounced(contestData) {
    const notification = {
      title: 'New Contest Announced!',
      message: `A new contest "${contestData.title}" has been announced. Start time: ${new Date(contestData.startTime).toLocaleString()}`,
      type: 'CONTEST_ANNOUNCED',
      data: { contestId: contestData.id, contestTitle: contestData.title }
    };

    return await this.sendToAllUsers(notification);
  }

  async notifyContestStarted(contestData) {
    const notification = {
      title: 'Contest Started!',
      message: `The contest "${contestData.title}" has started. Good luck!`,
      type: 'CONTEST_STARTED',
      data: { contestId: contestData.id, contestTitle: contestData.title }
    };

    return await this.sendToAllUsers(notification);
  }

  async notifyContestEnded(contestData) {
    const notification = {
      title: 'Contest Ended',
      message: `The contest "${contestData.title}" has ended. Results will be available soon.`,
      type: 'CONTEST_ENDED',
      data: { contestId: contestData.id, contestTitle: contestData.title }
    };

    return await this.sendToAllUsers(notification);
  }

  // Result notifications
  async notifyResultAvailable(userId, resultData) {
    const notification = {
      title: 'Your Result is Available!',
      message: `Your result for "${resultData.title}" is now available. Check your dashboard to view your performance.`,
      type: 'RESULT_AVAILABLE',
      data: { resultId: resultData.id, title: resultData.title }
    };

    return await this.sendToUser(userId, notification);
  }

  // System update notifications
  async notifySystemUpdate(message) {
    const notification = {
      title: 'System Update',
      message: message,
      type: 'SYSTEM_UPDATE',
      data: {}
    };

    return await this.sendToAllUsers(notification);
  }

  // New question notifications (for moderators/admins)
  async notifyNewQuestion(questionData) {
    const notification = {
      title: 'New Question Added',
      message: `A new ${questionData.category} question has been added to the platform.`,
      type: 'NEW_QUESTION',
      data: { questionId: questionData.id, category: questionData.category }
    };

    return await this.sendToUsersByRole('moderator', notification);
  }
}

export default NotificationService; 