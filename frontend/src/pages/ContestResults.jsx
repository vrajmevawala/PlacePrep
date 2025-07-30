import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BarChart3, 
  ArrowLeft, 
  Star, 
  Target, 
  Award 
} from 'lucide-react';

const ContestResults = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(location.state?.results || null);
  const [contest, setContest] = useState(location.state?.contest || null);
  const [loading, setLoading] = useState(!location.state?.results);
  const [error, setError] = useState('');

  useEffect(() => {
    // If we already have results from state, don't fetch
    if (location.state?.results) {
      return;
    }

    const fetchResults = async () => {
      try {
        // Try to fetch contest info and show a message
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

  if (!results) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Results not available yet</p>
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

  const score = results.correctAnswers || 0;
  const totalQuestions = results.totalQuestions || 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const timeTaken = results.timeTaken || 0;

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
            Performance Summary
          </h2>
          
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

          {/* Performance Message */}
          <div className="text-center p-6 bg-gray-50 border border-gray-200">
            <div className="text-lg font-semibold text-black mb-2">
              {getPerformanceMessage(percentage)}
            </div>
            <div className="text-sm text-gray-600">
              Contest: {contest?.title}
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        {results.questionResults && results.questionResults.length > 0 && (
          <div className="bg-white border border-gray-200 p-8 mb-8">
            <h3 className="text-xl font-bold text-black mb-6 flex items-center">
              <Target className="w-5 h-5 mr-3 text-black" />
              Question Analysis
            </h3>
            
            <div className="space-y-4">
              {results.questionResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 border ${
                    result.isCorrect 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-semibold text-black">
                          Question {index + 1}
                        </span>
                        {result.isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{result.question}</p>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-600">
                          Your Answer: <span className="font-medium">{result.userAnswer || 'Not answered'}</span>
                        </p>
                        {!result.isCorrect && (
                          <p className="text-green-600">
                            Correct Answer: <span className="font-medium">{result.correctAnswer}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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