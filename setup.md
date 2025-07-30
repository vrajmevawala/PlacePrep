# Quick Setup Guide

## Prerequisites
- Node.js (v16+)
- PostgreSQL
- npm or yarn

## Quick Start

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd PlacePrep

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. **Set up environment variables**
```bash
cd ../backend
cp env.example .env
# Edit .env with your actual values
```

3. **Set up database**
```bash
cd backend
npx prisma generate
npx prisma db push
```

4. **Start servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend: http://localhost:5001

## Default Admin Account
Create an admin user through the signup process or directly in the database.

## Common Issues

### Backend won't start
- Check if PostgreSQL is running
- Verify environment variables in `.env`
- Ensure all dependencies are installed

### Frontend won't start
- Check if backend is running on port 5001
- Verify all dependencies are installed

### Database connection issues
- Check PostgreSQL connection string in `.env`
- Ensure database exists and is accessible

## Environment Variables Required

```env
DATABASE_URL="postgresql://username:password@localhost:5432/placeprep_db"
JWT_SECRET="your-secret-key"
PORT=5001
GOOGLE_CLIENT_ID="your-google-client-id"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
``` 