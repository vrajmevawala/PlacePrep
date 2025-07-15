import React, { useState } from 'react';
import { Target, BookOpen, Trophy, BarChart3, Clock, CheckCircle } from 'lucide-react';

const StudentDashboard = ({ user, onNavigate }) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  const stats = [
    { label: 'Tests Taken', value: '24', icon: Target },
    { label: 'Average Score', value: '85%', icon: BarChart3 },
    { label: 'Time Spent', value: '48h', icon: Clock },
    { label: 'Completed', value: '18', icon: CheckCircle }
  ];

  const recentTests = [
    { name: 'Aptitude Test #12', score: 85, date: '2025-01-15', type: 'Aptitude' },
    { name: 'Java Basics', score: 92, date: '2025-01-14', type: 'Technical' },
    { name: 'DSA Arrays', score: 78, date: '2025-01-13', type: 'DSA' },
    { name: 'Logical Reasoning', score: 88, date: '2025-01-12', type: 'Aptitude' }
  ];

  const upcomingContests = [
    { name: 'Weekly DSA Challenge', date: '2025-01-20', time: '10:00 AM', participants: 245 },
    { name: 'Technical Quiz', date: '2025-01-22', time: '2:00 PM', participants: 189 },
    { name: 'Aptitude Marathon', date: '2025-01-25', time: '9:00 AM', participants: 312 }
  ];

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
            const Icon = stat.icon;
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
            onClick={() => onNavigate('practice')}
            className="bg-white border border-gray-200 rounded-sm p-6 hover:bg-gray-50 transition-colors text-left"
          >
            <Target className="w-8 h-8 mb-3" />
            <h3 className="font-semibold mb-2">Start Practice</h3>
            <p className="text-sm text-gray-600">Begin with aptitude, technical, or DSA questions</p>
          </button>
          
          <button
            onClick={() => onNavigate('contests')}
            className="bg-white border border-gray-200 rounded-sm p-6 hover:bg-gray-50 transition-colors text-left"
          >
            <Trophy className="w-8 h-8 mb-3" />
            <h3 className="font-semibold mb-2">Join Contest</h3>
            <p className="text-sm text-gray-600">Compete in live coding challenges</p>
          </button>
          
          <button
            onClick={() => onNavigate('resources')}
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
