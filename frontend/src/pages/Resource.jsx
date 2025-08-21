import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  FileText, 
  Video, 
  MessageCircle, 
  Search, 
  Filter, 
  Download, 
  Play, 
  Bookmark, 
  BookmarkCheck,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Clock,
  Plus,
  Eye,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Resource = ({ user }) => {
  // State for different resource types
  const [activeTab, setActiveTab] = useState('mcqs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // MCQ data from database
  const [mcqs, setMcqs] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // MCQ specific filters
  const [mcqSubcategory, setMcqSubcategory] = useState('all');
  const [mcqLevel, setMcqLevel] = useState('all');
  
  // MCQ practice state
  const [answers, setAnswers] = useState([]);
  const [showExplanation, setShowExplanation] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  
  // Resources state
  const [pdfs, setPdfs] = useState([]);
  const [videos, setVideos] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [bookmarkedResources, setBookmarkedResources] = useState([]);
  
  // Add resource modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [resourceType, setResourceType] = useState('pdf');
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    category: 'Aptitude',
    subcategory: '',
    level: 'easy',
    videoUrl: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [selectedMCQIds, setSelectedMCQIds] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  

  const navigate = useNavigate();
  const canAddResource = user && (user.role === 'admin' || user.role === 'moderator');



  // Fetch resources from backend
  useEffect(() => {
    const fetchResources = async () => {
      setResourcesLoading(true);
      try {
        // Fetch PDFs
        const pdfResponse = await fetch('/api/resources?type=PDF', { credentials: 'include' });
        const pdfData = await pdfResponse.json();
        setPdfs(pdfData);

        // Fetch Videos
        const videoResponse = await fetch('/api/resources?type=VIDEO', { credentials: 'include' });
        const videoData = await videoResponse.json();
        setVideos(videoData);

        // Fetch bookmarked resources
        const bookmarkResponse = await fetch('/api/resources/bookmarks', { credentials: 'include' });
        const bookmarkData = await bookmarkResponse.json();
        setBookmarkedResources(bookmarkData.bookmarks || []);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setResourcesLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (selectedCategory === 'all') {
        setSubcategories([]);
        setMcqSubcategory('all');
        return;
      }
      
      try {
        const res = await fetch(`/api/questions/subcategories?category=${selectedCategory}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data.subcategories && data.subcategories.length) {
          setSubcategories(data.subcategories);
          setMcqSubcategory('all');
        } else {
          setSubcategories([]);
          setMcqSubcategory('all');
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        setSubcategories([]);
        setMcqSubcategory('all');
      }
    };
    
    fetchSubcategories();
  }, [selectedCategory]);

  // Initialize answers and explanations when questions change
  useEffect(() => {
    setAnswers(Array(mcqs.length).fill(null));
    setShowExplanation(Array(mcqs.length).fill(false));
  }, [mcqs]);

  // Fetch bookmarks for the user
  useEffect(() => {
    fetch('/api/questions/bookmarks', { credentials: 'include' })
      .then(res => res.ok ? res.json() : { bookmarks: [] })
      .then(data => setBookmarkedIds((data.bookmarks || []).map(bm => bm.questionId)));
  }, []);

  // Fetch MCQs based on category only
  useEffect(() => {
    const fetchMCQs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Don't fetch if category is 'all' - wait for user to select a category
        if (selectedCategory === 'all') {
          setMcqs([]);
          setLoading(false);
          return;
        }
        
        const res = await fetch(`/api/questions/practice?category=${encodeURIComponent(selectedCategory)}`, {
          credentials: 'include'
        });
        
        const data = await res.json();
        if (res.ok && data.questions) {
          // Store all questions, filtering will be done in UI
          setMcqs(data.questions);
        } else {
          setError(data.message || 'Failed to fetch MCQs');
          setMcqs([]);
        }
      } catch (error) {
        console.error('Error fetching MCQs:', error);
        setError('Failed to fetch MCQs');
        setMcqs([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMCQs();
  }, [selectedCategory]);

  // Filter MCQs based on subcategory and level
  const getFilteredMCQs = () => {
    return mcqs.filter(question => {
      const matchesSubcategory = mcqSubcategory === 'all' || question.subcategory === mcqSubcategory;
      const matchesLevel = mcqLevel === 'all' || question.level === mcqLevel;
      const matchesSearch = searchQuery === '' || 
        question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.subcategory.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSubcategory && matchesLevel && matchesSearch;
    });
  };

  // Get filtered MCQs based on current filters
  const filteredMCQs = getFilteredMCQs();
  
  // Pagination functions
  const getFilteredResources = () => {
    const filteredPdfs = pdfs.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    
    const filteredVideos = videos.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    
    return { filteredPdfs, filteredVideos };
  };
  
  const { filteredPdfs, filteredVideos } = getFilteredResources();
  const allPdfsSelected = filteredPdfs.length > 0 && selectedResourceIds.length === filteredPdfs.length;
  const allVideosSelected = filteredVideos.length > 0 && selectedResourceIds.length === filteredVideos.length;
  
  // Calculate pagination
  const getCurrentPageData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };
  
  const getTotalPages = (data) => {
    return Math.ceil(data.length / itemsPerPage);
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, activeTab]);
  
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
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && (
              <span className="px-3 py-2 text-sm text-gray-500">...</span>
            )}
          </>
        )}
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 text-sm font-medium rounded-lg border ${
              currentPage === page
                ? 'bg-black text-white border-black'
                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-3 py-2 text-sm text-gray-500">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  // Handle MCQ search
  const handleMCQSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/questions/practice?category=${encodeURIComponent(selectedCategory)}`;
      if (mcqSubcategory && mcqSubcategory !== 'all') url += `&subcategory=${encodeURIComponent(mcqSubcategory)}`;
      if (mcqLevel && mcqLevel !== 'all') url += `&level=${encodeURIComponent(mcqLevel)}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.questions || !data.questions.length) {
        setError(data.message || 'No questions found.');
        setMcqs([]);
        setLoading(false);
        return;
      }
      setMcqs(data.questions);
    } catch (err) {
      setError('Failed to fetch questions.');
      setMcqs([]);
    }
    setLoading(false);
  };

  // Handle option selection
  const handleOptionSelect = (qIdx, key, correctAns) => {
    const updated = [...answers];
    updated[qIdx] = key;
    setAnswers(updated);
    if (key !== correctAns) {
      setShowExplanation(prev => {
        const updatedShow = [...prev];
        updatedShow[qIdx] = true;
        return updatedShow;
      });
    }
  };

  // Handle show explanation
  const handleShowExplanation = (qIdx) => {
    setShowExplanation(prev => {
      const updated = [...prev];
      updated[qIdx] = !updated[qIdx];
      return updated;
    });
  };

  // Handle PDF download
  const handleDownloadPDF = async (resourceId, fileName) => {
    try {
      const response = await fetch(`/api/resources/download/${resourceId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  // Handle resource bookmark
  const handleResourceBookmark = async (resourceId, isBookmarked) => {
    try {
      const endpoint = `/api/resources/bookmark/${resourceId}`;
      const method = isBookmarked ? 'DELETE' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        credentials: 'include'
      });
      
      if (response.ok) {
        // Update local state
        if (isBookmarked) {
          setBookmarkedResources(prev => prev.filter(bm => bm.resourceId !== resourceId));
        } else {
          // Add to bookmarks
          const resource = [...pdfs, ...videos].find(r => r.id === resourceId);
          if (resource) {
            setBookmarkedResources(prev => [...prev, { resourceId: resourceId, resource }]);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Handle video play
  const handlePlayVideo = (videoUrl) => {
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  };

  // Handle file selection for PDF upload
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  // Handle form input changes
  const handleFormChange = (field, value) => {
    setResourceForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle MCQ option changes
  const handleOptionChange = (index, value) => {
    const newOptions = [...resourceForm.options];
    newOptions[index] = value;
    setResourceForm(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  // Handle resource submission
  const handleSubmitResource = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('type', resourceType);
      formData.append('title', resourceForm.title);
      formData.append('description', resourceForm.description);
      formData.append('category', resourceForm.category);
      formData.append('subcategory', resourceForm.subcategory);
      formData.append('level', resourceForm.level);

      if (resourceType === 'pdf') {
        if (!selectedFile) {
          alert('Please select a PDF file.');
          setUploading(false);
          return;
        }
        formData.append('file', selectedFile);
      } else if (resourceType === 'video') {
        formData.append('videoUrl', resourceForm.videoUrl);
      } else if (resourceType === 'mcq') {
        formData.append('question', resourceForm.question);
        formData.append('explanation', resourceForm.explanation);
        formData.append('correctAnswer', resourceForm.correctAnswer);
        resourceForm.options.forEach((option, index) => {
          formData.append(`options[${index}]`, option);
        });
      }

      const response = await fetch('/api/resources', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        // Reset form and close modal
        setResourceForm({
          title: '',
          description: '',
          category: 'Aptitude',
          subcategory: '',
          level: 'easy',
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: '',
          videoUrl: ''
        });
        setSelectedFile(null);
        setResourceType('pdf');
        setShowAddModal(false);
        
        // Refresh resources
        const fetchResources = async () => {
          try {
            const [pdfsRes, videosRes] = await Promise.all([
              fetch('/api/resources?type=pdf', { credentials: 'include' }),
              fetch('/api/resources?type=video', { credentials: 'include' })
            ]);
            
            if (pdfsRes.ok) {
              const pdfsData = await pdfsRes.json();
              setPdfs(pdfsData.resources || []);
            }
            
            if (videosRes.ok) {
              const videosData = await videosRes.json();
              setVideos(videosData.resources || []);
            }
          } catch (error) {
            console.error('Error refreshing resources:', error);
          }
        };
        
        fetchResources();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to add resource');
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      alert('Failed to add resource');
    } finally {
      setUploading(false);
    }
  };

  // Reset form when modal opens/closes
  const handleOpenAddModal = () => {
    setResourceForm({
      title: '',
      description: '',
      category: 'Aptitude',
      subcategory: '',
      level: 'easy',
      videoUrl: '',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    });
    setSelectedFile(null);
    setShowAddModal(true);
  };

  // Handle delete click
  const handleDeleteClick = (item, type) => {
    setItemToDelete({ ...item, type });
    setShowDeleteModal(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleting(true);
    try {
      const endpoint = itemToDelete.type === 'mcq' 
        ? `/api/questions/${itemToDelete.id}`
        : `/api/resources/${itemToDelete.id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Remove from local state
        if (itemToDelete.type === 'mcq') {
          setMcqs(prev => prev.filter(q => q.id !== itemToDelete.id));
        } else if (itemToDelete.type === 'pdf') {
          setPdfs(prev => prev.filter(p => p.id !== itemToDelete.id));
        } else if (itemToDelete.type === 'video') {
          setVideos(prev => prev.filter(v => v.id !== itemToDelete.id));
        }
        
        setShowDeleteModal(false);
        setItemToDelete(null);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const toggleSelectResource = (id) => {
    setSelectedResourceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectMCQ = (id) => {
    setSelectedMCQIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const bulkDeleteResources = async () => {
    if (selectedResourceIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedResourceIds.length} selected resource(s)?`)) return;
    try {
      const res = await fetch('/api/resources/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedResourceIds })
      });
      if (res.ok) {
        setPdfs(prev => prev.filter(p => !selectedResourceIds.includes(p.id)));
        setVideos(prev => prev.filter(v => !selectedResourceIds.includes(v.id)));
        setSelectedResourceIds([]);
        alert('Selected resources deleted.');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to delete selected resources');
      }
    } catch (e) {
      alert('Failed to delete selected resources');
    }
  };

  // Handle MCQ bookmark
  const handleBookmark = async (questionId) => {
    try {
      const isBookmarked = bookmarkedIds.includes(questionId);
      const endpoint = isBookmarked 
        ? '/api/questions/bookmarks/remove'
        : '/api/questions/bookmarks';
      
      const method = isBookmarked ? 'POST' : 'POST';
      const body = isBookmarked 
        ? JSON.stringify({ questionId })
        : JSON.stringify({ questionId });
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body
      });
      
      if (response.ok) {
          if (isBookmarked) {
          setBookmarkedIds(prev => prev.filter(id => id !== questionId));
          } else {
          setBookmarkedIds(prev => [...prev, questionId]);
          }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Get filtered resources
  const filteredMcqs = getFilteredMCQs();

  // Check if resource is bookmarked
  const isResourceBookmarked = (resourceId) => {
    return bookmarkedResources.some(bm => bm.resourceId === resourceId);
  };

  return (
    <div className="page">
        {/* Header */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Learning Resources</h1>
                <p className="text-gray-600 mt-1">Access study materials, practice questions, and AI assistance</p>
              </div>
            </div>
            {canAddResource && (
              <button
                onClick={handleOpenAddModal}
                className="bg-black text-white px-6 py-3 rounded-xl shadow-lg hover:bg-gray-800 transition-all duration-200 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Resource</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Layout - 1/3 Filters, 2/3 Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Filters (1/3) */}
                <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Filters</h2>
            
            {/* Search Bar */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
            </div>

            {/* Filters */}
              <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                    <option value="all">All Categories</option>
                <option value="Aptitude">Aptitude</option>
                  <option value="DSA">DSA</option>
                <option value="Technical">Technical</option>
                  <option value="General">General</option>
              </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select
                  value={mcqLevel}
                  onChange={e => setMcqLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Levels</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="mcqs">All Types</option>
                  <option value="pdfs">PDF</option>
                  <option value="videos">Video</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 font-medium">
                      {activeTab === 'mcqs' ? filteredMcqs.length : activeTab === 'pdfs' ? filteredPdfs.length : filteredVideos.length}
                    </span>
                    <span className="text-gray-600">resources found</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
            </div>

          {/* Right Side - Content (2/3) */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex items-center justify-between px-6">
                  <div className="flex space-x-8">
                    {[
                      { id: 'mcqs', label: 'MCQs', icon: Target, count: filteredMcqs.length },
                      { id: 'pdfs', label: 'PDFs', icon: FileText, count: filteredPdfs.length },
                      { id: 'videos', label: 'Videos', icon: Video, count: filteredVideos.length }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-black text-black'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <tab.icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                                {activeTab === 'mcqs' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-black">Free Practice</h2>
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Subcategory</label>
                        <select
                          value={mcqSubcategory}
                          onChange={e => setMcqSubcategory(e.target.value)}
                          className="px-3 py-2 border rounded w-full"
                          disabled={subcategories.length === 0}
                        >
                          {subcategories.length === 0 ? (
                            <option value="all">No subcategories found</option>
                          ) : (
                            <>
                              <option value="all">All (All Subcategories)</option>
                              {subcategories.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Level</label>
                        <select 
                          value={mcqLevel} 
                          onChange={e => setMcqLevel(e.target.value)} 
                          className="px-3 py-2 border rounded w-full"
                        >
                          <option value="all">No Filter</option>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>
                    
                    {loading && <div className="text-lg">Loading questions...</div>}
                    {error && <div className="text-red-600 mt-2 text-center">{error}</div>}
                    
                    {!loading && !error && selectedCategory === 'all' && (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Please select a category from the filter above to view MCQs.</p>
                      </div>
                    )}
                    
                    {!loading && !error && selectedCategory !== 'all' && filteredMCQs.length === 0 && (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No MCQs found for the selected filters.</p>
                      </div>
                    )}
                    
                    {filteredMCQs.length > 0 && (
                      <div className="w-full flex flex-col gap-6 mt-4">
                        {getCurrentPageData(filteredMCQs).map((q, idx) => {
                          // Calculate the actual question number across all pages
                          const actualQuestionNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                          
                          return (
                            <div
                              key={q.id}
                              className="bg-white rounded-sm shadow p-6 border border-gray-200 hover:shadow-xl transition"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="text-lg font-bold text-black">Q{actualQuestionNumber}.</div>
                              <div className="px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-800 rounded-full">
                              {q.level?.charAt(0).toUpperCase() + q.level?.slice(1)}
                            </div>
                              <div className="text-xs text-gray-500">
                                Category: <span className="font-semibold">{q.category}</span> | Subcategory:{' '}
                                <span className="font-semibold">{q.subcategory}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                            <button
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title={bookmarkedIds.includes(q.id) ? 'Remove from bookmarks' : 'Add to bookmarks'}
                              onClick={() => handleBookmark(q.id)}
                            >
                              {bookmarkedIds.includes(q.id)
                                ? <BookmarkCheck className="w-5 h-5 text-yellow-500" />
                                : <Bookmark className="w-5 h-5 text-gray-400" />}
                            </button>
                              {canAddResource && (
                                <button
                                  onClick={() => handleDeleteClick(q, 'mcq')}
                                  className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                                  title="Delete MCQ"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                          </div>
                          </div>

                            <div className="mb-4 text-black font-medium text-lg">{q.question}</div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                              {Object.entries(q.options).map(([key, option]) => {
                              const selected = answers[idx];
                              const isCorrect = Array.isArray(q.correctAnswers) && q.correctAnswers.includes(option);
                                let btnClass = 'border-gray-300 bg-gray-50';
                                
                              if (selected) {
                                  if (selected === key && isCorrect) {
                                    btnClass = 'border-green-600 bg-green-50 text-green-800';
                                  } else if (selected === key && !isCorrect) {
                                    btnClass = 'border-red-600 bg-red-50 text-red-800';
                                  } else if (isCorrect && selected !== key) {
                                    btnClass = 'border-green-600 bg-green-50 text-green-800';
                              }
                                }
                                
                              return (
                                  <button
                                    key={key}
                                    onClick={() => handleOptionSelect(idx, key, (q.correctAnswers || []).map(v => v))}
                                    className={`px-4 py-2 rounded border font-medium text-left transition ${btnClass} hover:bg-gray-100`}
                                  >
                                    {key.toUpperCase()}. {option}
                                  </button>
                              );
                            })}
                          </div>

                            <button
                              className="text-black underline text-sm mb-2"
                              onClick={() => handleShowExplanation(idx)}
                            >
                              {showExplanation[idx] ? 'Hide Explanation' : 'See Explanation'}
                          </button>
                            
                            {showExplanation[idx] && (
                              <div className="bg-black text-white p-4 mt-2 rounded">
                                <div className="font-semibold mb-1">Explanation:</div>
                                <div className="mb-1">Correct Answer(s): <span className="font-bold text-green-700">{Array.isArray(q.correctAnswers) ? q.correctAnswers.join(', ') : ''}</span></div>
                                <div>{q.explanation}</div>
                              </div>
                            )}
                        </div>
                        );
                      })}
                        
                        {/* Pagination for MCQs */}
                        {getTotalPages(filteredMCQs) > 1 && (
                          <Pagination
                            currentPage={currentPage}
                            totalPages={getTotalPages(filteredMCQs)}
                            onPageChange={handlePageChange}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'pdfs' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">PDF Resources</h2>
                    <p className="text-sm text-gray-600">{filteredPdfs.length} documents available</p>
                  </div>
                </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                  {resourcesLoading ? 'Loading...' : `${filteredPdfs.length} found`}
                        </span>
              </div>
            </div>
            
              {resourcesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading PDFs...</p>
                </div>
              ) : filteredPdfs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No PDFs found for the selected filters.</p>
                </div>
              ) : (
                      <div className="space-y-4">
                        {getCurrentPageData(filteredPdfs).map((pdf, idx) => {
                          // Calculate the actual item number across all pages
                          const actualItemNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                          
                          return (
                            <div key={pdf.id} className="bg-white rounded-sm shadow p-6 border border-gray-200 hover:shadow-xl transition">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="flex items-center space-x-3">
                                  <FileText className="w-5 h-5 text-red-500" />
                                  <div className="text-lg font-bold text-black">PDF {actualItemNumber}.</div>
                            </div>
                                <div className="px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-800 rounded-full">
                                  {pdf.level?.charAt(0).toUpperCase() + pdf.level?.slice(1)}
                          </div>
                                <div className="text-xs text-gray-500">
                                  Category: <span className="font-semibold">{pdf.category}</span> | Subcategory:{' '}
                                  <span className="font-semibold">{pdf.subcategory}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                  <button
                            onClick={() => handleResourceBookmark(pdf.id, isResourceBookmarked(pdf.id))}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={isResourceBookmarked(pdf.id) ? 'Remove bookmark' : 'Add bookmark'}
                          >
                            {isResourceBookmarked(pdf.id) ? (
                              <BookmarkCheck className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <Bookmark className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          {canAddResource && (
                            <button
                              onClick={() => handleDeleteClick(pdf, 'pdf')}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                              title="Delete PDF"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                              </div>

                              <div className="mb-4 text-black font-medium text-lg">{pdf.title}</div>
                              
                              {pdf.description && (
                                <p className="text-gray-700 mb-4">{pdf.description}</p>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                  Added by: {pdf.creator?.fullName || 'Unknown'}
                      </div>
                      <button 
                        onClick={() => handleDownloadPDF(pdf.id, pdf.fileName)}
                                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                      >
                          <Download className="w-4 h-4" />
                                  <span>Download</span>
                  </button>
                </div>
                </div>
                          );
                        })}
                        
                        {/* Pagination for PDFs */}
                        {getTotalPages(filteredPdfs) > 1 && (
                          <Pagination
                            currentPage={currentPage}
                            totalPages={getTotalPages(filteredPdfs)}
                            onPageChange={handlePageChange}
                          />
              )}
            </div>
                    )}
                  </div>
                )}

                {activeTab === 'videos' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Video Resources</h2>
                    <p className="text-sm text-gray-600">{filteredVideos.length} videos available</p>
                  </div>
                </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                  {resourcesLoading ? 'Loading...' : `${filteredVideos.length} found`}
                        </span>
              </div>
            </div>
            
              {resourcesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading videos...</p>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="text-center py-8">
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No videos found for the selected filters.</p>
                </div>
              ) : (
                      <div className="space-y-4">
                        {getCurrentPageData(filteredVideos).map((video, idx) => {
                          // Calculate the actual item number across all pages
                          const actualItemNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                          
                          return (
                            <div key={video.id} className="bg-white rounded-sm shadow p-6 border border-gray-200 hover:shadow-xl transition">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="flex items-center space-x-3">
                                  <Video className="w-5 h-5 text-blue-500" />
                                  <div className="text-lg font-bold text-black">Video {actualItemNumber}.</div>
                            </div>
                                <div className="px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-800 rounded-full">
                                  {video.level?.charAt(0).toUpperCase() + video.level?.slice(1)}
                          </div>
                                <div className="text-xs text-gray-500">
                                  Category: <span className="font-semibold">{video.category}</span> | Subcategory:{' '}
                                  <span className="font-semibold">{video.subcategory}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                      <button
                            onClick={() => handleResourceBookmark(video.id, isResourceBookmarked(video.id))}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={isResourceBookmarked(video.id) ? 'Remove bookmark' : 'Add bookmark'}
                          >
                            {isResourceBookmarked(video.id) ? (
                              <BookmarkCheck className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <Bookmark className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          {canAddResource && (
                            <button
                              onClick={() => handleDeleteClick(video, 'video')}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                              title="Delete Video"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                              </div>

                              <div className="mb-4 text-black font-medium text-lg">{video.title}</div>
                              
                              {video.description && (
                                <p className="text-gray-700 mb-4">{video.description}</p>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                  Added by: {video.creator?.fullName || 'Unknown'}
                      </div>
                      <button 
                        onClick={() => handlePlayVideo(video.videoUrl)}
                                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                      >
                          <Play className="w-4 h-4" />
                                  <span>Watch</span>
                      </button>
                      </div>
                  </div>
                          );
                        })}
                        
                        {/* Pagination for Videos */}
                        {getTotalPages(filteredVideos) > 1 && (
                          <Pagination
                            currentPage={currentPage}
                            totalPages={getTotalPages(filteredVideos)}
                            onPageChange={handlePageChange}
                          />
                )}
              </div>
                    )}
            </div>
                )}
              </div>
            </div>
          </div>
                  </div>

        {/* Add Resource Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Resource</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Resource Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['pdf', 'video', 'mcq'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setResourceType(type)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          resourceType === type
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                        <div className="text-center">
                          <div className="text-2xl mb-1">
                            {type === 'pdf' && '📄'}
                            {type === 'video' && '🎥'}
                            {type === 'mcq' && '❓'}
                        </div>
                          <div className="text-sm font-medium capitalize">{type}</div>
                      </div>
                      </button>
                    ))}
                          </div>
                        </div>

                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={resourceForm.title}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter resource title"
                    />
                      </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      name="category"
                      value={resourceForm.category}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="Aptitude">Aptitude</option>
                      <option value="DSA">DSA</option>
                      <option value="Technical">Technical</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={resourceForm.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter resource description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                    <input
                      type="text"
                      name="subcategory"
                      value={resourceForm.subcategory}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter subcategory"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                    <select
                      name="level"
                      value={resourceForm.level}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Type-specific fields */}
                {resourceType === 'pdf' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    {selectedFile && (
                      <p className="text-sm text-gray-600 mt-2">Selected: {selectedFile.name}</p>
                    )}
                  </div>
                )}

                {resourceType === 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                    <input
                      type="url"
                      name="videoUrl"
                      value={resourceForm.videoUrl}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter video URL"
                    />
                  </div>
                )}

                {resourceType === 'mcq' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                      <textarea
                        name="question"
                        value={resourceForm.question}
                        onChange={handleFormChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="Enter the question"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                      {resourceForm.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder={`Option ${index + 1}`}
                          />
                          <input
                            type="radio"
                            name="correctAnswer"
                            value={index}
                            checked={resourceForm.correctAnswer === index}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-black"
                          />
                          <span className="text-sm text-gray-600">Correct</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                      <textarea
                        name="explanation"
                        value={resourceForm.explanation}
                        onChange={handleFormChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="Enter explanation for the correct answer"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <button
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitResource}
                    disabled={uploading}
                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add Resource</span>
                      </>
                    )}
                      </button>
                    </div>
                  </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Resource</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone.</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete this {itemToDelete.type.toUpperCase()}?
                </p>
                <div className="bg-gray-50 p-3 rounded border">
                  <p className="font-medium text-gray-900">{itemToDelete.title}</p>
                  <p className="text-sm text-gray-600">
                    {itemToDelete.type === 'pdf' && 'PDF Resource'}
                    {itemToDelete.type === 'video' && 'Video Resource'}
                    {itemToDelete.type === 'mcq' && 'MCQ Question'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                </>
                )}
                </button>
              </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Resource; 