import React, { useState } from 'react';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const EmailVerification = ({ email, onVerificationSuccess, onBack }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationCode: verificationCode.trim() }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        onVerificationSuccess();
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Failed to resend code');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Verify Your Email</h2>
        <p className="text-gray-500 text-sm mb-3">Complete your registration to get started</p>
      </div>
      
      <div className="w-full flex flex-col items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
          <Mail className="w-6 h-6 text-black" />
        </div>
        <p className="text-gray-500 text-center text-sm">
          We've sent a verification code to <br />
          <span className="font-medium text-gray-700">{email}</span>
        </p>
      </div>

      <form className="w-full space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <input
            id="verificationCode"
            type="text"
            required
            maxLength="6"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none text-center text-lg font-mono tracking-widest"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            autoComplete="off"
          />
          <p className="text-xs text-gray-500 mt-1 text-center">
            Enter the 6-digit code from your email
          </p>
        </div>

        <button
          type="submit"
          disabled={isVerifying || !verificationCode.trim()}
          className="w-full py-2 px-4 bg-black text-white rounded-md shadow-sm hover:bg-gray-800 transition text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="w-full text-center mt-4">
        <button
          type="button"
          onClick={handleResendCode}
          disabled={isResending}
          className="text-black hover:text-slate-700 font-medium text-sm flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
          {isResending ? 'Sending...' : 'Resend Code'}
        </button>
      </div>

      <div className="w-full text-center mt-4">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign Up
        </button>
      </div>

      <div className="w-full text-center mt-4 text-xs text-gray-400">
        <p>Didn't receive the email? Check your spam folder</p>
        <p>Code expires in 10 minutes</p>
        <p className="mt-2 text-green-600 font-medium">After verification, you'll be redirected to login</p>
      </div>
    </div>
  );
};

export default EmailVerification;
