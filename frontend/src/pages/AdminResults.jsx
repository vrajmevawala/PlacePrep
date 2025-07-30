import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3
} from 'lucide-react';

const AdminResults = ({ user }) => {
  const navigate = useNavigate();

  // Check if user is admin or moderator
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const canViewResults = isAdmin || isModerator;

  if (!canViewResults) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Access Denied</p>
          <p className="text-gray-600 mt-2">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-black flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-black">Contest Results Management</h1>
                <p className="text-gray-600 mt-2">View and analyze contest performance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Information Message */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-black">View Individual Contest Results</h2>
          </div>
          
          <div className="p-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-medium text-gray-800 mb-4">Contest Results Available</p>
            <p className="text-gray-600 mb-6">
              To view contest results and statistics, please use the Contest Management page. 
              Click the "Stats" button for each contest to see detailed results and performance analytics.
            </p>
            <button
              onClick={() => navigate('/admin-contests')}
              className="px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Go to Contest Management
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminResults; 