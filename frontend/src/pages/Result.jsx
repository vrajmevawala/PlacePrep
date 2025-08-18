import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';
import { 
  Loader2, BarChart3, Trophy, Target, Clock, TrendingUp, Award, Users, 
  Calendar, Filter, Eye, Download, Medal, CheckCircle, XCircle, MinusCircle 
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart, BarChart, Bar, PieChart, Pie, Cell, Label } from 'recharts';

const Result = () => {
  const [participations, setParticipations] = useState([]);
  const [results, setResults] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'practice', 'contest'
  const [selectedTest, setSelectedTest] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const chartRef = useRef({});

  useEffect(() => {
    const fetchParticipations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [testSeriesData, freePracticeData] = await Promise.all([
          fetch('/api/testseries/participations', { credentials: 'include' }).then(res => res.json()),
          fetch('/api/free-practice/participations', { credentials: 'include' }).then(res => res.json())
        ]);

        const testSeriesParticipations = (testSeriesData.participations || []).map(p => ({ ...p, _type: 'contest' }));
        const freePracticeParticipations = (freePracticeData.participations || []).map(p => ({ ...p, _type: 'practice' }));
        const allParticipations = [...testSeriesParticipations, ...freePracticeParticipations].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        
        setParticipations(allParticipations);

        const resultsObj = {};
        const statsObj = {};

        // Fetch results for each participation
        for (const p of allParticipations) {
          try {
            if (p._type === 'contest') {
              const res = await fetch(`/api/testseries/${p.testSeriesId}/result?pid=${p.pid}`, { credentials: 'include' });
              
              if (res.status === 403) {
                resultsObj[p.pid] = { error: 'Results not available yet', contestNotEnded: true };
              } else if (res.ok) {
                const resultData = await res.json();
                resultsObj[p.pid] = resultData;
              } else {
                resultsObj[p.pid] = { error: 'No result available' };
              }

              if (!statsObj[p.testSeriesId]) {
                try {
                  const statRes = await fetch(`/api/testseries/${p.testSeriesId}/stats`, { credentials: 'include' });
                  if (statRes.ok) {
                    statsObj[p.testSeriesId] = await statRes.json();
                  } else {
                    statsObj[p.testSeriesId] = { error: 'No stats available' };
                  }
                } catch (statError) {
                  statsObj[p.testSeriesId] = { error: 'Failed to load stats' };
                }
              }
            } else {
              const res = await fetch(`/api/free-practice/result?pid=${p.pid}`, { credentials: 'include' });
              if (res.ok) {
                const resultData = await res.json();
                resultsObj[p.pid] = resultData;
                statsObj[p.freePracticeId] = { 
                  totalQuestions: resultData.totalQuestions || resultData.correct || 0, 
                  scores: [], 
                  average: 0 
                };
              } else {
                resultsObj[p.pid] = { error: 'No result available' };
              }
            }
          } catch (error) {
            console.error('Error fetching result for participation:', p.pid, error);
            resultsObj[p.pid] = { error: 'Failed to load result' };
          }
        }

        setResults(resultsObj);
        setStats(statsObj);
      } catch (error) {
        console.error('Error fetching participations:', error);
        setError('Failed to load participations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipations();
  }, []);

  // Fetch leaderboard data
  const fetchLeaderboard = async (contestId) => {
    setLoadingLeaderboard(true);
    try {
      const response = await fetch(`/api/testseries/${contestId}/leaderboard`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data);
      } else {
        console.error('Failed to fetch leaderboard');
        setLeaderboardData(null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboardData(null);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Calculate performance metrics
  const practiceTests = participations.filter(p => p._type === 'practice');
  const contestTests = participations.filter(p => p._type === 'contest');
  
  const completedPractice = practiceTests.filter(p => {
    const result = results[p.pid];
    return result && !result.error;
  });
  
  const completedContests = contestTests.filter(p => {
    const result = results[p.pid];
    return result && !result.error && !result.contestNotEnded;
  });

  // Calculate rank for contests
  const getContestRank = (contestId, userScore) => {
    const contestStats = stats[contestId];
    if (!contestStats || !contestStats.scores || contestStats.scores.length === 0) return '-';
    
    const sortedScores = [...contestStats.scores].sort((a, b) => b - a);
    const rank = sortedScores.findIndex(score => score <= userScore) + 1;
    return rank;
  };

  const performanceMetrics = {
    totalPracticeTests: practiceTests.length,
    totalContests: contestTests.length,
    completedPracticeTests: completedPractice.length,
    completedContests: completedContests.length,
    averagePracticeScore: completedPractice.length > 0 
      ? (completedPractice.reduce((sum, p) => {
          const result = results[p.pid];
          const correctScore = result?.correct ?? result?.correctAnswers ?? 0;
          const totalQuestions = result?.totalQuestions ?? 0;
          return sum + (totalQuestions > 0 ? (correctScore / totalQuestions) * 100 : 0);
        }, 0) / completedPractice.length).toFixed(1)
      : '0',
    averageContestScore: completedContests.length > 0 
      ? (completedContests.reduce((sum, p) => {
          const result = results[p.pid];
          const correctScore = result?.correct ?? result?.correctAnswers ?? 0;
          const totalQuestions = result?.totalQuestions ?? 0;
          return sum + (totalQuestions > 0 ? (correctScore / totalQuestions) * 100 : 0);
        }, 0) / completedContests.length).toFixed(1)
      : '0',
    averageAccuracy: (completedPractice.length + completedContests.length) > 0 
      ? ((completedPractice.reduce((sum, p) => {
          const result = results[p.pid];
          const correctScore = result?.correct ?? result?.correctAnswers ?? 0;
          const totalQuestions = result?.totalQuestions ?? 0;
          return sum + (totalQuestions > 0 ? (correctScore / totalQuestions) * 100 : 0);
        }, 0) + completedContests.reduce((sum, p) => {
          const result = results[p.pid];
          const correctScore = result?.correct ?? result?.correctAnswers ?? 0;
          const totalQuestions = result?.totalQuestions ?? 0;
          return sum + (totalQuestions > 0 ? (correctScore / totalQuestions) * 100 : 0);
        }, 0)) / (completedPractice.length + completedContests.length)).toFixed(1)
      : '0'
  };

  // Score trend data for chart
  const scoreTrendData = [...completedPractice, ...completedContests]
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .map((p, index) => {
      const result = results[p.pid];
      const correctScore = result?.correct ?? result?.correctAnswers ?? 0;
      const totalQuestions = result?.totalQuestions ?? 0;
      const percentage = totalQuestions > 0 ? (correctScore / totalQuestions) * 100 : 0;
      
      return {
        date: p.startTime ? new Date(p.startTime).toLocaleDateString() : `Test ${index + 1}`,
        score: percentage,
        type: p._type === 'practice' ? 'Practice' : 'Contest',
        name: p._type === 'contest' ? (p.testSeries?.title || 'Contest') : (p.freePractice?.title || 'Practice')
      };
    });

  // Overview: completion and highlights calculations
  const totalTests = practiceTests.length + contestTests.length;
  const totalCompleted = completedPractice.length + completedContests.length;
  const totalPending = Math.max(totalTests - totalCompleted, 0);
  const completionData = [
    { name: 'Completed', value: totalCompleted },
    { name: 'Pending', value: totalPending }
  ];
  const COMPLETION_COLORS = ['#111827', '#E5E7EB'];

  const highestPercentage = (() => {
    const values = scoreTrendData.map(d => d.score);
    return values.length ? Math.max(...values).toFixed(1) : '0';
  })();

  const lastActivity = participations[0];
  const lastResult = lastActivity ? results[lastActivity.pid] : null;
  const lastCorrect = lastResult?.correct ?? lastResult?.correctAnswers ?? 0;
  const lastTotal = lastResult?.totalQuestions ?? 0;
  const lastPercentage = lastTotal > 0 ? ((lastCorrect / lastTotal) * 100).toFixed(1) : '0';

  const bestContestRank = (() => {
    const ranks = completedContests.map(p => {
      const userScore = (results[p.pid]?.correct ?? results[p.pid]?.correctAnswers ?? 0);
      return getContestRank(p.testSeriesId, userScore);
    });
    const numericRanks = ranks
      .filter(r => r !== '-' && r !== null && r !== undefined)
      .map(r => Number(r))
      .filter(n => Number.isFinite(n));
    return numericRanks.length ? Math.min(...numericRanks) : null;
  })();

  const TabButton = ({ id, label, icon: Icon, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
        activeTab === id
          ? 'bg-black text-white shadow-md'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-1 rounded-full text-xs ${
          activeTab === id ? 'bg-white text-black' : 'bg-gray-100 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const PerformanceCard = ({ title, value, subtitle, icon: Icon, color = 'black' }) => (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-black mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-black" />
        </div>
      </div>
    </div>
  );

  const TestResultRow = ({ test, result, type }) => {
    const correctScore = result?.correct ?? result?.correctAnswers ?? 0;
    const totalQuestions = result?.totalQuestions ?? 0;
    const percentage = totalQuestions > 0 ? ((correctScore / totalQuestions) * 100).toFixed(1) : '0';
    const accuracy = totalQuestions > 0 ? ((correctScore / totalQuestions) * 100).toFixed(1) : '0';
    
    // Contest-specific data
    const rank = type === 'contest' ? getContestRank(test.testSeriesId, correctScore) : null;
    const participants = type === 'contest' ? (stats[test.testSeriesId]?.totalParticipants || 0) : null;

    return (
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="py-4 px-6">
          <div className="font-medium text-gray-900">
            {type === 'contest' ? (test.testSeries?.title || 'Contest') : (test.freePractice?.title || 'Practice')}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {test.startTime ? new Date(test.startTime).toLocaleDateString() : '-'}
          </div>
        </td>
        {type === 'contest' && (
          <td className="py-4 px-6">
            {rank !== '-' ? (
              <div className="flex items-center space-x-2">
                <Medal className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-gray-900">{rank}</span>
              </div>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </td>
        )}
        <td className="py-4 px-6">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900">{correctScore}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{totalQuestions}</span>
          </div>
        </td>
        <td className="py-4 px-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            parseFloat(percentage) >= 80 ? 'bg-green-100 text-green-800' :
            parseFloat(percentage) >= 60 ? 'bg-yellow-100 text-yellow-800' :
            parseFloat(percentage) >= 40 ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {percentage}%
          </span>
        </td>
        <td className="py-4 px-6">
          <span className="text-sm font-medium text-gray-900">{accuracy}%</span>
        </td>
        {type === 'contest' && (
          <td className="py-4 px-6">
            <span className="text-sm text-gray-600">{participants}</span>
          </td>
        )}
        <td className="py-4 px-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedTest({ test, result, type })}
              className="inline-flex items-center px-3 py-2 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4 mr-1" />
              Details
            </button>
            {type === 'contest' && (
                          <button
              onClick={() => {
                setSelectedTest({ test, result, type, showLeaderboard: true });
                fetchLeaderboard(test.testSeriesId);
              }}
              className="inline-flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Leaderboard
            </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 font-medium">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-black flex items-center justify-center rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">My Results</h1>
              <p className="text-gray-600 mt-2">Track your performance across practice tests and contests</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          <TabButton 
            id="overview" 
            label="Overview" 
            icon={TrendingUp} 
          />
          <TabButton 
            id="practice" 
            label="Practice Tests" 
            icon={Target} 
            count={completedPractice.length}
          />
          <TabButton 
            id="contest" 
            label="Contest Results" 
            icon={Trophy} 
            count={completedContests.length}
          />
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <PerformanceCard
                title="Practice Tests"
                value={`${performanceMetrics.completedPracticeTests}/${performanceMetrics.totalPracticeTests}`}
                subtitle="Completed"
                icon={Target}
                color="blue"
              />
              <PerformanceCard
                title="Contests"
                value={`${performanceMetrics.completedContests}/${performanceMetrics.totalContests}`}
                subtitle="Participated"
                icon={Trophy}
                color="yellow"
              />
              <PerformanceCard
                title="Average Score"
                value={`${performanceMetrics.averageAccuracy}%`}
                subtitle="Overall"
                icon={TrendingUp}
                color="green"
              />
              <PerformanceCard
                title="Best Performance"
                value={Math.max(
                  parseFloat(performanceMetrics.averagePracticeScore) || 0,
                  parseFloat(performanceMetrics.averageContestScore) || 0
                ).toFixed(1) + '%'}
                subtitle="Category"
                icon={Award}
                color="purple"
              />
            </div>
            
            {/* Score Trend Chart */}
            {scoreTrendData.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Score Trend Over Time</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={scoreTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#374151', fontSize: 12 }}
                      axisLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fill: '#374151', fontSize: 12 }}
                      axisLine={{ stroke: '#d1d5db' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name) => [`${value}%`, 'Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#000000" 
                      strokeWidth={3}
                      dot={{ r: 6, fill: '#000000', stroke: 'white', strokeWidth: 2 }} 
                      activeDot={{ r: 8, fill: '#000000', stroke: 'white', strokeWidth: 2 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Completion and Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Completion Donut */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Completion Overview</h3>
                  <span className="text-sm text-gray-500">{totalCompleted}/{totalTests} completed</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={completionData}
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {completionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COMPLETION_COLORS[index % COMPLETION_COLORS.length]} />
                          ))}
                          <Label
                            value={`${totalTests > 0 ? Math.round((totalCompleted / totalTests) * 100) : 0}%`}
                            position="center"
                            fill="#111827"
                            fontSize={20}
                          />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          formatter={(val, name) => [val, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#111827' }} />
                    <span className="text-sm text-gray-700">Completed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#E5E7EB' }} />
                    <span className="text-sm text-gray-700">Pending</span>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Highlights</h3>
                <div className="space-y-4">
                  <div className="flex items-start justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">Highest Percentage</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{highestPercentage}%</p>
                    </div>
                    <Award className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex items-start justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">Best Contest Rank</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{bestContestRank ? `#${bestContestRank}` : '-'}</p>
                    </div>
                    <Trophy className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex items-start justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">Last Activity</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{lastPercentage}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {lastActivity?.startTime ? new Date(lastActivity.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                      </p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-black" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Practice Tests Tab */}
        {activeTab === 'practice' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                  <Target className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Practice Test Results</h2>
            </div>
                <span className="text-sm text-gray-500">
                  {completedPractice.length} completed tests
                </span>
          </div>
            </div>
            
            {completedPractice.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Test Name</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Topic</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Questions</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Score</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Percentage</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Accuracy</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                      {completedPractice.map(p => {
                    const result = results[p.pid];
                        const correctScore = result?.correct ?? result?.correctAnswers ?? 0;
                        const totalQuestions = result?.totalQuestions ?? 0;
                        const percentage = totalQuestions > 0 ? ((correctScore / totalQuestions) * 100).toFixed(1) : '0';
                        const accuracy = totalQuestions > 0 ? ((correctScore / totalQuestions) * 100).toFixed(1) : '0';

                    return (
                          <tr key={p.pid} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">
                                {p.freePractice?.title || 'Practice Test'}
                          </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {p.startTime ? new Date(p.startTime).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                              <span className="text-sm text-gray-600">
                                {p.freePractice?.category || 'General'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm font-medium text-gray-900">{totalQuestions}</span>
                        </td>
                        <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900">{correctScore}</span>
                              <span className="text-gray-400">/</span>
                                <span className="text-gray-600">{totalQuestions}</span>
                            </div>
                        </td>
                        <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                parseFloat(percentage) >= 80 ? 'bg-green-100 text-green-800' :
                                parseFloat(percentage) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                parseFloat(percentage) >= 40 ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                                {percentage}%
                            </span>
                        </td>
                        <td className="py-4 px-6">
                              <span className="text-sm font-medium text-gray-900">{accuracy}%</span>
                        </td>
                        <td className="py-4 px-6">
                            <button 
                                onClick={() => setSelectedTest({ test: p, result, type: 'practice' })}
                                className="inline-flex items-center px-4 py-2 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
                          </div>
            ) : (
              <div className="text-center py-12">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <div className="text-lg font-medium text-gray-500 mb-2">No practice tests completed</div>
                <div className="text-gray-400">Start practicing to see your results here</div>
              </div>
            )}
            </div>
          )}
          
        {/* Contest Results Tab */}
        {activeTab === 'contest' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Contest Results</h2>
                </div>
                <span className="text-sm text-gray-500">
                  {completedContests.length} contests participated
                            </span>
              </div>
            </div>
            
            {completedContests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                                    <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Contest Name</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Rank</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Score</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Percentage</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Accuracy</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Participants</th>
                      <th className="py-4 px-6 text-left font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {completedContests.map(p => (
                      <TestResultRow 
                        key={p.pid} 
                        test={p} 
                        result={results[p.pid]} 
                        type="contest"
                      />
                    ))}
                </tbody>
              </table>
            </div>
            ) : (
            <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <div className="text-lg font-medium text-gray-500 mb-2">No contests participated</div>
                <div className="text-gray-400">Join contests to see your results here</div>
            </div>
          )}
        </div>
        )}

        {/* Detailed Test Modal */}
        {selectedTest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl p-6 sm:p-8 w-full max-w-6xl max-h-[95vh] overflow-auto relative shadow-lg">
              <button 
                onClick={() => {
                  setSelectedTest(null);
                  setLeaderboardData(null);
                }} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedTest.type === 'contest' 
                    ? (selectedTest.test.testSeries?.title || 'Contest') 
                    : (selectedTest.test.freePractice?.title || 'Practice Test')
                  } - {selectedTest.showLeaderboard ? 'Leaderboard' : 'Detailed Results'}
                </h2>
                <p className="text-gray-600">
                  {selectedTest.test.startTime ? new Date(selectedTest.test.startTime).toLocaleDateString() : '-'}
                </p>
              </div>

              {/* Summary Stats */}
              {!selectedTest.showLeaderboard && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedTest.result?.correct ?? selectedTest.result?.correctAnswers ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedTest.result?.totalQuestions ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                    </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedTest.result?.totalQuestions > 0 
                      ? (((selectedTest.result?.correct ?? selectedTest.result?.correctAnswers ?? 0) / selectedTest.result?.totalQuestions) * 100).toFixed(1)
                      : '0'
                    }%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                    </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedTest.type === 'contest' ? 'Contest' : 'Practice'}
                  </div>
                  <div className="text-sm text-gray-600">Type</div>
                  </div>
                </div>
              )}
                
              {/* Leaderboard Display */}
              {selectedTest.showLeaderboard && (
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Contest Leaderboard</h3>
                  </div>
                  <div className="overflow-x-auto">
                    {loadingLeaderboard ? (
                      <div className="p-6 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-600" />
                        <p className="text-gray-600">Loading leaderboard...</p>
                      </div>
                    ) : leaderboardData ? (
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white border-b border-gray-200">
                            <th className="px-6 py-3 text-left font-semibold text-gray-900">Rank</th>
                            <th className="px-6 py-3 text-left font-semibold text-gray-900">Participant</th>
                            <th className="px-6 py-3 text-left font-semibold text-gray-900">Score</th>
                            <th className="px-6 py-3 text-left font-semibold text-gray-900">Percentage</th>
                            <th className="px-6 py-3 text-left font-semibold text-gray-900">Accuracy</th>
                            <th className="px-6 py-3 text-left font-semibold text-gray-900">Time (min)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboardData.leaderboard.map((entry, index) => (
                            <tr key={entry.userId} className={`border-b border-gray-100 hover:bg-gray-50 ${entry.rank === 1 ? 'bg-yellow-50' : entry.rank === 2 ? 'bg-gray-50' : entry.rank === 3 ? 'bg-orange-50' : ''}`}>
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <div className="font-medium text-gray-900">{entry.userName}</div>
                                  <div className="text-sm text-gray-500">{entry.userEmail}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {entry.correct}/{entry.totalQuestions}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`font-medium ${entry.percentage >= 90 ? 'text-green-600' : entry.percentage >= 70 ? 'text-blue-600' : entry.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {entry.percentage}%
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`font-medium ${entry.accuracy >= 90 ? 'text-green-600' : entry.accuracy >= 70 ? 'text-blue-600' : entry.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {entry.accuracy}%
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-600">
                                {entry.timeTaken}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        No leaderboard data available
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Question-by-Question Breakdown */}
              {selectedTest.result?.questionResults && selectedTest.result.questionResults.length > 0 && !selectedTest.showLeaderboard && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Question-by-Question Breakdown</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {selectedTest.result.questionResults.map((detail, index) => {
                        const userAnswer = detail.userAnswer || detail.selected;
                        const correctAnswer = detail.correctAnswer || detail.correct;
                        const options = detail.options || {};
                        const isAttempted = detail.isAttempted || userAnswer;
                        
                        return (
                          <div
                            key={index}
                            className={`p-6 border rounded-lg ${
                              detail.isCorrect 
                                ? 'border-green-200 bg-green-50' 
                                : isAttempted
                                ? 'border-red-200 bg-red-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg font-semibold text-black">
                                  Question {index + 1}
                                </span>
                                {detail.isCorrect ? (
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
                              <p className="text-lg text-gray-900 font-medium mb-4">{detail.question}</p>
                              
                              {Object.keys(options).length > 0 && (
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
                              )}
                            </div>
                            
                            <div className="text-sm space-y-2 text-gray-600">
                              {isAttempted && (
                                <p>
                                  <span className="font-medium">Your Answer:</span> {userAnswer ? `${userAnswer.toUpperCase()}. ${options[userAnswer] || userAnswer}` : 'Not answered'}
                                </p>
                              )}
                              {!detail.isCorrect && isAttempted && (
                                <p>
                                  <span className="font-medium text-green-600">Correct Answer:</span> {correctAnswer ? `${correctAnswer.toUpperCase()}. ${options[correctAnswer] || correctAnswer}` : 'Not available'}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
                
                            <button 
                onClick={() => {
                  setSelectedTest(null);
                  setLeaderboardData(null);
                }} 
                className="mt-6 w-full py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
              >
                  Close
                </button>
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Result;
