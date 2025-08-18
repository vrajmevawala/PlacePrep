import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  Clock, 
  BarChart3, 
  ArrowLeft, 
  Star, 
  Target, 
  Award,
  AlertTriangle
} from 'lucide-react';

const ContestResults = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(location.state?.results || null);
  const [contest, setContest] = useState(location.state?.contest || null);
  const [loading, setLoading] = useState(!location.state?.results);
  const [error, setError] = useState('');
  const [timeUntilEnd, setTimeUntilEnd] = useState(0);

  useEffect(() => {
    // If we already have results from state, don't fetch
    if (location.state?.results) {
      return;
    }

    const fetchResults = async () => {
      try {
        // Check if we have a participation ID from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const participationId = urlParams.get('pid');
        
        // First try to fetch results
        const resultsUrl = participationId 
          ? `/api/testseries/${contestId}/result?pid=${participationId}`
          : `/api/testseries/${contestId}/result`;
          
        const resultsResponse = await fetch(resultsUrl, {
          credentials: 'include'
        });
        
        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          setResults(resultsData);
          
          // Also fetch contest info to determine if contest has ended
          const contestResponse = await fetch(`/api/testseries/${contestId}`, {
            credentials: 'include'
          });
          
          if (contestResponse.ok) {
            const contestData = await contestResponse.json();
            setContest(contestData.testSeries);
          }
          
          setLoading(false);
          return;
        } else if (resultsResponse.status === 403) {
          // Contest hasn't ended yet
          const errorData = await resultsResponse.json();
          console.log('Contest not ended yet:', errorData);
        }
        
        // If no results or contest hasn't ended, fetch contest info
        const contestResponse = await fetch(`/api/testseries/${contestId}`, {
          credentials: 'include'
        });
        
        if (contestResponse.ok) {
          const contestData = await contestResponse.json();
          setContest(contestData.testSeries);
          setResults(null); // No results available
          setLoading(false);
        } else {
          throw new Error('Failed to fetch contest information');
        }
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load results');
        setLoading(false);
      }
    };

    fetchResults();
  }, [contestId, location.state]);

  // Countdown timer for contest end
  useEffect(() => {
    if (!contest) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const endTime = new Date(contest.endTime).getTime();
      const timeLeft = Math.max(0, endTime - now);
      setTimeUntilEnd(timeLeft);
      
      // Auto-refresh when contest ends
      if (timeLeft === 0 && !results) {
        setTimeout(() => {
          window.location.reload();
        }, 2000); // Wait 2 seconds after contest ends before refreshing
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [contest, results]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
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

  // Helper function to format countdown time
  const formatCountdown = (ms) => {
    if (ms <= 0) return '00:00:00';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if contest has ended - use UTC comparison to avoid timezone issues
  const isContestEnded = contest && new Date().getTime() > new Date(contest.endTime).getTime();
  
  // Debug logging for troubleshooting
  // console.log('Contest ended:', isContestEnded);
  // console.log('Has results:', !!results);
  // console.log('Results data:', results);
  // console.log('Current time (UTC):', new Date().toISOString());
  // console.log('Contest end time (UTC):', contest?.endTime);
  // console.log('Contest end time (local):', contest ? new Date(contest.endTime).toLocaleString() : 'N/A');
  // console.log('hasResultsFromSubmission:', hasResultsFromSubmission);
  // console.log('hasFetchedResults:', hasFetchedResults);
  // console.log('shouldShowResults:', shouldShowResults);
  // console.log('results.hasParticipated:', results?.hasParticipated);
  // console.log('results.correct:', results?.correct);
  
  // Check if we have results from submission or if we have fetched results showing participation
  const hasResultsFromSubmission = location.state?.results && location.state.submitted;
  const hasFetchedResults = results && results.hasParticipated;
  const shouldShowResults = isContestEnded && (hasResultsFromSubmission || hasFetchedResults);
  
  if (!shouldShowResults) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-black mb-4">Results Coming Soon!</h2>
          <p className="text-gray-600 mb-6">
            {contest ? (
              <>
                Contest: <span className="font-semibold">{contest.title}</span><br />
                Ends: <span className="font-semibold">{new Date(contest.endTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
              </>
            ) : (
              "Results will be available after the contest ends."
            )}
          </p>
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500">
              {contest && isContestEnded 
                ? "Processing results..." 
                : "Waiting for contest to end..."
              }
            </span>
          </div>
          
          {contest && !isContestEnded && timeUntilEnd > 0 && (
            <div className="bg-gray-100 border border-gray-300 p-4 mb-6 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Time until results are available:</div>
                <div className="text-2xl font-mono font-bold text-black">
                  {formatCountdown(timeUntilEnd)}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate('/contests')}
            className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Back to Contests
          </button>
        </div>
      </div>
    );
  }

  // Use results from submission state if available, otherwise use fetched results
  const finalResults = location.state?.results || results;
  
  const score = finalResults.correct || finalResults.correctAnswers || 0;
  const totalQuestions = finalResults.totalQuestions || 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const timeTaken = finalResults.timeTaken || 0;
  
  // Debug logging for troubleshooting
  // console.log('Final results data:', finalResults);
  // console.log('Score:', score, 'Total:', totalQuestions, 'Percentage:', percentage);

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) return 'Excellent! Outstanding performance!';
    if (percentage >= 80) return 'Great job! Well done!';
    if (percentage >= 70) return 'Good work! Keep it up!';
    if (percentage >= 60) return 'Not bad! Room for improvement.';
    return 'Keep practicing! You can do better!';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-black flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-black">Contest Results</h1>
              <p className="text-gray-600 mt-2">Your performance summary</p>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 text-black" />
            {finalResults?.hasParticipated ? 'Performance Summary' : 'Contest Information'}
          </h2>
          
          {finalResults?.hasParticipated ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Score */}
              <div className="text-center p-6 bg-gray-50 border border-gray-200">
                <div className="text-4xl font-bold text-black mb-2">{score}/{totalQuestions}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              
              {/* Percentage */}
              <div className="text-center p-6 bg-gray-50 border border-gray-200">
                <div className={`text-4xl font-bold mb-2 ${getPerformanceColor(percentage)}`}>
                  {percentage}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              
              {/* Time Taken */}
              <div className="text-center p-6 bg-gray-50 border border-gray-200">
                <div className="text-4xl font-bold text-black mb-2">
                  {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Contest Info */}
              <div className="text-center p-6 bg-gray-50 border border-gray-200">
                <div className="text-4xl font-bold text-black mb-2">{totalQuestions}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              
              {/* Contest Status */}
              <div className="text-center p-6 bg-gray-50 border border-gray-200">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  Completed
                </div>
                <div className="text-sm text-gray-600">Contest Status</div>
              </div>
              
              {/* Contest Duration */}
              <div className="text-center p-6 bg-gray-50 border border-gray-200">
                <div className="text-4xl font-bold text-black mb-2">
                  {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-600">Contest Duration</div>
              </div>
            </div>
          )}

          {/* Violation Information - Only show for participants */}
          {finalResults?.hasParticipated && finalResults.violations > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="text-lg font-semibold text-red-800">Security Violations</h4>
              </div>
              <p className="text-red-700">
                {finalResults.violations === 1 
                  ? '1 security violation was recorded during this contest.'
                  : `${finalResults.violations} security violations were recorded during this contest.`
                }
                {finalResults.autoSubmitted && ' Contest was automatically submitted due to multiple violations.'}
              </p>
            </div>
          )}

          {/* Time-based Auto-submission Warning */}
          {results?.hasParticipated && results?.autoSubmitted && results?.timeTaken === 'Auto-submitted (time expired)' && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <h4 className="text-lg font-semibold text-orange-800">Auto-Submission</h4>
              </div>
              <p className="text-orange-700">
                This contest was automatically submitted when the time limit expired. Your answers were saved and scored.
              </p>
            </div>
          )}

          {/* Performance Message */}
          <div className="text-center p-6 bg-gray-50 border border-gray-200">
            <div className="text-lg font-semibold text-black mb-2">
              {finalResults?.hasParticipated ? getPerformanceMessage(percentage) : 'Contest has been completed'}
            </div>
            <div className="text-sm text-gray-600">
              Contest: {contest?.title}
            </div>
            {!finalResults?.hasParticipated && (
              <div className="text-sm text-gray-500 mt-2">
                You did not participate in this contest
              </div>
            )}
          </div>
        </div>



                {/* Detailed Results - Only show for participants */}
        {finalResults?.hasParticipated && (
          <div className="bg-white border border-gray-200 p-8 mb-8">
            <h3 className="text-xl font-bold text-black mb-6 flex items-center">
              <Target className="w-5 h-5 mr-3 text-black" />
              Question Analysis
            </h3>
            
            {(finalResults.questionResults || finalResults.details) && (finalResults.questionResults || finalResults.details).length > 0 ? (
              <div className="space-y-6">
              {(finalResults.questionResults || finalResults.details).map((result, index) => {
                const userAnswer = result.userAnswer || result.selected;
                const correctAnswer = result.correctAnswer || result.correct;
                const options = result.options || {};
                const isAttempted = result.isAttempted || userAnswer;
                
                return (
                  <div
                    key={index}
                    className={`p-6 border rounded-lg ${
                      result.isCorrect 
                        ? 'border-green-200 bg-green-50' 
                        : result.isAttempted || userAnswer
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-semibold text-black">
                          Question {index + 1}
                        </span>
                        {result.isCorrect ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Correct
                          </span>
                        ) : isAttempted ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            <XCircle className="w-4 h-4 mr-1" />
                            Wrong
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            <MinusCircle className="w-4 h-4 mr-1" />
                            Not Attempted
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-lg text-gray-900 font-medium mb-4">{result.question}</p>
                      
                      <div className="space-y-2">
                        {Object.entries(options).map(([key, value]) => {
                          const isCorrect = key === correctAnswer;
                          const isSelected = key === userAnswer;
                          const isWrongSelection = isSelected && !isCorrect;
                          
                          return (
                            <div
                              key={key}
                              className={`p-3 border rounded-lg ${
                                isCorrect 
                                  ? 'border-green-500 bg-green-100 text-green-800' 
                                  : isWrongSelection
                                  ? 'border-red-500 bg-red-100 text-red-800'
                                  : 'border-gray-200 bg-white text-gray-700'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                                  isCorrect 
                                    ? 'bg-green-500 text-white' 
                                    : isWrongSelection
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {key.toUpperCase()}
                                </span>
                                <span className="flex-1">{value}</span>
                                {isCorrect && (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                                {isWrongSelection && (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="text-sm space-y-2 text-gray-600">
                      {isAttempted && (
                        <p>
                          <span className="font-medium">Your Answer:</span> {userAnswer ? `${userAnswer.toUpperCase()}. ${options[userAnswer]}` : 'Not answered'}
                        </p>
                      )}
                      {!result.isCorrect && isAttempted && (
                        <p>
                          <span className="font-medium text-green-600">Correct Answer:</span> {correctAnswer ? `${correctAnswer.toUpperCase()}. ${options[correctAnswer]}` : 'Not available'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No question details available
            </div>
          )}
          </div>
        )}

        {/* Contest Questions - Show for non-participants */}
        {!finalResults?.hasParticipated && (finalResults.questionResults || finalResults.details) && (finalResults.questionResults || finalResults.details).length > 0 && (
          <div className="bg-white border border-gray-200 p-8 mb-8">
            <h3 className="text-xl font-bold text-black mb-6 flex items-center">
              <Target className="w-5 h-5 mr-3 text-black" />
              Contest Questions
            </h3>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                <strong>Note:</strong> You did not participate in this contest. Below are the questions that were asked.
              </p>
            </div>
            
            <div className="space-y-6">
              {(finalResults.questionResults || finalResults.details).map((result, index) => {
                const options = result.options || {};
                const correctAnswer = result.correctAnswer || result.correct;
                
                return (
                  <div
                    key={index}
                    className="p-6 border border-gray-200 bg-gray-50 rounded-lg"
                  >
                    <div className="mb-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-lg font-semibold text-black">
                          Question {index + 1}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          Contest Question
                        </span>
                      </div>
                      
                      <p className="text-lg text-gray-900 font-medium mb-4">{result.question}</p>
                      
                      <div className="space-y-2">
                        {Object.entries(options).map(([key, value]) => {
                          const isCorrect = key === correctAnswer;
                          
                          return (
                            <div
                              key={key}
                              className={`p-3 border rounded-lg ${
                                isCorrect 
                                  ? 'border-green-500 bg-green-100 text-green-800' 
                                  : 'border-gray-200 bg-white text-gray-700'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                                  isCorrect 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {key.toUpperCase()}
                                </span>
                                <span className="flex-1">{value}</span>
                                {isCorrect && (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {correctAnswer && (
                      <div className="text-sm text-gray-600">
                        <p>
                          <span className="font-medium text-green-600">Correct Answer:</span> {correctAnswer ? `${correctAnswer.toUpperCase()}. ${options[correctAnswer]}` : 'Not available'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/contests')}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Contests</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/results')}
              className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              View All Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestResults; 