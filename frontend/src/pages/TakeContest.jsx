import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  ArrowLeft, 
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Save,
  Trophy
} from 'lucide-react';

const TakeContest = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isFullscreen = new URLSearchParams(location.search).get('fullscreen') === 'true';
  
  const [contest, setContest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [started, setStarted] = useState(false); // Always require user to click start button
  const [hasSubmitted, setHasSubmitted] = useState(false); // Track if user has already submitted
  const [showSecurityWarning, setShowSecurityWarning] = useState(false); // Show security warning modal
  const [violationCount, setViolationCount] = useState(0); // Track violation count
  const [showViolationWarning, setShowViolationWarning] = useState(false); // Show violation warning modal
  const [currentViolationType, setCurrentViolationType] = useState(''); // Track current violation type
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const submissionAttemptedRef = useRef(false); // Global flag to prevent any submission

  // Reset submission state on component mount (for new users/sessions)
  useEffect(() => {
    // Clear any old submission state from localStorage
    const localStorageKey = `contest_${contestId}_submitted`;
    localStorage.removeItem(localStorageKey);
    
    // Reset submission flags
    submissionAttemptedRef.current = false;
    setHasSubmitted(false);
    setSubmitting(false);
  }, [contestId]);

  // Record violation and handle accordingly
  const recordViolation = async (violationType) => {
    try {
      const response = await fetch(`/api/testseries/${contestId}/violation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ violationType })
      });

      if (response.ok) {
        const data = await response.json();
        setViolationCount(data.violations);
        
        if (data.shouldAutoSubmit) {
          // Second violation - auto submit
          setCurrentViolationType(violationType);
          setShowSecurityWarning(true);
          setTimeout(() => {
            handleSubmitContest();
          }, 3000);
        } else {
          // First violation - show warning
          setCurrentViolationType(violationType);
          setShowViolationWarning(true);
        }
      }
    } catch (error) {
      console.error('Failed to record violation:', error);
    }
  };

  // Security violation handling - immediate auto-submit
  const handleViolation = (violationType) => {
    recordViolation(violationType);
  };

  // Fullscreen management
  const enterFullscreen = () => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          // Continue with contest even if fullscreen fails
        });
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen().catch(err => {
          // Continue with contest even if fullscreen fails
        });
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen().catch(err => {
          // Continue with contest even if fullscreen fails
        });
      }
    } catch (err) {
      // Continue with contest even if fullscreen fails
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  };

  // Submit contest function - must be defined before useEffect
  const handleSubmitContest = useCallback(async () => {
    
    // Validate contest data
    if (!contest || !contest.id) {
      console.error('No contest data available');
      setError('Contest data not available');
      return;
    }
    
    if (!questions || questions.length === 0) {
      console.error('No questions available');
      setError('No questions available for this contest');
      return;
    }
    
    // Check if contest is still active - use UTC comparison to avoid timezone issues
    const now = new Date();
    const contestEndTime = new Date(contest.endTime);
    
    // Note: User authentication is already verified by the fact they're in the contest
    
    // Multiple layers of protection
    if (submissionAttemptedRef.current) {
      return;
    }
    
    if (hasSubmitted) {
      return;
    }
    
    // Allow submission even with no answers (for auto-submission)
    const hasAnswers = Object.values(answers).some(answer => answer !== '');
    
    // Check localStorage as additional protection (but don't block submission)
    const localStorageKey = `contest_${contestId}_submitted`;
    const localSubmitted = localStorage.getItem(localStorageKey);
    if (localSubmitted === 'true') {
      // Don't block submission here - let the server decide
    }
    
    try {
      // Transform answers to the format the backend expects
      // Include ALL questions (even with empty answers)
      const answersArray = questions.map(question => ({
        questionId: question.id,
        selectedOption: answers[question.id] && answers[question.id].trim() !== '' ? answers[question.id] : '' // Use empty string if no answer
      }));
      const submissionData = {
        answers: answersArray,
        autoSubmitted: !hasAnswers, // Flag to indicate auto-submission
        violationType: currentViolationType || null // Include violation type if any
      };



      const response = await fetch(`/api/testseries/${contestId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Mark as submitted in localStorage and set global flag
        localStorage.setItem(`contest_${contestId}_submitted`, 'true');
        setHasSubmitted(true);
        submissionAttemptedRef.current = true; // Set global flag
        exitFullscreen();
        // Combine the results data properly
        const resultsData = {
          correctAnswers: data.correct || data.results.correctAnswers,
          correct: data.correct || data.results.correct,
          totalQuestions: data.total || data.results.totalQuestions,
          attemptedQuestions: data.attempted || data.results.attemptedQuestions,
          timeTaken: data.results.timeTaken || 0,
          questionResults: data.results.questionResults || [],
          hasParticipated: true,
          violations: data.violations || 0,
          autoSubmitted: data.autoSubmitted || false
        };
        
        navigate(`/contest-results/${contestId}?fromSubmission=true`, { 
          state: { 
            results: resultsData,
            contest: contest,
            submitted: true 
          }
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit contest');
        // Reset global flag on error to allow retry
        submissionAttemptedRef.current = false;
      }
    } catch (err) {
      setError(`Network error: ${err.message}. Please try again.`);
      // Reset global flag on error to allow retry
      submissionAttemptedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [contestId, answers, hasSubmitted, navigate]);

  // Simplified security system - only specific actions
  useEffect(() => {
    if (!started || hasSubmitted) return;

    // Security event handlers for specific actions only
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Add a small delay to avoid false positives
        setTimeout(() => {
          if (!document.hidden) {
            // Page became visible again quickly, might be a false positive
            return;
          }
          handleViolation('Tab switching');
        }, 200);
      }
    };

    const handleFullscreenChange = () => {
      const isFullscreenNow = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      setFullscreenActive(isFullscreenNow);
      
      if (!isFullscreenNow && isFullscreen) {
        handleViolation('F11 (fullscreen exit)');
      }
    };

    const handleKeyDown = (e) => {
      // Block specific keys and combinations
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        handleViolation('Alt+Tab (window switching)');
      }
      
      if (e.key === 'F11') {
        e.preventDefault();
        handleViolation('F11 (fullscreen exit)');
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        handleViolation('Escape key');
      }

      // Block other common window switching shortcuts
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        handleViolation('Alt+F4 (window closing)');
      }

      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        handleViolation('Ctrl+Tab (tab switching)');
      }

      if (e.ctrlKey && e.key === 'W') {
        e.preventDefault();
        handleViolation('Ctrl+W (tab closing)');
      }

      if (e.ctrlKey && e.key === 'N') {
        e.preventDefault();
        handleViolation('Ctrl+N (new window)');
      }

      if (e.ctrlKey && e.key === 'T') {
        e.preventDefault();
        handleViolation('Ctrl+T (new tab)');
      }

      // Block function keys that might be used for cheating
      if (e.key === 'F1' || e.key === 'F2' || e.key === 'F3' || e.key === 'F4' || 
          e.key === 'F5' || e.key === 'F6' || e.key === 'F7' || e.key === 'F8' || 
          e.key === 'F9' || e.key === 'F10' || e.key === 'F12') {
        e.preventDefault();
        handleViolation(`Function key ${e.key} pressed`);
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      handleViolation('Right-click context menu');
    };

    const handleBlur = (e) => {
      // Only trigger on window blur, not element blur
      if (e.target === window || e.target === document) {
        // Add a small delay to avoid false positives from legitimate UI interactions
        setTimeout(() => {
          if (document.activeElement && document.activeElement.closest('.contest-container')) {
            // User is still within the contest container, don't trigger violation
            return;
          }
          handleViolation('Window minimizing');
        }, 100);
      }
    };

    const handlePopState = (e) => {
      e.preventDefault();
      handleViolation('Browser back button');
    };

    // Additional security handlers
    const handleClick = (e) => {
      // Detect external link clicks - only on actual links, not UI elements
      const target = e.target.closest('a');
      if (target && target.href && (target.href.startsWith('http') || target.target === '_blank')) {
        e.preventDefault();
        handleViolation('External link clicks');
      }
    };

    const handleBeforeUnload = (e) => {
      // Detect tab/window closing - only if user is actually trying to leave
      if (hasSubmitted || submissionAttemptedRef.current) {
        return; // Don't trigger violation if already submitted
      }
      handleViolation('Tab switching');
      e.preventDefault();
      e.returnValue = '';
    };

    const handleResize = () => {
      // Detect window resizing (potential minimization) - only on extreme changes
      if (window.innerHeight < 50 || window.innerWidth < 50) {
        handleViolation('Window minimizing');
      }
    };

    // Set up event listeners for specific actions only - without capture to avoid interfering with UI
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('blur', handleBlur);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleClick);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('blur', handleBlur);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('resize', handleResize);
    };
  }, [started, hasSubmitted, isFullscreen]);

  // Redirect to fullscreen URL if not already in fullscreen mode
  useEffect(() => {
    if (!isFullscreen) {
      // Redirect to the same URL with fullscreen parameter
      navigate(`/take-contest/${contestId}?fullscreen=true`, { replace: true });
      return;
    }
  }, [isFullscreen, contestId, navigate]);

  // Check if user has already submitted this contest and get violation count
  useEffect(() => {
    const checkSubmissionStatus = async () => {
      try {
        // Check server for submission status first (more reliable)
        const participationsResponse = await fetch('/api/testseries/participations', {
          credentials: 'include'
        });
        
        if (participationsResponse.ok) {
          const participationsData = await participationsResponse.json();
          const currentParticipation = participationsData.participations?.find(participation => 
            participation.testSeriesId === parseInt(contestId)
          );
          
          if (currentParticipation) {
            // Set violation count if any
            if (currentParticipation.violations > 0) {
              setViolationCount(currentParticipation.violations);
            }
            
            // Check if already submitted
            if (currentParticipation.submittedAt) {
              setHasSubmitted(true);
              submissionAttemptedRef.current = true; // Set global flag
              // Store in localStorage for future checks
              const localStorageKey = `contest_${contestId}_submitted`;
              localStorage.setItem(localStorageKey, 'true');
              setError('You have already submitted this contest. Redirecting to results...');
              setTimeout(() => {
                navigate(`/contest-results/${contestId}`);
              }, 2000);
              return;
            }
          }
        }
        
        // If server check passes, clear any old localStorage data
        const localStorageKey = `contest_${contestId}_submitted`;
        localStorage.removeItem(localStorageKey);
        
      } catch (err) {
        // On error, clear localStorage to be safe
        const localStorageKey = `contest_${contestId}_submitted`;
        localStorage.removeItem(localStorageKey);
      }
    };
    
    checkSubmissionStatus();
  }, [contestId, navigate]);

  // Fetch contest data
  useEffect(() => {
    const fetchContest = async () => {
      try {
        const response = await fetch(`/api/testseries/${contestId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch contest');
        }
        
        const data = await response.json();
        
        // The API returns {testSeries: {...}} instead of {contest: {...}, questions: [...]}
        const contestData = data.testSeries;
        const questionsData = contestData?.questions || [];
        
        setContest(contestData);
        setQuestions(questionsData);
        
        // Calculate time left
        const now = new Date().getTime();
        const endTime = new Date(contestData.endTime).getTime();
        const timeRemaining = Math.max(0, endTime - now);
        setTimeLeft(timeRemaining);
        
        // Initialize answers
        const initialAnswers = {};
        questionsData.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load contest');
        setLoading(false);
      }
    };

    fetchContest();
  }, [contestId]);

  // Mark current question as visited
  useEffect(() => {
    if (started && questions.length > 0) {
      setVisitedQuestions(prev => new Set([...prev, currentQuestionIndex]));
    }
  }, [currentQuestionIndex, started, questions.length]);

  // Timer countdown
  useEffect(() => {
    if (!started || timeLeft <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          handleSubmitContest();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeLeft, started, handleSubmitContest]);

  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      // Mark current question as visited
      setVisitedQuestions(prev => new Set([...prev, currentQuestionIndex]));
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      // Mark current question as visited
      setVisitedQuestions(prev => new Set([...prev, currentQuestionIndex]));
    }
  };

  const handleQuestionClick = (index) => {
    setCurrentQuestionIndex(index);
    // Mark clicked question as visited
    setVisitedQuestions(prev => new Set([...prev, index]));
  };

  const handleMarkForReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex);
      } else {
        newSet.add(currentQuestionIndex);
      }
      return newSet;
    });
  };







  // Handler for user gesture to start contest and enter fullscreen
  const handleStartContest = () => {
    if (hasSubmitted) return; // Prevent starting if already submitted
    
    // Always try to enter fullscreen when starting the contest
    enterFullscreen();
    setStarted(true);
  };

  // Separate submit handler that immediately disables the button
  const handleSubmitClick = () => {
    if (submitting || hasSubmitted || submissionAttemptedRef.current) {
      return;
    }
    
    // Immediately set submitting to prevent multiple clicks
    setSubmitting(true);
    handleSubmitContest();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
          <p className="text-gray-600">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => navigate('/contests')}
            className="mt-4 px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Back to Contests
          </button>
        </div>
      </div>
    );
  }

  // Show Start Contest button if not started
  if (!started) {
    // If already submitted, redirect to results
    if (hasSubmitted) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <Trophy className="w-16 h-16 mx-auto mb-6 text-black" />
            <h2 className="text-2xl font-bold mb-4">Contest Already Submitted</h2>
            <p className="text-gray-600 mb-8">You have already submitted this contest. Redirecting to results...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-6 text-black" />
          <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-gray-600 mb-8">Click below to begin the contest. Full screen mode will be activated if supported by your browser.</p>
          <button
            onClick={handleStartContest}
            disabled={hasSubmitted}
            className={`px-8 py-4 text-lg font-semibold rounded transition-colors ${
              hasSubmitted 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {hasSubmitted ? 'Already Submitted' : 'Start Contest'}
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.values(answers).filter(answer => answer !== '').length;

  return (
    <div className="min-h-screen bg-white contest-container">


      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-black">{contest?.title}</h1>
                <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
                </span>
            {isFullscreen && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 border border-blue-300">
                <Lock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-600">FULLSCREEN MODE</span>
              </div>
            )}
              </div>
              
          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className={`flex items-center space-x-2 px-3 py-2 border ${
              timeLeft < 300000 ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
            }`}>
              <Clock className={`w-4 h-4 ${timeLeft < 300000 ? 'text-red-600' : 'text-gray-600'}`} />
              <span className={`font-mono font-semibold ${timeLeft < 300000 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
            {/* Progress */}
            <div className="text-sm text-gray-600">
              {answeredCount}/{questions.length} answered
            </div>

            {/* Violation Counter */}
            {violationCount > 0 && (
              <div className="flex items-center space-x-2 px-3 py-2 border border-red-300 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-600">
                  Violations: {violationCount}/2
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmitClick}
              disabled={submitting || hasSubmitted}
              className={`px-4 py-2 font-semibold transition-colors ${
                hasSubmitted 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : submitting
                  ? 'bg-gray-500 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {hasSubmitted ? 'Already Submitted' : submitting ? 'Submitting...' : 'Submit Contest'}
            </button>
          </div>
        </div>
      </div>

  

      {/* Main Content with Right Sidebar */}
      <div className="flex">
        {/* Question Content */}
        <div className="flex-1 p-6">
          {currentQuestion && (
            <div className="space-y-6">
          {/* Question */}
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-black mb-4">
                  Question {currentQuestionIndex + 1}
              </h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {currentQuestion.question}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {Object.keys(currentQuestion.options)
                .filter(option => currentQuestion.options[option] && currentQuestion.options[option].trim() !== '')
                .map(option => (
                  <label
                    key={option}
                    className={`flex items-center space-x-3 p-4 border cursor-pointer transition-colors ${
                      answers[currentQuestion.id] === option
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                    />
                    <span className="font-medium text-gray-900">
                      {option.toUpperCase()}. {currentQuestion.options[option]}
                    </span>
                  </label>
                ))}
            </div>
          </div>

          {/* Navigation */}
              <div className="flex items-center justify-between">
            <button
              onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
            </button>

                <div className="flex items-center space-x-2">
              <button
                    onClick={handleMarkForReview}
                    className={`flex items-center space-x-2 px-4 py-2 border transition-colors ${
                      markedForReview.has(currentQuestionIndex)
                        ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                        : 'bg-white text-purple-600 border-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <span className="text-sm">★</span>
                    <span className="text-sm font-medium">
                      {markedForReview.has(currentQuestionIndex) ? 'Unmark Review' : 'Mark for Review'}
                    </span>
              </button>
                </div>

                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="flex items-center space-x-2 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Question Navigation Panel */}
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          {/* Legend */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Question Status</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-white border border-gray-300"></div>
                <span className="text-gray-600">Not Visited</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 border border-red-500"></div>
                <span className="text-gray-600">Current Question</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 border border-orange-500"></div>
                <span className="text-gray-600">Visited but Not Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 border border-green-500"></div>
                <span className="text-gray-600">Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 border border-purple-500"></div>
                <span className="text-gray-600">Marked for Review</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 border border-purple-500 relative">
                  <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-gray-600">Answered & Marked for Review</span>
          </div>
        </div>
      </div>

          {/* Question Grid */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Question Palette</h3>
            <div className="grid grid-cols-8 gap-1">
              {questions.map((question, index) => {
                const isCurrent = index === currentQuestionIndex;
                const isAnswered = answers[question.id] && answers[question.id] !== '';
                const isVisited = visitedQuestions.has(index);
                const isMarkedForReview = markedForReview.has(index);
                
                let bgColor = 'bg-white border-gray-300';
                let textColor = 'text-gray-700';
                
                if (isCurrent && !isAnswered && !isMarkedForReview) {
                  bgColor = 'bg-red-500 border-red-500';
                  textColor = 'text-white';
                } else if (isCurrent && isMarkedForReview) {
                  bgColor = 'bg-purple-500 border-purple-500';
                  textColor = 'text-white';
                } else if (isAnswered && isMarkedForReview) {
                  bgColor = 'bg-purple-500 border-purple-500 relative';
                  textColor = 'text-white';
                } else if (isMarkedForReview) {
                  bgColor = 'bg-purple-500 border-purple-500';
                  textColor = 'text-white';
                } else if (isAnswered) {
                  bgColor = 'bg-green-500 border-green-500';
                  textColor = 'text-white';
                } else if (isVisited && !isAnswered) {
                  bgColor = 'bg-orange-500 border-orange-500';
                  textColor = 'text-white';
                }
                
                return (
              <button
                    key={question.id}
                    onClick={() => handleQuestionClick(index)}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-medium border transition-colors ${bgColor} ${textColor} hover:opacity-80 relative`}
              >
                    {index + 1}
                    {isAnswered && isMarkedForReview && (
                      <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    )}
              </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="text-xs text-gray-600 space-y-1">
            <div>Total Questions: {questions.length}</div>
            <div>Answered: {Object.values(answers).filter(answer => answer !== '').length}</div>
            <div>Not Answered: {questions.length - Object.values(answers).filter(answer => answer !== '').length}</div>
            <div>Not Visited: {questions.length - visitedQuestions.size}</div>
            <div>Visited: {visitedQuestions.size}</div>
            <div>Marked for Review: {markedForReview.size}</div>
          </div>
        </div>
      </div>

      {/* Violation Warning Modal - First Violation */}
      {showViolationWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Security Warning!</h3>
            <p className="text-gray-600 mb-4">
              A security violation has been detected: <strong>{currentViolationType}</strong>
            </p>
            <p className="text-gray-600 mb-6">
              This is your <strong>first warning</strong>. Any further violations will result in automatic submission of your contest.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowViolationWarning(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
              >
                Continue Contest
              </button>
              <button
                onClick={() => {
                  setShowViolationWarning(false);
                  handleSubmitContest();
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Warning Modal - Second Violation */}
      {showSecurityWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Final Security Violation!</h3>
            <p className="text-gray-600 mb-4">
              A second security violation has been detected: <strong>{currentViolationType}</strong>
            </p>
            <p className="text-gray-600 mb-4">
              Your contest will be automatically submitted in 3 seconds.
            </p>
            <div className="text-sm text-gray-500">
              <p>Auto-submitting contest...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeContest; 