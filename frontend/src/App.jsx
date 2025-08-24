import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navigation from './components/Navigation.jsx';
import LoginForm from './components/LoginForm.jsx';
import SignUpForm from './components/SignUpForm.jsx';
import EmailVerification from './components/EmailVerification.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import Modal from './components/Modal.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import GoogleAuthCallback from './components/googleAuthCallback.jsx';
import Footer from './components/Footer.jsx';

// Pages
import Home from './pages/Home.jsx';
import WhyChooseUs from './pages/WhyChooseUs.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ModeratorDashboard from './pages/ModeratorDashboard.jsx';
import Resource from './pages/Resource.jsx';
import Contest from './pages/Contest.jsx';
import Practice from './pages/Practice.jsx';
import Result from './pages/Result.jsx';
import Bookmark from './pages/Bookmark.jsx';
import CreateContest from './pages/CreateContest.jsx';
import JoinContest from './pages/JoinContest.jsx';
import TakeContest from './pages/TakeContest.jsx';
import ContestResults from './pages/ContestResults.jsx';
import AdminContests from './pages/AdminContests.jsx';
import AdminResults from './pages/AdminResults.jsx';
import AIAssistant from './pages/AIAssistant.jsx';

// Contexts
import { NotificationProvider } from './contexts/NotificationContext.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState('login'); // 'login', 'signup', 'forgot-password', 'reset-password', 'email-verification'
  const [pendingVerification, setPendingVerification] = useState(null); // { email, fullName }
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is currently in a contest
  const isContestMode = location.pathname.startsWith('/take-contest/');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-600">No Internet Connection</h1>
          <p className="text-lg text-gray-700 mb-2">You are currently offline.</p>
          <p className="text-gray-500">Please check your network and try again.</p>
        </div>
      </div>
    );
  }

  const [resetToken, setResetToken] = useState(null);

  useEffect(() => {
    // Don't check session if we're in Google Auth callback
    if (window.location.pathname === '/google-auth-callback') {
      return;
    }
    
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me', { 
          credentials: 'include' 
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          // Only redirect to dashboard if on home
          if (window.location.pathname === '/') {
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.warn('Session check failed:', error);
      }
    };
    
    checkSession();
  }, [navigate]);



  // Immediate token detection for reset password
  if (window.location.pathname === '/reset-password' && !resetToken) {
    const token = new URLSearchParams(window.location.search).get('token');
    
    if (token) {
      setResetToken(token);
      setAuthModalType('reset-password');
      setShowAuthModal(true);
      // Clean up the URL after setting state
      setTimeout(() => {
        window.history.replaceState({}, document.title, '/');
      }, 100);
      return;
    }
  }





  const handleLogin = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store token in localStorage as backup (backend sets cookie)
      if (data.token) localStorage.setItem('jwt', data.token);
      setUser(data);
      setShowAuthModal(false);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    }
  };

  const handleSignUp = async (name, email, password) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name, email, password }),
        credentials: 'include',
      });
      let data = null;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }
      if (!res.ok) {
        throw new Error((data && data.message) || 'Signup failed');
      }
      
      // Check if email verification is required
      if (data.requiresVerification) {
        setPendingVerification({ email, fullName: name });
        setAuthModalType('email-verification');
        toast.success(data.message);
      } else {
        // If no verification required (fallback), proceed as before
        setUser(data);
        setShowAuthModal(false);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Signup failed');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    localStorage.removeItem('jwt');
    setUser(null);
    navigate('/');
  };

  // Auth modal handlers
  const openAuthModal = (type) => {
    setAuthModalType(type);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthModalType('login');
  };

  // Google Auth handler
  const handleGoogleAuth = () => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=645456995574-nm6p15hqubvu06irdbvvdc8r2n8d09c5.apps.googleusercontent.com&redirect_uri=${window.location.origin}/google-auth-callback&response_type=id_token&scope=profile email&nonce=secureRandomNonce`;
    window.location.href = googleAuthUrl;
  };

  return (
    <NotificationProvider user={user}>
      <motion.div 
        className="page text-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Navigation 
          user={user} 
          onLogout={handleLogout}
          isContestMode={isContestMode}
          onOpenAuthModal={openAuthModal}
        />
        <motion.main 
          className="pt-16"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Routes>
            <Route path="/" element={<Home user={user} onOpenAuthModal={openAuthModal} />} />
            <Route path="/why-choose-us" element={<WhyChooseUs />} />
            <Route path="/resources" element={<Resource user={user} />} />
            <Route path="/contests" element={<Contest user={user} />} />
            <Route path="/practice" element={<Practice user={user} />} />
            <Route path="/results" element={
              user ? (
                user.role === 'admin' || user.role === 'moderator' ? (
                  <AdminResults user={user} />
                ) : (
                  <Result user={user} />
                )
              ) : (
                <Navigate to="/" />
              )
            } />
            <Route path="/bookmarks" element={<Bookmark />} />
            <Route path="/create-contest" element={<CreateContest />} />
            <Route path="/edit-contest/:contestId" element={<CreateContest />} />
            <Route path="/join-contest" element={<JoinContest />} />
            <Route path="/take-contest/:contestId" element={<TakeContest />} />
            <Route path="/contest-results/:contestId" element={<ContestResults />} />
            <Route path="/admin-contests" element={<AdminContests user={user} />} />
            <Route path="/admin-results" element={<AdminResults user={user} />} />
            <Route path="/ai-assistant" element={<AIAssistant user={user} />} />
            <Route path="/dashboard" element={
              user ? (
                user.role === 'admin' ? (
                  <AdminDashboard user={user} />
                ) : user.role === 'moderator' ? (
                  <ModeratorDashboard user={user} />
                ) : (
                  <StudentDashboard user={user} />
                )
              ) : (
                <Navigate to="/" />
              )
            } />

            <Route path="/google-auth-callback" element={<GoogleAuthCallback onAuthSuccess={user => { setUser(user); navigate('/dashboard'); }} />} />
            <Route path="/reset-password" element={<div>Redirecting...</div>} />
            <Route path="/offline-check" element={<div className="flex flex-col items-center justify-center min-h-screen"><h1 className="text-2xl font-bold mb-4">Offline Check Test Page</h1><p>If you go offline, you should see the offline message.</p></div>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} />
        </motion.main>
        <Footer user={user} onOpenAuthModal={openAuthModal} />



        {/* Auth Modal */}
        {showAuthModal && (
          <Modal isOpen={showAuthModal} onClose={closeAuthModal}>
            {authModalType === 'login' && (
              <LoginForm 
                onLogin={handleLogin} 
                onForgotPassword={() => setAuthModalType('forgot-password')} 
                onGoogleAuth={handleGoogleAuth} 
                onSignUp={() => setAuthModalType('signup')} 
              />
            )}
            {authModalType === 'signup' && (
              <SignUpForm 
                onSignUp={handleSignUp} 
                onGoogleAuth={handleGoogleAuth} 
                onSignIn={() => setAuthModalType('login')} 
              />
            )}
            {authModalType === 'forgot-password' && (
              <ForgotPassword 
                onBack={() => setAuthModalType('login')} 
              />
            )}
            {authModalType === 'reset-password' && (
              <ResetPassword 
                token={resetToken}
                onBack={() => setAuthModalType('login')} 
              />
            )}
            {authModalType === 'email-verification' && pendingVerification && (
              <EmailVerification 
                email={pendingVerification.email} 
                onVerificationSuccess={() => {
                  setPendingVerification(null);
                  setShowAuthModal(false);
                  toast.success('Email verified successfully! You can now log in to your account.');
                }} 
                onBack={() => {
                  setPendingVerification(null);
                  setAuthModalType('signup');
                }}
              />
            )}
          </Modal>
        )}
      </motion.div>
    </NotificationProvider>
  );
}

export default App;