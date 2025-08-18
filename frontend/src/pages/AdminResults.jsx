import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3,
  Users,
  Clock,
  Trophy,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  Target,
  Download,
  FileText,
  Award,
  CheckCircle,
  XCircle,
  Minus,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  BarChart,
  LineChart,
  Percent,
  Timer,
  Star,
  AlertTriangle
} from 'lucide-react';

const AdminResults = ({ user }) => {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedContest, setSelectedContest] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [contestStats, setContestStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [contestResults, setContestResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [detailedAnalysis, setDetailedAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisTab, setAnalysisTab] = useState('overview');
  const [questionAnalysis, setQuestionAnalysis] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [timeAnalysis, setTimeAnalysis] = useState({});
  const [categoryAnalysis, setCategoryAnalysis] = useState({});

  const itemsPerPage = 10;

  // Check if user is admin or moderator
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const canViewResults = isAdmin || isModerator;

  useEffect(() => {
    if (canViewResults) {
      fetchContests();
    }
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/testseries', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setContests(data.testSeries || []);
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContestStats = async (contestId) => {
    try {
      setLoadingStats(true);
      const response = await fetch(`/api/testseries/${contestId}/stats`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setContestStats(data);
      }
    } catch (error) {
      console.error('Error fetching contest stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchContestResults = async (contestId) => {
    try {
      setLoadingResults(true);
      const response = await fetch(`/api/testseries/${contestId}/participants`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setContestResults(data.participants || []);
      }
    } catch (error) {
      console.error('Error fetching contest results:', error);
    } finally {
      setLoadingResults(false);
    }
  };

  const fetchDetailedAnalysis = async (contestId) => {
    try {
      setLoadingAnalysis(true);
      const response = await fetch(`/api/testseries/${contestId}/detailed-analysis`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDetailedAnalysis(data);
        
        // Process question analysis
        if (data.questionAnalysis) {
          setQuestionAnalysis(data.questionAnalysis);
        }
        
        // Process performance metrics
        if (data.performanceMetrics) {
          setPerformanceMetrics(data.performanceMetrics);
        }
        
        // Process time analysis
        if (data.timeAnalysis) {
          setTimeAnalysis(data.timeAnalysis);
        }
        
        // Process category analysis
        if (data.categoryAnalysis) {
          setCategoryAnalysis(data.categoryAnalysis);
        }
      }
    } catch (error) {
      console.error('Error fetching detailed analysis:', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleViewStats = async (contest) => {
    setSelectedContest(contest);
    setShowStatsModal(true);
    setAnalysisTab('overview');
    await Promise.all([
      fetchContestStats(contest.id),
      fetchContestResults(contest.id),
      fetchDetailedAnalysis(contest.id)
    ]);
  };

  const downloadExcel = async (contestId, contestTitle) => {
    try {
      setDownloadingExcel(true);
      console.log('Starting Excel download for contest:', contestId, contestTitle);
      
      const response = await fetch(`/api/testseries/${contestId}/download-results`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const blob = await response.blob();
        console.log('Blob received, size:', blob.size, 'type:', blob.type);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contestTitle}_Results_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('Excel download completed successfully');
      } else {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        alert(`Failed to download results: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert(`Error downloading results: ${error.message}`);
    } finally {
      setDownloadingExcel(false);
    }
  };

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
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'live': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAnswerStatus = (userAnswer, correctAnswer) => {
    if (userAnswer === correctAnswer) return 'correct';
    if (userAnswer === null || userAnswer === undefined) return 'unanswered';
    return 'incorrect';
  };

  const getAnswerStatusIcon = (status) => {
    switch (status) {
      case 'correct': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'incorrect': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'unanswered': return <Minus className="w-4 h-4 text-gray-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const calculatePerformanceMetrics = (results) => {
    if (!results || results.length === 0) return {};
    
    const scores = results.map(r => r.score || 0);
    const totalParticipants = results.length;
    const completedParticipants = results.filter(r => r.submittedAt).length;
    
    return {
      averageScore: scores.reduce((a, b) => a + b, 0) / totalParticipants,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      medianScore: scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)],
      completionRate: (completedParticipants / totalParticipants) * 100,
      standardDeviation: Math.sqrt(scores.reduce((sq, n) => sq + Math.pow(n - (scores.reduce((a, b) => a + b, 0) / totalParticipants), 2), 0) / totalParticipants)
    };
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredContests = contests
    .filter(contest => {
      const matchesSearch = contest.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || getContestStatus(contest) === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'startTime' || sortBy === 'endTime') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const paginatedContests = filteredContests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPagesCount = Math.ceil(filteredContests.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const Pagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPagesCount, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredContests.length)} of {filteredContests.length} contests
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                currentPage === page
                  ? 'bg-black text-white'
                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPagesCount}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (!canViewResults) {
    return (
      <div className="page flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Contest Results</h1>
                <p className="text-gray-600 mt-1">View and manage contest results and statistics</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Contests</p>
                <p className="text-2xl font-bold">{contests.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold">{contests.filter(c => getContestStatus(c) === 'completed').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Live</p>
                <p className="text-2xl font-bold">{contests.filter(c => getContestStatus(c) === 'live').length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-2xl font-bold">{contests.filter(c => getContestStatus(c) === 'upcoming').length}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search contests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="startTime">Start Time</option>
              <option value="endTime">End Time</option>
              <option value="title">Title</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>
        </div>

        {/* Contests List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-black">All Contests</h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading contests...</p>
            </div>
          ) : paginatedContests.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-800 mb-2">No contests found</p>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedContests.map((contest) => {
                    const status = getContestStatus(contest);
                    const duration = Math.round((new Date(contest.endTime) - new Date(contest.startTime)) / (1000 * 60));
                    
                    return (
                      <tr key={contest.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{contest.title}</div>
                            <div className="text-sm text-gray-500">{contest.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{duration} min</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{contest.participantsCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewStats(contest)}
                            className="text-black hover:text-gray-700 flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Stats</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && paginatedContests.length > 0 && <Pagination />}
        </div>
      </div>

      {/* Stats Modal */}
      {showStatsModal && selectedContest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-black">Contest Statistics</h3>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-2">{selectedContest.title}</p>
            </div>
            
            <div className="p-6">
              {/* Download Button */}
              <div className="mb-6">
                <button
                  onClick={() => downloadExcel(selectedContest.id, selectedContest.title)}
                  disabled={downloadingExcel}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {downloadingExcel ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Excel Report</span>
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Download complete results with user scores, answers, and rankings
                </p>
              </div>

              {/* Analysis Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'performance', label: 'Performance', icon: TrendingUp },
                    { id: 'questions', label: 'Question Analysis', icon: PieChart },
                    { id: 'time', label: 'Time Analysis', icon: Timer },
                    { id: 'categories', label: 'Categories', icon: Activity },
                    { id: 'results', label: 'Results', icon: FileText }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setAnalysisTab(tab.id)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          analysisTab === tab.id
                            ? 'border-black text-black'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              {loadingStats || loadingAnalysis ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading analysis...</p>
                </div>
              ) : (
                <>
                  {/* Overview Tab */}
                  {analysisTab === 'overview' && contestStats && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-600">Total Participants</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mt-2">{contestStats.totalParticipants || 0}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Trophy className="w-5 h-5 text-yellow-600" />
                            <span className="text-sm font-medium text-gray-600">Average Score</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mt-2">{contestStats.averageScore?.toFixed(2) || '0.00'}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Target className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-600">Highest Score</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mt-2">{contestStats.highestScore || 0}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mt-2">{contestStats.completionRate?.toFixed(1) || '0'}%</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-gray-600">Average Time</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mt-2">{contestStats.averageTime || 0} min</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                            <span className="text-sm font-medium text-gray-600">Questions</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mt-2">{contestStats.totalQuestions || 0}</p>
                        </div>
                      </div>

                      {/* Performance Distribution */}
                      {contestResults.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[
                              { label: 'Excellent (80-100%)', range: [80, 100], color: 'bg-green-500' },
                              { label: 'Good (60-79%)', range: [60, 79], color: 'bg-blue-500' },
                              { label: 'Average (40-59%)', range: [40, 59], color: 'bg-yellow-500' },
                              { label: 'Poor (0-39%)', range: [0, 39], color: 'bg-red-500' }
                            ].map((category) => {
                              const count = contestResults.filter(result => {
                                const percentage = result.percentage || 0;
                                return percentage >= category.range[0] && percentage <= category.range[1];
                              }).length;
                              const percentage = contestResults.length > 0 ? (count / contestResults.length * 100).toFixed(1) : 0;
                              
                              return (
                                <div key={category.label} className="text-center">
                                  <div className={`w-16 h-16 rounded-full ${category.color} mx-auto mb-2 flex items-center justify-center text-white font-bold`}>
                                    {count}
                                  </div>
                                  <p className="text-sm font-medium text-gray-900">{category.label}</p>
                                  <p className="text-sm text-gray-500">{percentage}%</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Performance Tab */}
                  {analysisTab === 'performance' && (
                    <div className="space-y-6">
                      {contestResults.length > 0 ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Object.entries(calculatePerformanceMetrics(contestResults)).map(([key, value]) => (
                              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <TrendingUp className="w-5 h-5 text-blue-600" />
                                  <span className="text-sm font-medium text-gray-600">
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                  </span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 mt-2">
                                  {typeof value === 'number' ? value.toFixed(2) : value}
                                  {key === 'completionRate' && '%'}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Score Distribution Chart */}
                          <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h4>
                            <div className="space-y-3">
                              {contestResults
                                .sort((a, b) => (b.score || 0) - (a.score || 0))
                                .slice(0, 10)
                                .map((result, index) => {
                                  const percentage = result.percentage || 0;
                                  return (
                                    <div key={result.id} className="flex items-center space-x-4">
                                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                                        {index + 1}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                          <span className="font-medium">{result.name || 'Unknown'}</span>
                                          <span className={getPerformanceColor(percentage)}>{percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-blue-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${percentage}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600">No performance data available.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question Analysis Tab */}
                  {analysisTab === 'questions' && (
                    <div className="space-y-6">
                      {questionAnalysis.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-900">Question Performance Analysis</h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {questionAnalysis.map((question, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-medium text-gray-900">Q{index + 1}</div>
                                      <div className="text-sm text-gray-500 truncate max-w-xs">{question.question}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty)}`}>
                                        {question.difficulty}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full ${question.successRate >= 80 ? 'bg-green-500' : question.successRate >= 60 ? 'bg-blue-500' : question.successRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${question.successRate}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-sm text-gray-900">{question.successRate.toFixed(1)}%</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {question.category}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        question.successRate >= 80 ? 'bg-green-100 text-green-800' : 
                                        question.successRate >= 60 ? 'bg-blue-100 text-blue-800' : 
                                        question.successRate >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {question.successRate >= 80 ? 'Easy' : 
                                         question.successRate >= 60 ? 'Moderate' : 
                                         question.successRate >= 40 ? 'Challenging' : 'Difficult'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600">No question analysis data available.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time Analysis Tab */}
                  {analysisTab === 'time' && (
                    <div className="space-y-6">
                      {timeAnalysis && Object.keys(timeAnalysis).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Time Distribution</h4>
                            <div className="space-y-4">
                              {Object.entries(timeAnalysis).map(([range, count]) => (
                                <div key={range} className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">{range}</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${(count / contestResults.length) * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{count}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Time vs Performance</h4>
                            <div className="space-y-4">
                              {contestResults
                                .filter(result => result.timeTaken)
                                .sort((a, b) => (a.timeTaken || 0) - (b.timeTaken || 0))
                                .slice(0, 5)
                                .map((result, index) => {
                                  const percentage = result.percentage || 0;
                                  return (
                                    <div key={result.id} className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{result.name || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500">{Math.round((result.timeTaken || 0) / 60)} min</p>
                                      </div>
                                      <span className={`text-sm font-medium ${getPerformanceColor(percentage)}`}>
                                        {percentage.toFixed(1)}%
                                      </span>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Timer className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600">No time analysis data available.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Categories Tab */}
                  {analysisTab === 'categories' && (
                    <div className="space-y-6">
                      {categoryAnalysis && Object.keys(categoryAnalysis).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries(categoryAnalysis).map(([category, data]) => (
                            <div key={category} className="bg-white border border-gray-200 rounded-lg p-6">
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">{category}</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Average Score:</span>
                                  <span className="text-sm font-medium text-gray-900">{data.averageScore?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Success Rate:</span>
                                  <span className="text-sm font-medium text-gray-900">{data.successRate?.toFixed(1) || '0'}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Questions:</span>
                                  <span className="text-sm font-medium text-gray-900">{data.questionCount || 0}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${data.successRate >= 80 ? 'bg-green-500' : data.successRate >= 60 ? 'bg-blue-500' : data.successRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${data.successRate || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600">No category analysis data available.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Results Tab */}
                  {analysisTab === 'results' && (
                    <div className="space-y-6">
                      {loadingResults ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                          <p className="mt-4 text-gray-600">Loading results...</p>
                        </div>
                      ) : contestResults.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-900">Contest Results</h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rank
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Participant
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Score
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Time Taken
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Completed
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {contestResults.map((result, index) => (
                                  <tr key={result.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        {index === 0 && <Trophy className="w-4 h-4 text-yellow-500 mr-2" />}
                                        {index === 1 && <Award className="w-4 h-4 text-gray-400 mr-2" />}
                                        {index === 2 && <Award className="w-4 h-4 text-orange-400 mr-2" />}
                                        <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{result.name || 'Unknown'}</div>
                                        <div className="text-sm text-gray-500">{result.email || 'No email'}</div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{result.score || 0}</div>
                                      <div className="text-sm text-gray-500">
                                        {contestStats?.totalQuestions ? `${((result.score || 0) / contestStats.totalQuestions * 100).toFixed(1)}%` : '0%'}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {result.timeTaken ? `${Math.round(result.timeTaken / 60)} min` : 'N/A'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        result.submittedAt ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {result.submittedAt ? 'Yes' : 'No'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                      <button
                                        onClick={() => {/* TODO: View detailed answers */}}
                                        className="text-black hover:text-gray-700 flex items-center space-x-1"
                                      >
                                        <FileText className="w-4 h-4" />
                                        <span>View Answers</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600">No results available for this contest.</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResults; 