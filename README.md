# PlacePrep - Online Placement Preparation Platform

A comprehensive online platform for placement preparation with contests, practice tests, and resource management.

## 🚀 Features

### For Students
- **Practice Tests**: Take practice tests with questions from various categories
- **Contests**: Participate in timed contests with real-time monitoring
- **Bookmarks**: Save important questions for later review
- **Results & Analytics**: View detailed performance analytics
- **Resources**: Access study materials, PDFs, and videos
- **Real-time Notifications**: Get notified about new contests and results

### For Administrators
- **User Management**: Manage students and moderators
- **Question Bank**: Add, edit, and manage questions
- **Contest Creation**: Create and manage contests
- **Analytics Dashboard**: View platform statistics and user performance
- **Resource Management**: Upload and manage study materials

### For Moderators
- **Question Management**: Add and edit questions
- **Contest Management**: Create contests and monitor participation
- **Content Moderation**: Review and approve content

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** with Prisma ORM
- **Socket.IO** for real-time features
- **JWT** for authentication
- **Multer** for file uploads
- **Nodemailer** for email notifications
- **Cron jobs** for automated tasks

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Toastify** for notifications
- **Socket.IO Client** for real-time features
- **Chart.js** for analytics
- **Recharts** for data visualization

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd PlacePrep
```

### 2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Set up environment variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/placeprep_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"

# Server Configuration
PORT=5001
NODE_ENV="development"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id-here"

# Email Configuration (for password reset)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 4. Set up the database

```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Start the development servers

```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend server (from frontend directory)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001

## 📁 Project Structure

```
PlacePrep/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── middleware/      # Authentication & authorization
│   │   ├── routes/          # API routes
│   │   ├── lib/             # Utilities
│   │   └── server.js        # Main server file
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Database migrations
│   └── uploads/             # File uploads
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   └── main.jsx         # App entry point
│   └── public/              # Static assets
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Add new question (admin/moderator)
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Contests
- `GET /api/testseries` - Get all contests
- `POST /api/testseries` - Create contest (admin/moderator)
- `GET /api/testseries/:id` - Get contest details
- `POST /api/testseries/:id/join` - Join contest
- `POST /api/testseries/:id/submit` - Submit contest answers

### Practice
- `POST /api/free-practice/start` - Start practice test
- `POST /api/free-practice/:id/practice-submit` - Submit practice test
- `GET /api/free-practice/student/stats` - Get student statistics

### Resources
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Add resource (admin/moderator)
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

## 🔐 Authentication & Authorization

The application uses JWT tokens for authentication. Users are assigned roles:
- **user**: Regular students
- **moderator**: Can manage questions and contests
- **admin**: Full access to all features

## 📊 Database Schema

### Core Models
- **User**: Students, moderators, and admins
- **Question**: MCQ questions with categories and difficulty levels
- **TestSeries**: Contests with start/end times
- **Participation**: User participation in contests
- **StudentActivity**: User answers and performance tracking
- **Bookmark**: User bookmarked questions
- **Notification**: Real-time notifications
- **Resource**: Study materials (PDFs, videos, MCQs)

## 🚀 Deployment

### Backend Deployment
1. Set up a PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to your preferred hosting service

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service

## 🐛 Known Issues & Fixes

### Backend Issues Fixed
1. **Missing nodemon dependency** - Added to devDependencies
2. **Missing cors dependency** - Added to dependencies
3. **Field name inconsistency** - Fixed `fullname` vs `fullName`
4. **Missing environment variables** - Created env.example file
5. **Error handling improvements** - Added proper error logging

### Frontend Issues Fixed
1. **API endpoint mismatches** - Fixed route paths
2. **Missing error handling** - Added proper catch blocks
3. **Authentication flow** - Improved session management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

## 🔄 Updates

- **v1.0.0**: Initial release with core features
- **v1.1.0**: Added real-time notifications
- **v1.2.0**: Added resource management
- **v1.3.0**: Added bookmark functionality
- **v1.4.0**: Added comprehensive analytics

---

**Note**: Make sure to update the environment variables with your actual values before running the application. 

## Auto-Submission Feature

The platform now includes automatic submission functionality for contests:

### How it Works

1. **Time-based Auto-Submission**: When a contest's time limit expires, all unsubmitted participations are automatically submitted with the answers the user has provided.

2. **Cron Job**: A background process runs every 5 minutes to check for expired contests and auto-submit them.

3. **User Notifications**: Users receive:
   - Email notification with their results
   - In-app notification about auto-submission
   - Clear indication in results page

4. **Results Display**: Auto-submitted contests show:
   - Orange warning banner indicating auto-submission
   - "Auto-submitted (time expired)" in time taken field
   - All user answers preserved and scored

### Testing Auto-Submission

To test the auto-submission feature:

1. **Create a short contest** (e.g., 2-3 minutes duration)
2. **Join the contest** and answer some questions
3. **Let the time expire** without manually submitting
4. **Check the results** - they should be automatically available

### Manual Trigger (Admin Only)

Admins can manually trigger auto-submission for testing:

```bash
POST /api/testseries/auto-submit-expired
```

This endpoint requires admin or moderator privileges.

### Configuration

The auto-submission cron job runs every 5 minutes. You can modify this in `backend/src/server.js`:

```javascript
cron.schedule('*/5 * * * *', async () => {
  // Auto-submission logic
});
``` 