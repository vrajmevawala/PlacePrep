import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Filter, X, Check, Eye, EyeOff, Trophy, Users, Clock, Upload, FileText, Edit } from 'lucide-react';

const CreateContest = () => {
  const [contestName, setContestName] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('12:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('13:00');
  const [requiresCode, setRequiresCode] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [filters, setFilters] = useState({ topic: '', difficulty: '' });
  const [topics, setTopics] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({ type: '', newValue: 0 });
  const [draftNumQuestions, setDraftNumQuestions] = useState(5);
  const [shakeQuestion, setShakeQuestion] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    subcategory: '',
    level: 'easy',
    options: { a: '', b: '', c: '', d: '' },
    correctAns: 'a',
    explanation: ''
  });
  const [addingQuestion, setAddingQuestion] = useState(false);
  
  // File upload states
  const [excelUploadStatus, setExcelUploadStatus] = useState('');
  const [jsonUploadStatus, setJsonUploadStatus] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const fileInputRef = useRef();
  const jsonFileInputRef = useRef();
  
  // Question editing states
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingQuestionData, setEditingQuestionData] = useState({
    question: '',
    subcategory: '',
    level: 'easy',
    options: { a: '', b: '', c: '', d: '' },
    correctAns: 'a',
    explanation: ''
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const navigate = useNavigate();
  const { contestId } = useParams();
  const isEditMode = !!contestId;

  // Helper to get current date and time for validation
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    };
  };

  // Validation functions
  const validateStartDateTime = () => {
    if (!startDate || !startTime) return { isValid: false, message: 'Start date and time are required' };
    
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const now = new Date();
    
    if (startDateTime <= now) {
      return { isValid: false, message: 'Start time cannot be in the past' };
    }
    
    return { isValid: true, message: '' };
  };

  const validateEndDateTime = () => {
    if (!endDate || !endTime) return { isValid: false, message: 'End date and time are required' };
    
    const endDateTime = new Date(`${endDate}T${endTime}`);
    const startDateTime = new Date(`${startDate}T${startTime}`);
    
    if (endDateTime <= startDateTime) {
      return { isValid: false, message: 'End time must be after start time' };
    }
    
    return { isValid: true, message: '' };
  };

  // File upload handlers
  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!fileInputRef.current.files[0]) {
      setExcelUploadStatus('Please select a file.');
      return;
    }
    setExcelUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('visibility', 'false'); // Set visibility to false for contest questions
    try {
      const res = await fetch('/api/questions/upload-excel', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setExcelUploadStatus(data.message || 'Questions uploaded successfully! (Hidden until contest ends)');
        // Refresh questions and update available questions count
        const questionsRes = await fetch('/api/questions', { credentials: 'include' });
        const questionsData = await questionsRes.json();
        const newQuestions = questionsData.questions || [];
        setAllQuestions(newQuestions);
        
        // Update topics and difficulties
        setTopics([...new Set(newQuestions.map(q => q.subcategory).filter(Boolean))]);
        setDifficulties([...new Set(newQuestions.map(q => q.level).filter(Boolean))]);
        
        // Update number of questions if needed
        if (newQuestions.length > allQuestions.length) {
          const addedCount = newQuestions.length - allQuestions.length;
          setExcelUploadStatus(`Successfully added ${addedCount} questions! Available questions: ${newQuestions.length} (Hidden until contest ends)`);
          
          // Auto-select the newly uploaded questions
          const newQuestionIds = newQuestions.slice(allQuestions.length).map(q => q.id);
          setSelectedQuestions(prev => {
            const existingIds = prev.map(q => q.id);
            const newQuestionsToAdd = newQuestions.slice(allQuestions.length).filter(q => !existingIds.includes(q.id));
            return [...prev, ...newQuestionsToAdd];
          });
          
          // Close modal after successful upload
          setTimeout(() => {
            setShowFileUpload(false);
            setExcelUploadStatus('');
          }, 2000);
          
          // Suggest updating number of questions if current selection is less than available
          if (numQuestions < newQuestions.length) {
            setTimeout(() => {
              if (confirm(`Would you like to update the number of questions from ${numQuestions} to ${newQuestions.length}?`)) {
                setNumQuestions(newQuestions.length);
                setDraftNumQuestions(newQuestions.length);
              }
            }, 1000);
          }
        }
      } else {
        setExcelUploadStatus(data.message || 'Upload failed.');
      }
    } catch (err) {
      setExcelUploadStatus('Upload failed.');
    }
  };

  const handleJsonUpload = async (e) => {
    e.preventDefault();
    if (!jsonFileInputRef.current.files[0]) {
      setJsonUploadStatus('Please select a file.');
      return;
    }
    setJsonUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', jsonFileInputRef.current.files[0]);
    formData.append('visibility', 'false'); // Set visibility to false for contest questions
    try {
      const res = await fetch('/api/questions/upload-json', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setJsonUploadStatus(data.message || 'Questions uploaded successfully! (Hidden until contest ends)');
        // Refresh questions and update available questions count
        const questionsRes = await fetch('/api/questions', { credentials: 'include' });
        const questionsData = await questionsRes.json();
        const newQuestions = questionsData.questions || [];
        setAllQuestions(newQuestions);
        
        // Update topics and difficulties
        setTopics([...new Set(newQuestions.map(q => q.subcategory).filter(Boolean))]);
        setDifficulties([...new Set(newQuestions.map(q => q.level).filter(Boolean))]);
        
        // Update number of questions if needed
        if (newQuestions.length > allQuestions.length) {
          const addedCount = newQuestions.length - allQuestions.length;
          setJsonUploadStatus(`Successfully added ${addedCount} questions! Available questions: ${newQuestions.length} (Hidden until contest ends)`);
          
          // Auto-select the newly uploaded questions
          const newQuestionIds = newQuestions.slice(allQuestions.length).map(q => q.id);
          setSelectedQuestions(prev => {
            const existingIds = prev.map(q => q.id);
            const newQuestionsToAdd = newQuestions.slice(allQuestions.length).filter(q => !existingIds.includes(q.id));
            return [...prev, ...newQuestionsToAdd];
          });
          
          // Close modal after successful upload
          setTimeout(() => {
            setShowFileUpload(false);
            setJsonUploadStatus('');
          }, 2000);
          
          // Suggest updating number of questions if current selection is less than available
          if (numQuestions < newQuestions.length) {
            setTimeout(() => {
              if (confirm(`Would you like to update the number of questions from ${numQuestions} to ${newQuestions.length}?`)) {
                setNumQuestions(newQuestions.length);
                setDraftNumQuestions(newQuestions.length);
              }
            }, 1000);
          }
        }
      } else {
        setJsonUploadStatus(data.message || 'Upload failed.');
      }
    } catch (err) {
      setJsonUploadStatus('Upload failed.');
    }
  };

  // Question editing handlers
  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setEditingQuestionData({
      question: question.question,
      subcategory: question.subcategory,
      level: question.level,
      options: question.options,
      correctAns: question.correctAns,
      explanation: question.explanation || ''
    });
    setShowEditQuestionModal(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      try {
        const res = await fetch(`/api/questions/${questionId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) {
          // Remove from all questions
          setAllQuestions(prev => prev.filter(q => q.id !== questionId));
          // Remove from selected questions
          setSelectedQuestions(prev => prev.filter(q => q.id !== questionId));
          // Update topics and difficulties
          const updatedQuestions = allQuestions.filter(q => q.id !== questionId);
          setTopics([...new Set(updatedQuestions.map(q => q.subcategory).filter(Boolean))]);
          setDifficulties([...new Set(updatedQuestions.map(q => q.level).filter(Boolean))]);
        } else {
          alert('Failed to delete question');
        }
      } catch (err) {
        alert('Failed to delete question');
      }
    }
  };

  const handleSaveEditedQuestion = async (e) => {
    e.preventDefault();
    setSavingQuestion(true);
    try {
      const res = await fetch(`/api/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingQuestionData)
      });
      if (res.ok) {
        const updatedQuestion = await res.json();
        // Update in all questions
        setAllQuestions(prev => prev.map(q => q.id === editingQuestion.id ? updatedQuestion.question : q));
        // Update in selected questions
        setSelectedQuestions(prev => prev.map(q => q.id === editingQuestion.id ? updatedQuestion.question : q));
        // Update topics and difficulties
        setTopics([...new Set(allQuestions.map(q => q.subcategory).filter(Boolean))]);
        setDifficulties([...new Set(allQuestions.map(q => q.level).filter(Boolean))]);
        setShowEditQuestionModal(false);
        setEditingQuestion(null);
      } else {
        alert('Failed to update question');
      }
    } catch (err) {
      alert('Failed to update question');
    }
    setSavingQuestion(false);
  };

  useEffect(() => {
    // Fetch all questions
    fetch('/api/questions', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setAllQuestions(data.questions || []);
        setTopics([...new Set((data.questions || []).map(q => q.subcategory).filter(Boolean))]);
        setDifficulties([...new Set((data.questions || []).map(q => q.level).filter(Boolean))]);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load questions');
        setLoading(false);
      });

    // If in edit mode, fetch contest data
    if (isEditMode && contestId) {
      fetch(`/api/testseries/${contestId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          const contestData = data.testSeries;
          
          // Set contest details
          setContestName(contestData.title);
          setNumQuestions(contestData.questions.length);
          setDraftNumQuestions(contestData.questions.length);
          
          // Parse start and end times
          const startDateTime = new Date(contestData.startTime);
          const endDateTime = new Date(contestData.endTime);
          
          setStartDate(startDateTime.toISOString().split('T')[0]);
          setStartTime(startDateTime.toTimeString().slice(0, 5));
          setEndDate(endDateTime.toISOString().split('T')[0]);
          setEndTime(endDateTime.toTimeString().slice(0, 5));
          setRequiresCode(contestData.requiresCode || false);
          
          // Set selected questions
          setSelectedQuestions(contestData.questions);
        })
        .catch(() => {
          setError('Failed to load contest data');
        });
    }
  }, [isEditMode, contestId]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || window.pageYOffset;
      setShowScrollToTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToQuestion = (questionId) => {
    const questionElement = document.getElementById(`question-card-${questionId}`);
    if (questionElement) {
      questionElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  const filteredQuestions = allQuestions.filter(q => {
    return (
      (!filters.topic || q.subcategory === filters.topic) &&
      (!filters.difficulty || q.level === filters.difficulty)
    );
  });

  // Pagination helper functions
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
    // Scroll to top of questions section
    const questionsSection = document.querySelector('.questions-section');
    if (questionsSection) {
      questionsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.topic, filters.difficulty]);

  // Keep draftNumQuestions synchronized with numQuestions
  useEffect(() => {
    setDraftNumQuestions(numQuestions);
  }, [numQuestions]);

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

  const handleSelectQuestion = (q) => {
    if (selectedQuestions.find(sq => sq.id === q.id)) {
      setSelectedQuestions(selectedQuestions.filter(sq => sq.id !== q.id));
    } else if (selectedQuestions.length < numQuestions) {
      setSelectedQuestions([...selectedQuestions, q]);
    } else {
      // Cannot select more questions - show feedback
      setShakeQuestion(q.id);
      setTimeout(() => setShakeQuestion(null), 500);
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      
      // Show toast message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
      toast.textContent = `Cannot select more questions. ${numQuestions} questions already selected.`;
      document.body.appendChild(toast);
      
      // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
      }, 100);
      
      // Remove after 3 seconds
      setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    }
  };

  const handleQuestionClick = (q) => {
    handleSelectQuestion(q);
  };

  const toggleQuestionExpansion = (questionId) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        // Restore scroll position after collapse
        setTimeout(() => {
          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }, 300);
        newSet.delete(questionId);
      } else {
        // Store current scroll position before expanding
        setScrollPosition(window.scrollY || window.pageYOffset);
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleNumberChange = (newValue) => {
    // Ensure the value is within valid bounds
    const validValue = Math.max(5, Math.min(newValue, allQuestions.length));
    setDraftNumQuestions(validValue);
  };

  // Only called when user "commits" the change
  const commitNumberChange = (newValue) => {
    // Validate the input value
    const validValue = Math.max(1, Math.min(newValue, allQuestions.length));
    
    if (validValue === numQuestions) {
      // Reset draft to current value if no change
      setDraftNumQuestions(numQuestions);
      return;
    }
    
    const currentSelected = selectedQuestions.length;
    if (validValue > numQuestions) {
      if (currentSelected > 0) {
        setConfirmDialogData({
          type: 'increase',
          newValue: validValue,
          message: `You have ${currentSelected} questions selected. Do you want to clear the selection or continue with the current selection?`
        });
        setShowConfirmDialog(true);
      } else {
        setNumQuestions(validValue);
      }
    } else if (validValue < numQuestions) {
      if (currentSelected > validValue) {
        setConfirmDialogData({
          type: 'decrease',
          newValue: validValue,
          message: `If you decrease to ${validValue} questions, your current selection of ${currentSelected} questions will be lost. Continue?`
        });
        setShowConfirmDialog(true);
      } else {
        setNumQuestions(validValue);
      }
    }
  };

  const handleConfirmDialog = (action) => {
    if (confirmDialogData.type === 'increase') {
      if (action === 'clear') {
        setSelectedQuestions([]);
        setNumQuestions(confirmDialogData.newValue);
        setDraftNumQuestions(confirmDialogData.newValue);
      } else if (action === 'continue') {
        setNumQuestions(confirmDialogData.newValue);
        setDraftNumQuestions(confirmDialogData.newValue);
      }
    } else if (confirmDialogData.type === 'decrease') {
      if (action === 'cancel') {
        setShowConfirmDialog(false);
        setConfirmDialogData({ type: '', newValue: 0 });
        return;
      }
      if (action === 'confirm') {
        setConfirmDialogData({
          type: 'decrease_final',
          newValue: confirmDialogData.newValue,
          message: `Are you absolutely sure you want to decrease to ${confirmDialogData.newValue} questions? This action cannot be undone.`
        });
      return;
    }
    } else if (confirmDialogData.type === 'decrease_final') {
      if (action === 'final_confirm') {
        setSelectedQuestions([]);
        setNumQuestions(confirmDialogData.newValue);
        setDraftNumQuestions(confirmDialogData.newValue);
      }
    }
    setShowConfirmDialog(false);
    setConfirmDialogData({ type: '', newValue: 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contestName) {
      setError('Contest name is required');
      return;
    }
    if (!startDate || !startTime || !endDate || !endTime) {
      setError('Start and end dates and times are required');
      return;
    }
    
    // Validate start and end times
    const startValidation = validateStartDateTime();
    const endValidation = validateEndDateTime();
    
    if (!startValidation.isValid) {
      setError(startValidation.message);
      return;
    }
    
    if (!endValidation.isValid) {
      setError(endValidation.message);
      return;
    }
    
    if (selectedQuestions.length !== Number(numQuestions)) {
      setError(`Please select exactly ${numQuestions} questions.`);
      return;
    }
    setError('');
    
    // Determine if this is create or update
    const url = isEditMode ? `/api/testseries/${contestId}` : '/api/testseries';
    const method = isEditMode ? 'PUT' : 'POST';
    
    // Submit contest
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: contestName,
        numberOfQuestions: numQuestions,
        questionIds: selectedQuestions.map(q => q.id),
        startTime: `${startDate}T${startTime}`,
        endTime: `${endDate}T${endTime}`,
        requiresCode: requiresCode
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      const action = isEditMode ? 'updated' : 'created';
      const message = isEditMode 
        ? 'Contest updated successfully!'
        : (requiresCode 
          ? `Contest created successfully! Contest Code: ${data.testSeries.contestCode}`
          : 'Contest created successfully!');
      alert(message);
      navigate('/admin-dashboard');
    } else {
      const data = await res.json();
      const action = isEditMode ? 'update' : 'create';
      setError(data.message || `Failed to ${action} contest`);
    }
  };

  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="page">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-sm">
              {isEditMode ? <Edit className="w-6 h-6 text-white" /> : <Trophy className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-black">
                {isEditMode ? 'Edit Contest' : 'Create New Contest'}
              </h1>
              <p className="text-gray-600 mt-2">
                {isEditMode 
                  ? 'Modify contest details and questions from the question bank'
                  : 'Select questions from the question bank to create your contest'
                }
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contest Details Card */}
          <div className="bg-white border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-8 flex items-center">
              <Plus className="w-6 h-6 mr-3 text-black" />
              Contest Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-black mb-3">Contest Name</label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  value={contestName}
                  onChange={e => setContestName(e.target.value)}
                  placeholder="Enter contest name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-3">
                  Number of Questions
                  {draftNumQuestions !== numQuestions && (
                    <span className="ml-2 text-xs text-gray-500">(Press Enter or Tab to save)</span>
                  )}
                </label>
                <input
                  type="number"
                  className={`w-full px-4 py-3 border transition-colors ${
                    draftNumQuestions !== numQuestions 
                      ? 'border-orange-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400' 
                      : 'border-gray-300 focus:ring-2 focus:ring-black focus:border-black'
                  }`}
                  value={draftNumQuestions}
                  min={1}
                  max={allQuestions.length}
                  onChange={e => handleNumberChange(Number(e.target.value))}
                  onBlur={e => commitNumberChange(Number(e.target.value))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === 'Tab') {
                      commitNumberChange(Number(e.target.value));
                    }
                  }}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available questions: {allQuestions.length}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div>
                <label className="block text-sm font-semibold text-black mb-3">Start Date & Time</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    className="px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    value={startDate}
                    min={getCurrentDateTime().date}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                  <input
                    type="time"
                    className="px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                  />
                </div>
                {startDate && startTime && !validateStartDateTime().isValid && (
                  <p className="text-red-600 text-sm mt-1">{validateStartDateTime().message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-3">End Date & Time</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    className="px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    value={endDate}
                    min={startDate || getCurrentDateTime().date}
                    onChange={e => setEndDate(e.target.value)}
                    required
                  />
                  <input
                    type="time"
                    className="px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                  />
                </div>
                {endDate && endTime && !validateEndDateTime().isValid && (
                  <p className="text-red-600 text-sm mt-1">{validateEndDateTime().message}</p>
                )}
              </div>
            </div>
            
            <div className="mt-8">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresCode"
                    checked={requiresCode}
                    onChange={e => setRequiresCode(e.target.checked)}
                    className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                  />
                  <label htmlFor="requiresCode" className="ml-3 text-sm font-semibold text-black">
                    Require contest code to join
                  </label>
                </div>
              </div>
              {requiresCode && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> A unique 6-character contest code will be generated automatically when you create this contest. 
                    Users will need this code to join the contest.
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-8">
              <div className="flex items-end">
                <div className="w-full">
                  <label className="block text-sm font-semibold text-black mb-3">Available Questions</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-300">
                    <span className="text-lg font-semibold text-black">{allQuestions.length}</span>
                    <span className="text-gray-600 ml-1">questions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Card */}
          <div className="bg-white border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-black mb-6 flex items-center">
              <Filter className="w-5 h-5 mr-3 text-black" />
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-3">Topic</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  value={filters.topic}
                  onChange={e => setFilters(f => ({ ...f, topic: e.target.value }))}
                >
                  <option value="">All Topics</option>
                  {topics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-3">Difficulty</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  value={filters.difficulty}
                  onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value }))}
                >
                  <option value="">All Difficulties</option>
                  {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Selected Questions Card */}
          <div className="bg-white border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-black mb-6 flex items-center">
              <Check className="w-5 h-5 mr-3 text-black" />
              Selected Questions ({selectedQuestions.length}/{numQuestions})
            </h3>
            {selectedQuestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedQuestions.map(q => (
                  <div 
                    key={q.id} 
                    className="bg-gray-50 border border-gray-200 p-4 flex items-start justify-between group hover:bg-gray-100 transition-colors"
                    onClick={() => scrollToQuestion(q.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">{q.question}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-gray-600">{q.subcategory}</span>
                        <span className={`text-xs px-2 py-1 ${getDifficultyColor(q.level)}`}>
                          {q.level}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-2">
                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditQuestion(q);
                        }}
                        className="p-1 text-gray-600 hover:text-black hover:bg-gray-200 transition-colors"
                        title="Edit Question"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectQuestion(q);
                        }}
                        className="p-1 text-gray-600 hover:text-black hover:bg-gray-200 transition-colors"
                        title="Remove Question"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No questions selected yet</p>
                <p className="text-sm mt-2">Click on questions below to select them</p>
              </div>
            )}
        </div>

          {/* Question Bank Card */}
          <div className="bg-white border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-black flex items-center">
                <Eye className="w-5 h-5 mr-3 text-black" />
                Question Bank ({filteredQuestions.length} questions)
                {getTotalPages(filteredQuestions) > 1 && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    (Page {currentPage} of {getTotalPages(filteredQuestions)})
                  </span>
                )}
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFileUpload(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-black hover:bg-gray-800 text-white font-semibold transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Questions</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-black hover:bg-gray-800 text-white font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Question</span>
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
                <p className="text-gray-600">Loading questions...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">⚠️</div>
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <div className="space-y-3 questions-section">
                {/* Question Counter */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div>
                    Showing {getCurrentPageData(filteredQuestions).length} of {filteredQuestions.length} questions
                    {getTotalPages(filteredQuestions) > 1 && (
                      <span> (Page {currentPage} of {getTotalPages(filteredQuestions)})</span>
                    )}
                  </div>
                  <div>
                    Selected: {selectedQuestions.length}/{numQuestions} questions
                  </div>
                </div>
                {getCurrentPageData(filteredQuestions).map((q, idx) => {
                  const isSelected = !!selectedQuestions.find(sq => sq.id === q.id);
                  const isExpanded = expandedQuestions.has(q.id);
                  // Calculate the actual question number across all pages
                  const actualQuestionNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <div
                      key={q.id}
                      id={`question-card-${q.id}`}
                      className={`border border-gray-200 overflow-hidden transition-all duration-200 ${
                        shakeQuestion === q.id ? 'animate-shake' : ''
                      }`}
                    >
                      <div 
                        className={`p-6 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-gray-50 border-l-4 border-l-black' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => handleQuestionClick(q)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 pt-1 flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">{actualQuestionNumber}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!isSelected && selectedQuestions.length >= numQuestions}
                              onChange={() => handleSelectQuestion(q)}
                              className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 leading-relaxed">{q.question}</p>
                            <div className="flex items-center space-x-3 mt-2">
                              <span className="text-xs text-gray-600">{q.subcategory}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(q.level)}`}>
                                {q.level}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditQuestion(q);
                              }}
                              className="flex items-center space-x-1 text-black hover:text-gray-700 text-sm font-medium p-2 hover:bg-gray-100 transition-colors"
                              title="Edit Question"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuestion(q.id);
                              }}
                              className="flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm font-medium p-2 hover:bg-red-50 transition-colors"
                              title="Delete Question"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleQuestionExpansion(q.id);
                              }}
                              className="flex items-center space-x-1 text-black hover:text-gray-700 text-sm font-medium p-2 hover:bg-gray-100 transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  <span>Hide Details</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  <span>View Details</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="bg-gray-50 border-t border-gray-200 p-8 animate-fadeIn">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                Question
                              </h4>
                              <p className="text-gray-700 leading-relaxed">{q.question}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                Options
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['a', 'b', 'c', 'd'].map(option => (
                                  <div key={option} className={`p-4 border ${
                                    q.correctAns === option 
                                      ? 'bg-black text-white' 
                                      : 'bg-white border-gray-200'
                                  }`}>
                                    <div className="flex items-start space-x-2">
                                      <span className={`font-bold text-sm ${
                                        q.correctAns === option ? 'text-white' : 'text-gray-500'
                                      }`}>
                                        {option.toUpperCase()}.
                                      </span>
                                      <span className={`text-sm ${
                                        q.correctAns === option ? 'text-white font-medium' : 'text-gray-700'
                                      }`}>
                                        {q.options[option]}
                                      </span>
                                      {q.correctAns === option && (
                                        <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
        </div>

                                                          <div>
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                  <span className="w-2 h-2 bg-black rounded-full mr-2"></span>
                                  Correct Answer
                                </h4>
                                <div className="inline-flex items-center space-x-2 px-3 py-2 bg-black text-white">
                                  <Check className="w-4 h-4" />
                                  <span className="font-medium">Option {q.correctAns.toUpperCase()}</span>
                                </div>
                              </div>
                            
            <div>
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                Explanation
                              </h4>
                              <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-lg border border-gray-200">
                                {q.explanation}
                              </p>
                            </div>
                            
                                                          <div className="flex justify-end pt-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleQuestionExpansion(q.id);
                                  }}
                                  className="flex items-center space-x-2 text-black hover:text-gray-700 text-sm font-medium px-4 py-2 hover:bg-gray-100 transition-colors"
                                >
                                  <EyeOff className="w-4 h-4" />
                                  <span>Hide Details</span>
                                </button>
                              </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Pagination */}
                {getTotalPages(filteredQuestions) > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={getTotalPages(filteredQuestions)}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500"></div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="flex items-center space-x-2 px-8 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              {isEditMode ? <Edit className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
              <span>{isEditMode ? 'Update Contest' : 'Create Contest'}</span>
            </button>
          </div>
        </form>

        {/* Floating Selection Progress Indicator */}
        {selectedQuestions.length > 0 && (
          <div className="fixed bottom-6 right-6 z-40">
            <div className="bg-white border border-gray-200 px-4 py-3 flex items-center space-x-3">
              <div className={`w-8 h-8 flex items-center justify-center ${
                selectedQuestions.length === numQuestions 
                  ? 'bg-black' 
                  : 'bg-gray-100'
              }`}>
                {selectedQuestions.length === numQuestions ? (
                  <Trophy className="w-4 h-4 text-white" />
                ) : (
                  <Check className="w-4 h-4 text-black" />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-black">
                  {selectedQuestions.length}/{numQuestions} questions selected
                </div>
                <div className="w-24 bg-gray-200 h-2">
                  <div 
                    className={`h-2 transition-all duration-300 ${
                      selectedQuestions.length === numQuestions 
                        ? 'bg-black' 
                        : 'bg-gray-600'
                    }`}
                    style={{ width: `${(selectedQuestions.length / numQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll to Top Button */}
        {showScrollToTop && (
          <div className="fixed bottom-6 left-6 z-40">
            <button
              onClick={scrollToTop}
              className="w-12 h-12 bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-all duration-200 hover:scale-110"
              title="Scroll to top"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white border border-gray-200 p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-lg font-bold text-black mb-2">
                  {confirmDialogData.type === 'increase' ? 'Clear Selection?' : 'Confirm Action'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {confirmDialogData.message}
                </p>
                
                <div className="flex space-x-3">
                  {confirmDialogData.type === 'increase' ? (
                    <>
                      <button
                        onClick={() => handleConfirmDialog('clear')}
                        className="flex-1 px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                      >
                        Clear Selection
                      </button>
                      <button
                        onClick={() => handleConfirmDialog('continue')}
                        className="flex-1 px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                      >
                        Continue
                      </button>
                    </>
                  ) : confirmDialogData.type === 'decrease' ? (
                    <>
                      <button
                        onClick={() => handleConfirmDialog('cancel')}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 font-medium hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmDialog('confirm')}
                        className="flex-1 px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                      >
                        Yes, Continue
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleConfirmDialog('cancel')}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 font-medium hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmDialog('final_confirm')}
                        className="flex-1 px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                      >
                        Yes, I'm Sure
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Upload Modal */}
        {showFileUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white border border-gray-200 p-8 max-w-lg w-full mx-4 relative">
              <button
                onClick={() => setShowFileUpload(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-2xl font-bold mb-8 text-black text-center">Upload Questions</h2>
              
                              <div className="space-y-6">
                  {/* Excel Upload */}
                  <div className="border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-3 text-black" />
                      Upload Excel File
                    </h3>
                    <form onSubmit={handleExcelUpload} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          Select Excel File (.xlsx, .xls)
                        </label>
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          ref={fileInputRef}
                          className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full px-4 py-3 bg-black hover:bg-gray-800 text-white font-semibold transition-colors"
                      >
                        Upload Excel
                      </button>
                      {excelUploadStatus && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3">
                          {excelUploadStatus}
                        </div>
                      )}
                    </form>
                  </div>

                                  {/* JSON Upload */}
                  <div className="border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-3 text-black" />
                      Upload JSON File
                    </h3>
                    <form onSubmit={handleJsonUpload} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                          Select JSON File (.json)
                        </label>
                        <input
                          type="file"
                          accept=".json"
                          ref={jsonFileInputRef}
                          className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full px-4 py-3 bg-black hover:bg-gray-800 text-white font-semibold transition-colors"
                      >
                        Upload JSON
                      </button>
                      {jsonUploadStatus && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3">
                          {jsonUploadStatus}
                        </div>
                      )}
                    </form>
                  </div>

                                  <div className="text-xs text-gray-500 text-center">
                    <p>• Excel files should have columns: question, subcategory, level, options (JSON), correctAns, explanation</p>
                    <p>• JSON files should contain an array of question objects with the same structure</p>
                    <p className="text-black font-medium mt-2">⚠️ Questions uploaded here will be hidden from the general question bank until the contest ends</p>
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Question Modal */}
          {showEditQuestionModal && editingQuestion && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white border border-gray-200 p-4 max-w-sm w-full mx-2 relative rounded-md shadow-md">
                {/* Close */}
                <button
                  onClick={() => setShowEditQuestionModal(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-lg font-bold"
                  aria-label="Close"
                >
                  ×
                </button>

                <h2 className="text-lg font-bold mb-4 text-black text-center">Edit Question</h2>

                <form
                  onSubmit={handleSaveEditedQuestion}
                  className="space-y-3"
                >
                  {/* Question text */}
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Question</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-black focus:border-black text-sm"
                      rows={2}
                      value={editingQuestionData.question}
                      onChange={e => setEditingQuestionData(q => ({ ...q, question: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Topic + Difficulty */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Topic</label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-black text-sm"
                        value={editingQuestionData.subcategory}
                        onChange={e => setEditingQuestionData(q => ({ ...q, subcategory: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Difficulty</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-black text-sm"
                        value={editingQuestionData.level}
                        onChange={e => setEditingQuestionData(q => ({ ...q, level: e.target.value }))}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-3">
                    {['a', 'b', 'c', 'd'].map(opt => (
                      <div key={opt}>
                        <label className="block text-xs font-semibold text-black mb-1">Option {opt.toUpperCase()}</label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-black text-sm"
                          value={editingQuestionData.options[opt]}
                          onChange={e =>
                            setEditingQuestionData(q => ({
                              ...q,
                              options: { ...q.options, [opt]: e.target.value }
                            }))
                          }
                          required
                        />
                      </div>
                    ))}
                  </div>

                  {/* Correct Answer */}
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Correct Option</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-black text-sm"
                      value={editingQuestionData.correctAns}
                      onChange={e => setEditingQuestionData(q => ({ ...q, correctAns: e.target.value }))}
                    >
                      <option value="a">A</option>
                      <option value="b">B</option>
                      <option value="c">C</option>
                      <option value="d">D</option>
                    </select>
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Explanation</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-black text-sm"
                      rows={2}
                      value={editingQuestionData.explanation}
                      onChange={e => setEditingQuestionData(q => ({ ...q, explanation: e.target.value }))}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditQuestionModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      disabled={savingQuestion}
                    >
                      {savingQuestion ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

       {/* Add New Question Modal */}
        {showAddQuestionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white border border-gray-200 p-4 max-w-sm w-full mx-2 relative rounded-md shadow-md">
              {/* Close */}
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-lg font-bold"
                aria-label="Close"
              >
                ×
              </button>

              <h2 className="text-lg font-bold mb-4 text-black text-center">Add New Question</h2>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAddingQuestion(true);
                  const questionData = { ...newQuestion, visibility: false };
                  const res = await fetch('/api/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(questionData)
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setAllQuestions(qs => [...qs, data.question]);
                    setShowAddQuestionModal(false);
                    setNewQuestion({
                      question: '',
                      subcategory: '',
                      level: 'easy',
                      options: { a: '', b: '', c: '', d: '' },
                      correctAns: 'a',
                      explanation: ''
                    });
                  } else {
                    alert('Failed to add question');
                  }
                  setAddingQuestion(false);
                }}
                className="space-y-3"
              >
                {/* Question */}
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Question</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-black text-sm"
                    rows={2}
                    value={newQuestion.question}
                    onChange={e => setNewQuestion(q => ({ ...q, question: e.target.value }))}
                    required
                  />
                </div>

                {/* Topic + Difficulty */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Topic</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-black text-sm"
                      value={newQuestion.subcategory}
                      onChange={e => setNewQuestion(q => ({ ...q, subcategory: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Difficulty</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-black text-sm"
                      value={newQuestion.level}
                      onChange={e => setNewQuestion(q => ({ ...q, level: e.target.value }))}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-3">
                  {['a', 'b', 'c', 'd'].map(opt => (
                    <div key={opt}>
                      <label className="block text-xs font-semibold text-black mb-1">Option {opt.toUpperCase()}</label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-black text-sm"
                        value={newQuestion.options[opt]}
                        onChange={e =>
                          setNewQuestion(q => ({
                            ...q,
                            options: { ...q.options, [opt]: e.target.value }
                          }))
                        }
                        required
                      />
                    </div>
                  ))}
                </div>

                {/* Correct Answer */}
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Correct Option</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-black text-sm"
                    value={newQuestion.correctAns}
                    onChange={e => setNewQuestion(q => ({ ...q, correctAns: e.target.value }))}
                  >
                    <option value="a">A</option>
                    <option value="b">B</option>
                    <option value="c">C</option>
                    <option value="d">D</option>
                  </select>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Explanation</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-black text-sm"
                    rows={2}
                    value={newQuestion.explanation}
                    onChange={e => setNewQuestion(q => ({ ...q, explanation: e.target.value }))}
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    disabled={addingQuestion}
                  >
                    {addingQuestion ? 'Adding...' : 'Add Question'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default CreateContest;