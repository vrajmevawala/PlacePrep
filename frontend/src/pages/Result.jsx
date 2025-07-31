import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Loader2, BarChart3, Trophy, Target, Clock, TrendingUp, Award, Users, Calendar, Filter } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts';

// This page is for regular users to view their own contest and practice results
// It only shows results for the currently logged-in user

const CATEGORY_MAP = {
  Aptitude: ['Aptitude'],
  Technical: ['Technical'],
  DSA: ['DSA', 'Data Structures', 'Algorithms'],
};

const Result = () => {
  const [participations, setParticipations] = useState([]);
  const [results, setResults] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [typeFilter, setTypeFilter] = useState('testSeries'); // 'testSeries' (Contest) by default
  const [categoryFilter, setCategoryFilter] = useState('all');
  const chartRef = useRef({});

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/testseries/participations', { credentials: 'include' }).then(res => res.json()),
      fetch('/api/free-practice/participations', { credentials: 'include' }).then(res => res.json())
    ])
      .then(async ([testSeriesData, freePracticeData]) => {
        const testSeriesParticipations = (testSeriesData.participations || []).map(p => ({ ...p, _type: 'testSeries' }));
        const freePracticeParticipations = (freePracticeData.participations || []).map(p => ({ ...p, _type: 'freePractice' }));
        const allParticipations = [...testSeriesParticipations, ...freePracticeParticipations].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        setParticipations(allParticipations);

        const resultsObj = {};
        const statsObj = {};

        for (const p of allParticipations) {
          try {
            if (p._type === 'testSeries') {
              const res = await fetch(`/api/testseries/${p.testSeriesId}/result?pid=${p.pid}`, { credentials: 'include' });
              
              if (res.status === 403) {
                // Contest hasn't ended yet
                resultsObj[p.pid] = { error: 'Results not available yet', contestNotEnded: true };
              } else if (res.ok) {
                resultsObj[p.pid] = await res.json();
              } else {
                resultsObj[p.pid] = { error: 'No result' };
              }

              if (!statsObj[p.testSeriesId]) {
                const statRes = await fetch(`/api/testseries/${p.testSeriesId}/stats`, { credentials: 'include' });
                statsObj[p.testSeriesId] = statRes.ok ? await statRes.json() : { error: 'No stats' };
              }
            } else {
              const res = await fetch(`/api/free-practice/result?pid=${p.pid}`, { credentials: 'include' });
              resultsObj[p.pid] = res.ok ? await res.json() : { error: 'No result' };
              statsObj[p.freePracticeId] = { totalQuestions: resultsObj[p.pid]?.totalQuestions ?? '-', scores: [], average: 0 };
            }
          } catch {
            resultsObj[p.pid] = { error: 'No result' };
          }
        }

        setResults(resultsObj);
        setStats(statsObj);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load participations.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (showDetails) {
      const p = participations.find(x => x.pid === showDetails);
      const stat = stats[p._type === 'testSeries' ? p.testSeriesId : p.freePracticeId];
      const result = results[showDetails];
      if (!stat || !result || result.error || stat.error) return;

      const canvas = document.getElementById(`scoreChart-${showDetails}`);
      if (!canvas) return;

      if (chartRef.current[showDetails]) chartRef.current[showDetails].destroy();

      const userScore = result.correct;
      const scores = stat.scores || [];

      const data = {
        labels: scores.map((_, i) => `User ${i + 1}`),
        datasets: [{
          label: 'Scores',
          data: scores,
          backgroundColor: scores.map(s => s === userScore ? 'rgba(59, 130, 246, 0.8)' : 'rgba(156, 163, 175, 0.4)'),
          borderColor: scores.map(s => s === userScore ? 'rgba(59, 130, 246, 1)' : 'rgba(156, 163, 175, 0.8)'),
          borderWidth: 2
        }]
      };

      chartRef.current[showDetails] = new Chart(canvas, {
        type: 'bar',
        data,
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#374151' }, grid: { color: '#e5e7eb' } },
            y: { beginAtZero: true, ticks: { color: '#374151' }, grid: { color: '#e5e7eb' } }
          }
        }
      });
    }

    return () => {
      if (showDetails && chartRef.current[showDetails]) {
        chartRef.current[showDetails].destroy();
        chartRef.current[showDetails] = null;
      }
    };
  }, [showDetails, stats, results, participations]);

  // Filtering logic
  const filteredParticipations = participations.filter(p => {
    if (typeFilter === 'testSeries' && p._type !== 'testSeries') return false;
    if (typeFilter === 'freePractice' && p._type !== 'freePractice') return false;
    if (categoryFilter === 'all') return true;
    // For testSeries, check contest category; for freePractice, check freePractice category
    const title = p._type === 'testSeries' ? (p.testSeries?.title || '') : (p.freePractice?.title || '');
    if (categoryFilter === 'Aptitude') return /aptitude/i.test(title);
    if (categoryFilter === 'Technical') return /technical/i.test(title);
    if (categoryFilter === 'DSA') return /dsa|data structures|algorithms/i.test(title);
    return true;
  });

  // Calculate performance metrics (excluding contests that haven't ended)
  const completedParticipations = filteredParticipations.filter(p => {
    const result = results[p.pid];
    return !result || !result.contestNotEnded;
  });

  const performanceMetrics = {
    totalAttempts: filteredParticipations.length,
    completedAttempts: completedParticipations.length,
    averageScore: completedParticipations.length > 0 
      ? (completedParticipations.reduce((sum, p) => sum + (results[p.pid]?.correct || 0), 0) / completedParticipations.length).toFixed(1)
      : '0',
    bestScore: completedParticipations.length > 0 
      ? Math.max(...completedParticipations.map(p => results[p.pid]?.correct || 0))
      : '0',
    averagePercentage: completedParticipations.length > 0 
      ? (completedParticipations.reduce((sum, p) => {
          const result = results[p.pid];
          const stat = stats[p._type === 'testSeries' ? p.testSeriesId : p.freePracticeId];
          if (result && !result.error && stat?.totalQuestions && stat.totalQuestions !== '-') {
            return sum + ((result.correct / stat.totalQuestions) * 100);
          }
          return sum;
        }, 0) / completedParticipations.length).toFixed(1)
      : '0'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gray-700 flex items-center justify-center rounded-lg shadow-sm">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
              <p className="text-gray-600 mt-2">Track your progress and analyze your performance across all assessments</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white border border-gray-200 p-8 mb-8 rounded-xl shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-800">Filters & Analysis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type</label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors rounded-lg bg-white"
              >
                <option value="testSeries">Contest</option>
                <option value="freePractice">Free Practice</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors rounded-lg bg-white"
              >
                <option value="all">All Categories</option>
                <option value="Aptitude">Aptitude</option>
                <option value="Technical">Technical</option>
                <option value="DSA">DSA</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{filteredParticipations.length}</span>
                  <span className="text-sm text-gray-500">assessments found</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        {filteredParticipations.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Performance Overview</h2>
              </div>
            </div>
            
            {/* Statistics Cards */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{performanceMetrics.totalAttempts}</div>
                  <div className="text-sm text-gray-600 font-medium">Total Attempts</div>
                  {performanceMetrics.totalAttempts !== performanceMetrics.completedAttempts && (
                    <div className="text-xs text-orange-600 mt-1">
                      {performanceMetrics.completedAttempts} completed
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{performanceMetrics.averageScore}</div>
                  <div className="text-sm text-gray-600 font-medium">Average Score</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{performanceMetrics.bestScore}</div>
                  <div className="text-sm text-gray-600 font-medium">Best Score</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{performanceMetrics.averagePercentage}%</div>
                  <div className="text-sm text-gray-600 font-medium">Avg Percentage</div>
                </div>
              </div>
            </div>

            {/* Score Progression Chart */}
            <div className="mt-6 p-6 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-gray-600" />
                Score Progression
              </h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={completedParticipations.map((p, i) => ({
                    date: p.startTime ? new Date(p.startTime).toLocaleDateString() : `Attempt ${i + 1}`,
                    score: results[p.pid]?.correct ?? 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#374151', fontSize: 12 }}
                      axisLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis 
                      allowDecimals={false} 
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
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#6b7280" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#6b7280', stroke: 'white', strokeWidth: 2 }} 
                      activeDot={{ r: 6, fill: '#6b7280', stroke: 'white', strokeWidth: 2 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Assessment Results</h2>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading your results...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-red-600 font-medium">{error}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-4 px-6 text-left font-semibold text-gray-900 text-sm uppercase tracking-wider">Assessment</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-900 text-sm uppercase tracking-wider">Attempt Time</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-900 text-sm uppercase tracking-wider">Score</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-900 text-sm uppercase tracking-wider">Percentage</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-900 text-sm uppercase tracking-wider">Percentile</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-900 text-sm uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredParticipations.map((p, idx) => {
                    const result = results[p.pid];
                    const stat = stats[p._type === 'testSeries' ? p.testSeriesId : p.freePracticeId];
                    let percent = '-';
                    let percentile = '-';

                    if (result && !result.error && stat && !stat.error && stat.scores?.length > 0 && p._type === 'testSeries') {
                      percent = ((result.correct / stat.totalQuestions) * 100).toFixed(1);
                      const userScore = result.correct;
                      const scores = stat.scores;
                      percentile = ((scores.filter(s => s < userScore).length / scores.length) * 100).toFixed(1);
                    } else if (result && !result.error && stat?.totalQuestions && stat.totalQuestions !== '-') {
                      percent = ((result.correct / stat.totalQuestions) * 100).toFixed(1);
                    }

                    return (
                      <tr key={p.pid} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">
                            {p._type === 'testSeries' ? (p.testSeries?.title || '-') : (p.freePractice?.title || '-')}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            {p._type === 'testSeries' ? (
                              <Trophy className="w-3 h-3 mr-1 text-gray-400" />
                            ) : (
                              <Target className="w-3 h-3 mr-1 text-gray-400" />
                            )}
                            {p._type === 'testSeries' ? 'Contest' : 'Free Practice'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">
                            {p.startTime ? new Date(p.startTime).toLocaleDateString() : '-'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {p.startTime ? new Date(p.startTime).toLocaleTimeString() : '-'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {result && result.contestNotEnded ? (
                            <span className="text-sm text-orange-600 font-medium">Coming Soon</span>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900">{result?.correct ?? '-'}</span>
                              <span className="text-gray-400">/</span>
                              <span className="text-gray-600">{stat?.totalQuestions ?? '-'}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {result && result.contestNotEnded ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                              Coming Soon
                            </span>
                          ) : percent !== '-' ? (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              parseFloat(percent) >= 80 ? 'bg-green-100 text-green-800' :
                              parseFloat(percent) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              parseFloat(percent) >= 40 ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {percent}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {result && result.contestNotEnded ? (
                            <span className="text-sm text-orange-600 font-medium">Coming Soon</span>
                          ) : percentile !== '-' && p._type === 'testSeries' ? (
                            <span className="text-sm font-medium text-gray-900">{percentile}%</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {result && !result.error ? (
                            <button 
                              onClick={() => setShowDetails(p.pid)} 
                              className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 shadow-sm"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </button>
                          ) : result && result.contestNotEnded ? (
                            <span className="text-sm text-orange-600 font-medium">Results Coming Soon</span>
                          ) : (
                            <span className="text-sm text-gray-400">No result</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {filteredParticipations.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <div className="text-lg font-medium text-gray-500 mb-2">No results found</div>
              <div className="text-gray-400">Try adjusting your filters to see more results</div>
            </div>
          )}
        </div>

        {/* Detailed Result Modal */}
        {showDetails && results[showDetails] && (() => {
          const p = participations.find(x => x.pid === showDetails);
          const stat = p && stats[p._type === 'testSeries' ? p.testSeriesId : p.freePracticeId];
          const result = results[showDetails];
          if (!p || !stat || !result || result.error || stat.error) return null;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-xl p-6 sm:p-8 w-full max-w-6xl max-h-[95vh] overflow-auto relative shadow-lg">
                <button onClick={() => setShowDetails(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">{p._type === 'testSeries' ? p.testSeries?.title : p.freePractice?.title} - Details</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div className="border border-gray-200 rounded-lg p-4 font-medium text-gray-900">Score: <span className="font-bold">{result.correct} / {stat.totalQuestions}</span></div>
                  <div className="border border-gray-200 rounded-lg p-4 font-medium text-gray-900">Percentage: <span className="font-bold">{((result.correct / stat.totalQuestions) * 100).toFixed(1)}%</span></div>
                  {p._type === 'testSeries' && <div className="border border-gray-200 rounded-lg p-4 font-medium text-gray-900">Average: <span className="font-bold">{stat.average.toFixed(2)}</span></div>}
                  {p._type === 'testSeries' && <div className="border border-gray-200 rounded-lg p-4 font-medium text-gray-900">Percentile: <span className="font-bold">{((stat.scores.filter(s => s < result.correct).length / stat.scores.length) * 100).toFixed(1)}</span></div>}
                  <div className="border border-gray-200 rounded-lg p-4 font-medium text-gray-900">Correct: <span className="text-green-600 font-bold">{result.correct}</span></div>
                  <div className="border border-gray-200 rounded-lg p-4 font-medium text-gray-900">Wrong: <span className="text-red-600 font-bold">{result.attempted - result.correct}</span></div>
                </div>
                {Array.isArray(stat.scores) && stat.scores.length > 1 && (
                  <div className="mb-6 bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
                    <canvas id={`scoreChart-${showDetails}`} height="200"></canvas>
                  </div>
                )}
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-900 font-semibold">
                      <tr>
                        <th className="p-3">QID</th>
                        <th className="p-3">Selected</th>
                        <th className="p-3">Correct</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.details?.map((d, i) => (
                        <tr key={i} className="border-t border-gray-100 text-gray-900">
                          <td className="p-3">{d.questionId}</td>
                          <td className="p-3">{d.selected ?? '-'}</td>
                          <td className="p-3">{d.correct ?? '-'}</td>
                          <td className="p-3">
                            {d.selected == null ? <span className="text-gray-500">Not Attempted</span> :
                              d.isCorrect ? <span className="text-green-700 font-semibold">Correct</span> :
                                <span className="text-red-600 font-semibold">Wrong</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={() => setShowDetails(null)} className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-lg font-semibold transition-colors">
                  Close
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Result;
