import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const GoogleAuthCallback = ({ onAuthSuccess }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Google returns token in hash fragment
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const id_token = params.get('id_token') || params.get('access_token');
    if (id_token) {
      fetch('/api/auth/google-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token }),
        credentials: 'include',
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Google Auth failed');
          if (data && data.token && data.user) {
            localStorage.setItem('jwt', data.token);
            onAuthSuccess(data.user);
          } else {
            toast.error('Google Auth failed.');
            navigate('/login');
          }
        })
        .catch(() => {
          toast.error('Google Auth failed.');
          navigate('/login');
        });
    } else {
      toast.error('No Google token found.');
      navigate('/login');
    }
  }, [navigate, onAuthSuccess]);

  return <div className="flex flex-col items-center justify-center min-h-screen text-lg">Signing you in with Google...</div>;
};

export default GoogleAuthCallback; 