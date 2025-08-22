import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, BookOpen, Trophy, BarChart3, Clock, CheckCircle } from 'lucide-react';

const StudentDashboard = ({ user }) => {
  const [stats, setStats] = useState([]);
  const [recentTests, setRecentTests] = useState([]);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const navigate = useNavigate();

  // Pagination states
  const [currentTestsPage, setCurrentTestsPage] = useState(1);
  const [currentContestsPage, setCurrentContestsPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const [statsRes, testsRes, contestsRes] = await Promise.all([
          fetch('/api/free-practice/student/stats', { credentials: 'include' }),
          fetch('/api/free-practice/student/recent-tests', { credentials: 'include' }),
          fetch('/api/testseries/contests/upcoming', { credentials: 'include' }),
        ]);
        if (!statsRes.ok || !testsRes.ok || !contestsRes.ok) {
          throw new Error('Failed to load dashboard data.');
        }
        const statsData = await statsRes.json();
        const testsData = await testsRes.json();
        const contestsData = await contestsRes.json();
        setStats(statsData || []);
        setRecentTests(testsData || []);
        setUpcomingContests(contestsData || []);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Pagination helper functions
  const getCurrentPageData = (data, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  const handleTestsPageChange = (page) => {
    setCurrentTestsPage(page);
  };

  const handleContestsPageChange = (page) => {
    setCurrentContestsPage(page);
  };

  const handleRegister = async (contest) => {
    try {
      if (contest.requiresCode) {
        navigate('/join-contest');
        return;
      }

      const res = await fetch(`/api/testseries/${contest.id}/join`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to register for contest');
      }

      // If contest already started, take user directly to it; otherwise, confirm registration
      const now = new Date();
      const startTime = contest.startTime ? new Date(contest.startTime) : null;
      if (startTime && now >= startTime) {
        navigate(`/take-contest/${contest.id}`);
      } else {
        window.alert(`Registered! Contest starts at ${contest.date} ${contest.time}.`);
      }
    } catch (err) {
      window.alert(err.message || 'Registration failed');
    }
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && (
              <span className="px-2 text-gray-500">...</span>
            )}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              currentPage === page
                ? 'bg-black text-white'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-2 text-gray-500">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {user.fullName}!</h1>
          <p className="text-gray-600 mt-2">Track your progress and continue your preparation</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = {
              'Tests Taken': Target,
              'Average Score': BarChart3,
              'Time Spent': Clock,
              'Completed': CheckCircle
            }[stat.label] || Target;
            return (
              <div key={index} className="bg-white rounded-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className="w-8 h-8 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Tests */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Recent Tests</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {recentTests.length === 0 ? (
                  <div className="p-6 text-sm text-gray-600">No recent tests found.</div>
                ) : (
                  getCurrentPageData(recentTests, currentTestsPage).map((test, index) => {
                    const actualIndex = (currentTestsPage - 1) * itemsPerPage + index + 1;
                    return (
                      <div key={`${test.name}-${index}`} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">{actualIndex}</span>
                            </div>
                            <div>
                              <h3 className="font-medium">{test.name}</h3>
                              <p className="text-sm text-gray-600">{test.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">{test.score != null ? `${test.score}%` : 'N/A'}</div>
                            <div className="text-sm text-gray-600">{test.type}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Pagination for Recent Tests */}
              {getTotalPages(recentTests) > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {getCurrentPageData(recentTests, currentTestsPage).length} of {recentTests.length} tests
                      {getTotalPages(recentTests) > 1 && (
                        <span> (Page {currentTestsPage} of {getTotalPages(recentTests)})</span>
                      )}
                    </div>
                    <Pagination
                      currentPage={currentTestsPage}
                      totalPages={getTotalPages(recentTests)}
                      onPageChange={handleTestsPageChange}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Contests */}
          <div>
            <div className="bg-white rounded-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Upcoming Contests</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {upcomingContests.length === 0 ? (
                  <div className="p-6 text-sm text-gray-600">No upcoming contests.</div>
                ) : (
                  getCurrentPageData(upcomingContests, currentContestsPage).map((contest, index) => {
                    const actualIndex = (currentContestsPage - 1) * itemsPerPage + index + 1;
                    return (
                      <div key={contest.id ?? index} className="p-6">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">{actualIndex}</span>
                          </div>
                          <h3 className="font-medium">{contest.name}</h3>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1 ml-9">
                          <p className="font-medium">{contest.date} at {contest.time}</p>
                          <p className="text-blue-600">{contest.timeStatus}</p>
                          <p>{contest.participants} participants{contest.requiresCode ? ' • Code required' : ''}</p>
                        </div>
                        <button onClick={() => handleRegister(contest)} className="mt-3 w-full bg-black text-white py-2 px-4 rounded-sm text-sm hover:bg-gray-800 transition-colors">
                          {contest.requiresCode ? 'Register with Code' : 'Register'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Pagination for Upcoming Contests */}
              {getTotalPages(upcomingContests) > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {getCurrentPageData(upcomingContests, currentContestsPage).length} of {upcomingContests.length} contests
                      {getTotalPages(upcomingContests) > 1 && (
                        <span> (Page {currentContestsPage} of {getTotalPages(upcomingContests)})</span>
                      )}
                    </div>
                    <Pagination
                      currentPage={currentContestsPage}
                      totalPages={getTotalPages(upcomingContests)}
                      onPageChange={handleContestsPageChange}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/practice')}
            className="bg-white border border-gray-200 rounded-sm p-6 hover:bg-gray-50 transition-colors text-left"
          >
            <Target className="w-8 h-8 mb-3" />
            <h3 className="font-semibold mb-2">Start Practice</h3>
            <p className="text-sm text-gray-600">Begin with aptitude, technical, or DSA questions</p>
          </button>
          
          <button
            onClick={() => navigate('/contests')}
            className="bg-white border border-gray-200 rounded-sm p-6 hover:bg-gray-50 transition-colors text-left"
          >
            <Trophy className="w-8 h-8 mb-3" />
            <h3 className="font-semibold mb-2">Join Contest</h3>
            <p className="text-sm text-gray-600">Compete in live coding challenges</p>
          </button>
          
          <button
            onClick={() => navigate('/resources')}
            className="bg-white border border-gray-200 rounded-sm p-6 hover:bg-gray-50 transition-colors text-left"
          >
            <BookOpen className="w-8 h-8 mb-3" />
            <h3 className="font-semibold mb-2">Study Resources</h3>
            <p className="text-sm text-gray-600">Access curated learning materials</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
