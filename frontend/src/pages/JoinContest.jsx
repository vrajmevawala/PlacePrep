import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, ArrowRight, AlertCircle, CheckCircle, Trophy } from 'lucide-react';

const JoinContest = () => {
  const [contestCode, setContestCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleJoinContest = async (e) => {
    e.preventDefault();
    
    if (!contestCode.trim()) {
      setError('Please enter a contest code');
      return;
    }
    
    if (contestCode.length !== 6) {
      setError('Contest code must be 6 characters long');
      return;
    }

    // Validate contest code format (alphanumeric)
    const codeRegex = /^[A-Z0-9]{6}$/;
    if (!codeRegex.test(contestCode.trim().toUpperCase())) {
      setError('Contest code must be 6 alphanumeric characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const requestBody = { contestCode: contestCode.trim().toUpperCase() };
      
      const response = await fetch('/api/testseries/join-by-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Successfully joined contest! Preparing full-screen mode...');
        setTimeout(() => {
          // Navigate to the contest page with full-screen mode
          navigate(`/take-contest/${data.contest.id}?fullscreen=true`);
        }, 2000);
      } else {
        // Handle the case where user has already joined the contest
        if (data.message && data.message.includes('already joined')) {
          // Since we can't get the contest ID from the backend response,
          // let's try to get it from the user's joined contests
          try {
            const userContestsResponse = await fetch('/api/testseries', {
              credentials: 'include'
            });
            
            if (userContestsResponse.ok) {
              const userContestsData = await userContestsResponse.json();
              
              // Find the contest with the matching code
              const joinedContest = userContestsData.testSeries?.find(contest => 
                contest.contestCode === contestCode.trim().toUpperCase()
              );
              
              if (joinedContest) {
                // Check if user has already submitted this contest
                try {
                  const participationsResponse = await fetch('/api/testseries/participations', {
                    credentials: 'include'
                  });
                  
                  if (participationsResponse.ok) {
                    const participationsData = await participationsResponse.json();
                    const hasSubmitted = participationsData.participations?.some(participation => 
                      participation.testSeriesId === joinedContest.id && participation.submittedAt
                    );
                    
                    if (hasSubmitted) {
                      setSuccess('You have already submitted this contest! Redirecting to results...');
                      setTimeout(() => {
                        navigate(`/contest-results/${joinedContest.id}`);
                      }, 2000);
                    } else {
                      setSuccess('You have already joined this contest! Redirecting to contest...');
                      setTimeout(() => {
                        navigate(`/take-contest/${joinedContest.id}?fullscreen=true`);
                      }, 2000);
                    }
                  } else {
                    setSuccess('You have already joined this contest! Redirecting to contest...');
                    setTimeout(() => {
                      navigate(`/take-contest/${joinedContest.id}?fullscreen=true`);
                    }, 2000);
                  }
                } catch (participationError) {
                  setSuccess('You have already joined this contest! Redirecting to contest...');
                  setTimeout(() => {
                    navigate(`/take-contest/${joinedContest.id}?fullscreen=true`);
                  }, 2000);
                }
              } else {
                setError('Contest not found in your joined contests. Please check the contest code.');
              }
            } else {
              setError('Failed to get your contest information. Please try again.');
            }
          } catch (contestError) {
            setError('Failed to get contest information. Please try again.');
          }
        } else {
          setError(data.message || 'Failed to join contest');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-black flex items-center justify-center">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-black">Join Contest</h1>
              <p className="text-gray-600 mt-2">Enter the contest code to participate in competitions</p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white border border-gray-200 p-8">
            {/* Form */}
            <form onSubmit={handleJoinContest} className="space-y-6">
              <div>
                <label htmlFor="contestCode" className="block text-sm font-semibold text-black mb-3">
                  Contest Code
                </label>
                <input
                  type="text"
                  id="contestCode"
                  value={contestCode}
                  onChange={(e) => setContestCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-colors text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter the 6-character contest code (e.g., ABC123)
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin"></div>
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <span>Join Contest</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Back Link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/contests')}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to Contests
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinContest; 