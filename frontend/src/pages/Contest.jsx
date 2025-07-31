import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trophy, Clock, Users, Calendar, Play, CheckCircle, AlertCircle } from 'lucide-react';

const Contest = ({ user }) => {
  const [contests, setContests] = useState([]);
  const [userParticipations, setUserParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joiningContest, setJoiningContest] = useState(null);
  const [contestSort, setContestSort] = useState({ field: 'startTime', order: 'desc' });
  const [contestStatus, setContestStatus] = useState('all'); // all, completed, upcoming, live
  const [contestCodeFilter, setContestCodeFilter] = useState('all'); // all, with, without
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setJoiningContest(null);
      try {
        // Fetch contests
        const contestsRes = await fetch('/api/testseries', { credentials: 'include' });
        const contestsData = await contestsRes.json();
        
        // Fetch user participations if user is logged in
        let participations = [];
        if (user) {
          try {
            const participationsRes = await fetch('/api/testseries/participations', { credentials: 'include' });
            const participationsData = await participationsRes.json();
            if (participationsRes.ok && participationsData.participations) {
              participations = participationsData.participations;
            }
          } catch (participationError) {
            console.log('Failed to fetch participations:', participationError);
          }
        }
        
        if (contestsRes.ok && contestsData.testSeries) {
          setContests(contestsData.testSeries);
          setUserParticipations(participations);
        } else {
          setError(contestsData.message || 'Failed to fetch contests.');
        }
      } catch {
        setError('Failed to fetch contests.');
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Clear errors when filters change
  useEffect(() => {
    setError(null);
  }, [contestSort, contestStatus, contestCodeFilter]);

  const now = new Date().getTime();
  const getContestStatus = (contest) => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'live';
    return 'completed';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'live':
        return <Play className="w-4 h-4" />;
      case 'upcoming':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const isContestCompletedMoreThanOneDay = (contest) => {
    const now = new Date();
    const end = new Date(contest.endTime);
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return now.getTime() - end.getTime() > oneDayInMs;
  };

  const canCreateContest = user && (user.role === 'admin' || user.role === 'moderator');
  
  // Helper function to check if user has already participated in a contest
  const hasUserParticipated = (contestId) => {
    if (!user || !userParticipations.length) return false;
    return userParticipations.some(participation => 
      participation.testSeriesId === contestId && participation.submittedAt
    );
  };
  const filteredContests = contests
    .filter(c => {
      // Hide contests completed more than 1 day ago
      if (getContestStatus(c) === 'completed' && isContestCompletedMoreThanOneDay(c)) {
        return false;
      }
      if (contestStatus !== 'all' && getContestStatus(c) !== contestStatus) return false;
      if (contestCodeFilter === 'with' && !c.requiresCode) return false;
      if (contestCodeFilter === 'without' && c.requiresCode) return false;
      return true;
    })
    .sort((a, b) => {
      const field = contestSort.field;
      const order = contestSort.order === 'asc' ? 1 : -1;
      return (new Date(a[field]) - new Date(b[field])) * order;
    });

  const handleJoinContest = async (contest) => {
    try {
      // Check if user has already participated in this contest
      if (hasUserParticipated(contest.id)) {
        // If already participated, navigate to results
        navigate(`/contest-results/${contest.id}`);
        return;
      }
      
      if (contest.requiresCode) {
        // If contest requires code, navigate to join contest page
        navigate('/join-contest');
      } else {
      // If no code required, join directly
      setJoiningContest(contest.id);
      try {
        const response = await fetch(`/api/testseries/${contest.id}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Navigate to take contest page
          navigate(`/take-contest/${data.contest.id}`);
        } else {
          console.error('Failed to join contest:', data.message);
          // Use a more user-friendly error handling instead of alert
          setError(data.message || 'Failed to join contest');
        }
      } catch (error) {
        console.error('Network error:', error);
        setError('Network error. Please try again.');
      } finally {
        setJoiningContest(null);
      }
    }
  } catch (error) {
    console.error('Error in handleJoinContest:', error);
    setError('An unexpected error occurred. Please try again.');
    setJoiningContest(null);
  }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-black flex items-center justify-center rounded-xl shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-black">Contests</h1>
                <p className="text-gray-600 mt-2">Join live competitions and test your skills</p>
              </div>
            </div>
            {canCreateContest && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate('/create-contest');
                }}
                className="flex items-center space-x-3 px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Contest</span>
              </button>
            )}
          </div>
        </div>
        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
            <p className="text-gray-600">Loading contests...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Filters */}
            <div className="bg-white border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-3 text-black" />
                Filters & Sorting
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Sort by</label>
                  <select 
                    value={contestSort.field} 
                    onChange={(e) => {
                      e.preventDefault();
                      setContestSort(s => ({ ...s, field: e.target.value }));
                    }} 
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  >
                    <option value="startTime">Start Time</option>
                    <option value="endTime">End Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Order</label>
                  <select 
                    value={contestSort.order} 
                    onChange={(e) => {
                      e.preventDefault();
                      setContestSort(s => ({ ...s, order: e.target.value }));
                    }} 
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Status</label>
                  <select 
                    value={contestStatus} 
                    onChange={(e) => {
                      e.preventDefault();
                      setContestStatus(e.target.value);
                    }} 
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  >
                    <option value="all">All Contests</option>
                    <option value="live">Live Now</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Code Required</label>
                  <select 
                    value={contestCodeFilter} 
                    onChange={(e) => {
                      e.preventDefault();
                      setContestCodeFilter(e.target.value);
                    }} 
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  >
                    <option value="all">All Contests</option>
                    <option value="with">Requires Code</option>
                    <option value="without">No Code Required</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300">
                    <span className="text-sm font-semibold text-black">{filteredContests.length}</span>
                    <span className="text-gray-600 ml-1">contests found</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Contests List */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-black flex items-center">
                  <Trophy className="w-5 h-5 mr-3 text-black" />
                  Available Contests
                </h2>
              </div>
              
              {filteredContests.length === 0 ? (
                <div className="p-12 text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500 mb-2">No contests found</p>
                  <p className="text-gray-400">Try adjusting your filters to see more contests</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="py-4 px-6 text-left font-semibold text-black">Contest Name</th>
                        <th className="py-4 px-6 text-left font-semibold text-black">Start Time</th>
                        <th className="py-4 px-6 text-left font-semibold text-black">End Time</th>
                        {!user && <th className="py-4 px-6 text-left font-semibold text-black">Code</th>}
                        <th className="py-4 px-6 text-left font-semibold text-black">Status</th>
                        <th className="py-4 px-6 text-left font-semibold text-black">Created By</th>
                        <th className="py-4 px-6 text-left font-semibold text-black">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContests.map(contest => {
                        const status = getContestStatus(contest);
                        return (
                          <tr key={contest.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-semibold text-black">{contest.title}</p>
                                <p className="text-sm text-gray-600">{contest.numberOfQuestions} questions</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">{new Date(contest.startTime).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-gray-500">{new Date(contest.startTime).toLocaleTimeString()}</p>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">{new Date(contest.endTime).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-gray-500">{new Date(contest.endTime).toLocaleTimeString()}</p>
                            </td>
                            {!user && (
                              <td className="py-4 px-6">
                                {contest.requiresCode ? (
                                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 border border-gray-200">
                                    {contest.contestCode}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            )}
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center space-x-1 px-3 py-1 text-sm font-medium border ${getStatusColor(status)}`}>
                                {getStatusIcon(status)}
                                <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">{contest.creator?.fullName || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              {hasUserParticipated(contest.id) ? (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(`/contest-results/${contest.id}`);
                                  }}
                                  className="px-4 py-2 text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                                >
                                  View Results
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleJoinContest(contest);
                                  }}
                                  disabled={joiningContest === contest.id}
                                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                                    joiningContest === contest.id
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : status === 'live'
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : status === 'upcoming'
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'bg-gray-600 text-white hover:bg-gray-700'
                                  }`}
                                >
                                  {joiningContest === contest.id ? (
                                    'Joining...'
                                  ) : contest.requiresCode ? (
                                    'Join with Code'
                                  ) : (
                                    'Join Contest'
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Contest; 