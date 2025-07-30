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
                {recentTests.map((test, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{test.name}</h3>
                        <p className="text-sm text-gray-600">{test.date}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{test.score}%</div>
                        <div className="text-sm text-gray-600">{test.type}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Contests */}
          <div>
            <div className="bg-white rounded-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Upcoming Contests</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {upcomingContests.map((contest, index) => (
                  <div key={index} className="p-6">
                    <h3 className="font-medium mb-2">{contest.name}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{contest.date} at {contest.time}</p>
                      <p>{contest.participants} participants</p>
                    </div>
                    <button className="mt-3 w-full bg-black text-white py-2 px-4 rounded-sm text-sm hover:bg-gray-800 transition-colors">
                      Register
                    </button>
                  </div>
                ))}
              </div>
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
