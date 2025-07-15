import React, { useState } from 'react';
import { Users, UserPlus, Activity, BarChart3, Eye, Plus, Settings } from 'lucide-react';

const AdminDashboard = ({ user, onNavigate }) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showCreateModerator, setShowCreateModerator] = useState(false);

  const stats = [
    { label: 'Total Users', value: '1,234', icon: Users },
    { label: 'Active Moderators', value: '12', icon: UserPlus },
    { label: 'Tests Conducted', value: '2,456', icon: Activity },
    { label: 'Success Rate', value: '85%', icon: BarChart3 }
  ];

  const moderators = [
    { name: 'John Doe', email: 'john@placeprep.com', status: 'Active', testsCreated: 45, lastActive: '2025-01-15' },
    { name: 'Jane Smith', email: 'jane@placeprep.com', status: 'Active', testsCreated: 32, lastActive: '2025-01-14' },
    { name: 'Mike Johnson', email: 'mike@placeprep.com', status: 'Inactive', testsCreated: 28, lastActive: '2025-01-10' }
  ];

  const userActivities = [
    { user: 'Alice Brown', action: 'Completed DSA Test', score: 85, timestamp: '2025-01-15 10:30' },
    { user: 'Bob Wilson', action: 'Started Aptitude Test', score: null, timestamp: '2025-01-15 10:15' },
    { user: 'Carol Davis', action: 'Joined Contest', score: 92, timestamp: '2025-01-15 09:45' }
  ];

  const CreateModeratorForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-sm p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create New Moderator</h3>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-sm" placeholder="Enter moderator name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-sm" placeholder="Enter email address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-sm">
              <option>Aptitude</option>
              <option>Technical</option>
              <option>DSA</option>
              <option>All</option>
            </select>
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={() => setShowCreateModerator(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-sm">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-black text-white rounded-sm">Create</button>
          </div>
        </form>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'moderators', label: 'Moderators' },
    { id: 'users', label: 'User Analytics' },
    { id: 'logs', label: 'Activity Logs' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage moderators and monitor system performance</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white p-6 border rounded-sm flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <Icon className="w-8 h-8 text-gray-400" />
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b">
          <nav className="flex space-x-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`pb-2 px-1 border-b-2 text-sm font-medium ${
                  selectedTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content (for brevity only overview shown here) */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            <div className="bg-white border rounded-sm">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Recent Activities</h2>
              </div>
              <div className="divide-y">
                {userActivities.map((activity, idx) => (
                  <div key={idx} className="p-4 flex justify-between">
                    <div>
                      <p className="font-medium">{activity.user}</p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-400">{activity.timestamp}</p>
                    </div>
                    {activity.score !== null && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {activity.score}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showCreateModerator && <CreateModeratorForm />}
      </div>
    </div>
  );
};

export default AdminDashboard;
