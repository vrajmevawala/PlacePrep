import Navigation from './components/Navigation.jsx';
import Home from './pages/Home.jsx';
import LoginForm from './components/LoginForm.jsx';
import SignUpForm from './components/SignUpForm.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ModeratorDashboard from './pages/ModeratorDashboard.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import Modal from './components/Modal.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import Resource from './pages/Resource.jsx';
import Contest from './pages/Contest.jsx';
import Practice from './pages/Practice.jsx';
import Result from './pages/Result.jsx';
import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for reset password token in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token')) {
      navigate('/reset-password');
      return;
    }
    const checkSession = async () => {
      let token = localStorage.getItem('jwt');
      let res;
      if (token) {
        res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });
      } else {
        res = await fetch('/api/auth/me', { credentials: 'include' });
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        // Only redirect to dashboard if on home or login/signup
        if (
          window.location.pathname === '/' ||
          window.location.pathname === '/login' ||
          window.location.pathname === '/signup'
        ) {
          navigate('/dashboard');
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      if (data.token) localStorage.setItem('jwt', data.token);
      setUser(data);
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
      setUser(data);
      navigate('/dashboard');
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

  // Google Auth handler
  const handleGoogleAuth = async () => {
    try {
      // Google OAuth2 popup
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=645456995574-nm6p15hqubvu06irdbvvdc8r2n8d09c5.apps.googleusercontent.com&redirect_uri=${window.location.origin}/google-auth-callback&response_type=token&scope=profile email`;
      const width = 500, height = 600;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      const popup = window.open(googleAuthUrl, 'GoogleAuth', `width=${width},height=${height},left=${left},top=${top}`);
      // Listen for message from popup
      window.addEventListener('message', async (event) => {
        if (event.origin !== window.location.origin) return;
        const { id_token } = event.data;
        if (id_token) {
          const res = await fetch('/api/auth/google-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token }),
            credentials: 'include',
          });
          let data = null;
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await res.json();
          }
          if (!res.ok) {
            throw new Error((data && data.message) || 'Google Auth failed');
          }
          setUser(data.user);
          navigate('/dashboard');
        }
      }, { once: true });
    } catch (err) {
      toast.error(err.message || 'Google Auth failed');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation 
        user={user} 
        onLogout={handleLogout}
      />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resources" element={<Resource />} />
          <Route path="/contests" element={<Contest />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/results" element={<Result />} />
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
          <Route path="/login" element={<Modal isOpen={true}><LoginForm onLogin={handleLogin} onForgotPassword={() => navigate('/forgot-password')} onGoogleAuth={handleGoogleAuth} onSignUp={() => navigate('/signup')} /></Modal>} />
          <Route path="/signup" element={<Modal isOpen={true}><SignUpForm onSignUp={handleSignUp} onGoogleAuth={handleGoogleAuth} onSignIn={() => navigate('/login')} /></Modal>} />
          <Route path="/forgot-password" element={<Modal isOpen={true}><ForgotPassword onBack={() => navigate('/login')} /></Modal>} />
          <Route path="/reset-password" element={<Modal isOpen={true}><ResetPassword onBack={() => navigate('/login')} /></Modal>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </main>
    </div>
  );
}

export default App; 