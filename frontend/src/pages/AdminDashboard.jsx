import React, { useState, useEffect, useRef } from 'react';
import AdminResults from './AdminResults';
import { Users, UserPlus, Activity, BarChart3, Eye, Plus, Settings, Trophy, Users as UsersIcon, FileText, Tag, Edit, Trash2, Video, X, Upload } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = ({ user, onNavigate }) => {
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showCreateModerator, setShowCreateModerator] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showPdfForm, setShowPdfForm] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [form, setForm] = useState({
    category: 'Aptitude',
    subcategory: '',
    level: 'easy',
    question: '',
    options: { a: '', b: '', c: '', d: '' },
    correctAns: '',
    explanation: ''
  });
  const [pdfForm, setPdfForm] = useState({
    title: '',
    description: '',
    category: 'Aptitude',
    subcategory: '',
    level: 'medium',
    file: null
  });
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    category: 'Aptitude',
    subcategory: '',
    level: 'medium',
    videoUrl: ''
  });
  const [showContestForm, setShowContestForm] = useState(false);
  const [contestForm, setContestForm] = useState({
    name: '',
    type: 'DSA',
    numberOfQuestions: 1,
    questions: [{
      question: '',
      options: { a: '', b: '', c: '', d: '' },
      correctAns: '',
      explanation: '',
      subcategory: '',
      level: ''
    }],
    startDate: '',
    startTime: '12:00',
    startAMPM: 'AM',
    endDate: '',
    endTime: '12:00',
    endAMPM: 'AM'
  });
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Management view state
  const [allContests, setAllContests] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [subcategoryQuestions, setSubcategoryQuestions] = useState([]);
  const [excelUploadStatus, setExcelUploadStatus] = useState('');
  const fileInputRef = useRef();
  const [jsonUploadStatus, setJsonUploadStatus] = useState('');
  const jsonFileInputRef = useRef();

  // Add missing state for new tab content
  const [userResults, setUserResults] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [contests, setContests] = useState([]);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [showCreateContest, setShowCreateContest] = useState(false);
  const [userActivities, setUserActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [moderators, setModerators] = useState([]);
  const [stats, setStats] = useState(null);
  const [showContestQuestionsModal, setShowContestQuestionsModal] = useState(false);
  const [selectedContestQuestions, setSelectedContestQuestions] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedContestTitle, setSelectedContestTitle] = useState('');
  const [loadingContestQuestions, setLoadingContestQuestions] = useState(false);
  const [contestStats, setContestStats] = useState([]);
  const [selectedContestStats, setSelectedContestStats] = useState(null);
  const [showContestStatsModal, setShowContestStatsModal] = useState(false);
  const [loadingContestStats, setLoadingContestStats] = useState(false);

  // Add filter/sort state
  const [contestSort, setContestSort] = useState({ field: 'startTime', order: 'desc' });
  const [contestStatus, setContestStatus] = useState('all'); // all, completed, upcoming, live
  const [contestCodeFilter, setContestCodeFilter] = useState('all'); // all, with, without

  // Modal scroll lock
  useEffect(() => {
    if (showForm || showContestForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showForm, showContestForm]);

  // Modal scroll lock for contest questions modal
  useEffect(() => {
    if (showContestQuestionsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showContestQuestionsModal]);

  // Fetch all contests
  useEffect(() => {
    if (selectedTab === 'contests') {
      fetch('/api/testseries', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setAllContests(data.testSeries || []));
    }
  }, [selectedTab]);

  // Fetch all questions
  useEffect(() => {
    if (selectedTab === 'resources' || selectedTab === 'tags') {
      fetch('/api/questions', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setAllQuestions(data.questions || []));
    }
  }, [selectedTab]);

  // Fetch all users
  useEffect(() => {
    if (selectedTab === 'users') {
      fetch('/api/auth/users', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setAllUsers(data.users || []));
    }
  }, [selectedTab]);

  // Extract unique subcategories for Tags
  useEffect(() => {
    if (selectedTab === 'tags') {
      const subcats = Array.from(new Set(allQuestions.map(q => q.subcategory).filter(Boolean)));
      setAllSubcategories(subcats);
    }
  }, [selectedTab, allQuestions]);

  // Fetch questions for selected subcategory
  useEffect(() => {
    if (selectedSubcategory) {
      setSubcategoryQuestions(allQuestions.filter(q => q.subcategory === selectedSubcategory));
    }
  }, [selectedSubcategory, allQuestions]);

  // Handlers for Add Question
  const handleChange = e => {
    const { name, value } = e.target;
    if (["a", "b", "c", "d"].includes(name)) {
      setForm(f => ({ ...f, options: { ...f.options, [name]: value } }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    console.log('Question JSON:', form);
    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form)
    });
    setShowForm(false);
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!fileInputRef.current.files[0]) {
      setExcelUploadStatus('Please select a file.');
      return;
    }
    setExcelUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    try {
      const res = await fetch('/api/questions/upload-excel', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setExcelUploadStatus(data.message || 'Questions uploaded successfully!');
        // Optionally refresh questions
        fetch('/api/questions', { credentials: 'include' })
          .then(res => res.json())
          .then(data => setAllQuestions(data.questions || []));
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
    try {
      const res = await fetch('/api/questions/upload-json', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setJsonUploadStatus(data.message || 'Questions uploaded successfully!');
        // Optionally refresh questions
        fetch('/api/questions', { credentials: 'include' })
          .then(res => res.json())
          .then(data => setAllQuestions(data.questions || []));
      } else {
        setJsonUploadStatus(data.message || 'Upload failed.');
      }
    } catch (err) {
      setJsonUploadStatus('Upload failed.');
    }
  };

  // Handlers for PDF Form
  const handlePdfChange = e => {
    const { name, value } = e.target;
    setPdfForm(f => ({ ...f, [name]: value }));
  };

  const handlePdfFileChange = e => {
    const file = e.target.files[0];
    setPdfForm(f => ({ ...f, file }));
  };

  const handlePdfSubmit = async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('type', 'pdf');
    formData.append('title', pdfForm.title);
    formData.append('description', pdfForm.description);
    formData.append('category', pdfForm.category);
    formData.append('subcategory', pdfForm.subcategory);
    formData.append('level', pdfForm.level);
    if (pdfForm.file) {
      formData.append('file', pdfForm.file);
    }

    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (res.ok) {
        setShowPdfForm(false);
        setPdfForm({
          title: '',
          description: '',
          category: 'Aptitude',
          subcategory: '',
          level: 'medium',
          file: null
        });
      }
    } catch (err) {
      console.error('Error adding PDF:', err);
    }
  };

  // Handlers for Video Form
  const handleVideoChange = e => {
    const { name, value } = e.target;
    setVideoForm(f => ({ ...f, [name]: value }));
  };

  const handleVideoSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'video',
          ...videoForm
        })
      });
      if (res.ok) {
        setShowVideoForm(false);
        setVideoForm({
          title: '',
          description: '',
          category: 'Aptitude',
          subcategory: '',
          level: 'medium',
          videoUrl: ''
        });
      }
    } catch (err) {
      console.error('Error adding video:', err);
    }
  };

  // Handlers for CREATE CONTEST
  const handleContestChange = e => {
    const { name, value } = e.target;
    if (name === 'numberOfQuestions') {
      const num = Math.max(1, parseInt(value) || 1);
      setContestForm(f => ({
        ...f,
        numberOfQuestions: num,
        questions: Array.from({ length: num }, (_, i) => f.questions[i] || {
          question: '',
          options: { a: '', b: '', c: '', d: '' },
          correctAns: '',
          explanation: '',
          subcategory: '',
          level: ''
        })
      }));
      setCurrentQuestionIdx(0);
    } else {
      setContestForm(f => ({ ...f, [name]: value }));
    }
  };
  const getStatus = () => {
    const now = new Date();
    const start = new Date(`${contestForm.startDate} ${contestForm.startTime} ${contestForm.startAMPM}`);
    const end = new Date(`${contestForm.endDate} ${contestForm.endTime} ${contestForm.endAMPM}`);
    if (now < start) return 'Scheduled';
    if (now >= start && now <= end) return 'Active';
    return 'Completed';
  };
  const handleContestQuestionChange = e => {
    const { name, value } = e.target;
    setContestForm(f => {
      const updatedQuestions = [...f.questions];
      if (["a", "b", "c", "d"].includes(name)) {
        updatedQuestions[currentQuestionIdx].options = {
          ...updatedQuestions[currentQuestionIdx].options,
          [name]: value
        };
      } else {
        updatedQuestions[currentQuestionIdx][name] = value;
      }
      return { ...f, questions: updatedQuestions };
    });
  };
  const handleContestSubmit = async e => {
    e.preventDefault();
    // Validate all questions
    for (const q of contestForm.questions) {
      if (!q.question || !q.options.a || !q.options.b || !q.options.c || !q.options.d || !q.correctAns || !q.explanation || !q.subcategory || !q.level) {
        alert('Please fill all fields (including subcategory and level) for every question in the contest.');
      return;
    }
    }
    // Prepare contest data
    const startDateTime = `${contestForm.startDate} ${contestForm.startTime} ${contestForm.startAMPM}`;
    const endDateTime = `${contestForm.endDate} ${contestForm.endTime} ${contestForm.endAMPM}`;
    try {
      // 1. Create all questions and collect their IDs
      const questionIds = [];
      for (const q of contestForm.questions) {
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            category: contestForm.type,
            subcategory: q.subcategory,
            level: q.level,
            ...q
          })
        });
        const data = await res.json();
        if (!data.question || !data.question.id) {
          alert('Failed to create a question.');
      return;
    }
        questionIds.push(data.question.id);
      }
      // 2. Create the contest
      const contestRes = await fetch('/api/testseries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: contestForm.name,
          startTime: new Date(startDateTime),
          endTime: new Date(endDateTime),
          questionIds
        })
      });
      if (contestRes.ok) {
        alert('Contest created successfully!');
        setShowContestForm(false);
        // Optionally reset contest form here
      } else {
        alert('Failed to create contest.');
      }
    } catch (err) {
      alert('An error occurred while creating the contest.');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setAllQuestions(qs => qs.filter(q => q.id !== id));
        alert('Question deleted successfully.');
      } else {
        alert(data.message || 'Failed to delete question.');
      }
    } catch (err) {
      alert('Failed to delete question.');
    }
  };

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
  };

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
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 border text-sm rounded ${
              currentPage === page
                ? 'bg-black text-white border-black'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    );
  };
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const handleEditQuestion = (q) => {
    setEditForm({ ...q, options: { ...q.options } });
    setEditModalOpen(true);
  };
  const handleEditFormChange = e => {
    const { name, value } = e.target;
    if (["a", "b", "c", "d"].includes(name)) {
      setEditForm(f => ({ ...f, options: { ...f.options, [name]: value } }));
    } else {
      setEditForm(f => ({ ...f, [name]: value }));
    }
  };
  const handleEditFormSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/questions/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category: editForm.category,
          subcategory: editForm.subcategory,
          level: editForm.level,
          question: editForm.question,
          options: editForm.options,
          correctAns: editForm.correctAns,
          explanation: editForm.explanation,
          visibility: editForm.visibility
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAllQuestions(qs => qs.map(q => q.id === editForm.id ? data.question : q));
        setEditModalOpen(false);
        alert('Question updated successfully.');
      } else {
        alert(data.message || 'Failed to update question.');
      }
    } catch (err) {
      alert('Failed to update question.');
    }
  };

  useEffect(() => {
    fetch('/api/auth/admin/stats', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => setStats(null));
  }, []);

  const [modForm, setModForm] = useState({ fullName: '', email: '', password: '' });
  const [modError, setModError] = useState('');
  const [modSuccess, setModSuccess] = useState('');
  const [isCreatingModerator, setIsCreatingModerator] = useState(false);

  const handleModFormChange = (e) => {
    e.stopPropagation();
    const { name, value } = e.target;
    
    setModForm(prev => ({ ...prev, [name]: value }));
    setModError('');
    setModSuccess('');
  };

  const handleModFormSubmit = async (e) => {
    e.preventDefault();
    if (!modForm.fullName || !modForm.email || !modForm.password) {
      setModError('Please fill all fields.');
      return;
    }
    if (modForm.password.length < 6) {
      setModError('Password must be at least 6 characters long.');
      return;
    }
    
    setIsCreatingModerator(true);
    setModError('');
    
    try {
      const res = await fetch('/api/auth/create-moderator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(modForm)
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh moderators list
        fetch('/api/auth/moderators', { credentials: 'include' })
          .then(res => res.json())
          .then(data => setModerators(data.moderators || []));
        setModSuccess('Moderator created successfully!');
        setTimeout(() => {
          setShowCreateModerator(false);
          setModForm({ fullName: '', email: '', password: '' });
          setModError('');
          setModSuccess('');
        }, 1500);
      } else {
        setModError(data.message || 'Failed to create moderator.');
      }
    } catch (err) {
      setModError('Failed to create moderator. Please try again.');
    } finally {
      setIsCreatingModerator(false);
    }
  };

  const CreateModeratorForm = () => {
    // Local state for the form to prevent interference
    const [localModForm, setLocalModForm] = useState({ fullName: '', email: '', password: '' });
    const [localModError, setLocalModError] = useState('');
    const [localModSuccess, setLocalModSuccess] = useState('');
    const [localIsCreating, setLocalIsCreating] = useState(false);

    const handleLocalModFormChange = (e) => {
      e.stopPropagation();
      const { name, value } = e.target;
      setLocalModForm(prev => ({ ...prev, [name]: value }));
      setLocalModError('');
      setLocalModSuccess('');
    };

    const handleLocalModFormSubmit = async (e) => {
      e.preventDefault();
      if (!localModForm.fullName || !localModForm.email || !localModForm.password) {
        setLocalModError('Please fill all fields.');
        return;
    }
      if (localModForm.password.length < 6) {
        setLocalModError('Password must be at least 6 characters long.');
        return;
      }
      
      setLocalIsCreating(true);
      setLocalModError('');
      
      try {
        const res = await fetch('/api/auth/create-moderator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(localModForm)
        });
        const data = await res.json();
        if (res.ok) {
          // Refresh moderators list
          fetch('/api/auth/moderators', { credentials: 'include' })
            .then(res => res.json())
            .then(data => setModerators(data.moderators || []));
          setLocalModSuccess('Moderator created successfully!');
          setTimeout(() => {
            setShowCreateModerator(false);
            setLocalModForm({ fullName: '', email: '', password: '' });
            setLocalModError('');
            setLocalModSuccess('');
          }, 1500);
        } else {
          setLocalModError(data.message || 'Failed to create moderator.');
        }
      } catch (err) {
        setLocalModError('Failed to create moderator. Please try again.');
      } finally {
        setLocalIsCreating(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg border border-gray-200 p-8 w-full max-w-md relative animate-fadeIn shadow-xl" style={{maxHeight:'95vh',overflow:'auto'}}>
          <button
            onClick={() => setShowCreateModerator(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
            aria-label="Close"
          >
            ×
          </button>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Moderator</h2>
            <p className="text-sm text-gray-600">Add a new moderator to help manage the platform</p>
          </div>
          <form className="space-y-6" onSubmit={handleLocalModFormSubmit} key="moderator-form">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              id="moderator-fullName"
              value={localModForm.fullName || ''}
              onChange={handleLocalModFormChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
              placeholder="Enter moderator's full name"
              required
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 2 characters, maximum 50 characters</p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              id="moderator-email"
              value={localModForm.email || ''}
              onChange={handleLocalModFormChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
              placeholder="moderator@example.com"
              required
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1">Enter a valid email address</p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              id="moderator-password"
              value={localModForm.password || ''}
              onChange={handleLocalModFormChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
              placeholder="Enter secure password"
              required
              autoComplete="new-password"
            />
            <div className="mt-1">
              <p className="text-xs text-gray-500">Minimum 6 characters</p>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${(localModForm.password || '').length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-xs text-gray-500">Password strength</span>
              </div>
            </div>
          </div>
          
          {localModError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-700">{localModError}</span>
              </div>
            </div>
          )}
          
          {localModSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-green-700">{localModSuccess}</span>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setShowCreateModerator(false)} 
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={!localModForm.fullName || !localModForm.email || !localModForm.password || localIsCreating}
            >
              {localIsCreating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Moderator'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'moderators', label: 'Moderators' },
    { id: 'users', label: 'User Analytics' },
    { id: 'resources', label: 'Resources' },
    { id: 'contests', label: 'Contests' },
    { id: 'results', label: 'Results' },
  ];

  useEffect(() => {
    if (selectedTab === 'overview') {
      fetch('/api/auth/activity-logs', { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch activity logs');
          return res.json();
        })
        .then(data => setUserResults(data.logs || []))
        .catch(() => setUserResults([]));
    }
    // Fetch user results for results tab
    if (selectedTab === 'results') {
      fetch('/api/results', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setUserResults(data.results || []))
        .catch(() => setUserResults([]));
      
      // Fetch contest statistics
      fetch('/api/testseries/stats/all', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setContestStats(data.contestStats || []))
        .catch(() => setContestStats([]));
    }
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab === 'moderators') {
      fetch('/api/auth/moderators', { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch moderators');
          return res.json();
        })
        .then(data => setModerators(data.moderators || []));
    }
  }, [selectedTab]);

  const handleCreateModerator = async (formData) => {
    const res = await fetch('/api/auth/create-moderator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      // Refresh moderators list
      fetch('/api/auth/moderators', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setModerators(data.moderators || []));
      setShowCreateModerator(false);
    }
  };

  const handleDeleteModerator = async (id) => {
    if (!window.confirm('Are you sure you want to delete this moderator?')) return;
    try {
      const res = await fetch(`/api/auth/moderators/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        // Refresh moderators list after deletion
        fetch('/api/auth/moderators', { credentials: 'include' })
          .then(res => res.json())
          .then(data => setModerators(data.moderators || []));
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete moderator');
      }
    } catch (err) {
      alert('Failed to delete moderator');
    }
  };

  const handleViewContestQuestions = async (contest) => {
    setShowContestQuestionsModal(true);
    setSelectedContestTitle(contest.title);
    setLoadingContestQuestions(true);
    try {
      const res = await fetch(`/api/testseries/${contest.id}`, { credentials: 'include' });
      const data = await res.json();
      setSelectedContestQuestions(data.testSeries?.questions || []);
    } catch (err) {
      setSelectedContestQuestions([]);
    }
    setLoadingContestQuestions(false);
  };

  const handleViewContestStats = async (contest) => {
    setShowContestStatsModal(true);
    setLoadingContestStats(true);
    try {
      const res = await fetch(`/api/testseries/${contest.id}/stats`, { credentials: 'include' });
      const data = await res.json();
      setSelectedContestStats(data);
    } catch (err) {
      setSelectedContestStats(null);
    }
    setLoadingContestStats(false);
  };

  // Helper to get contest status
  const getContestStatus = (contest) => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'live';
    return 'completed';
  };

  // Filter/sort contests
  const filteredContests = allContests
    .filter(c => {
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

  // Debug: Log contest statuses
  console.log('All contests:', allContests.map(c => ({
    id: c.id,
    title: c.title,
    startTime: c.startTime,
    status: getContestStatus(c),
    isUpcoming: getContestStatus(c) === 'upcoming'
  })));

  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && tab !== selectedTab) {
      setSelectedTab(tab);
    }
    // eslint-disable-next-line
  }, [location.search]);

  return (
    <div className="page">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage moderators and monitor system performance</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white p-6 border border-gray-200 rounded-lg flex justify-between items-center">
              <div>
              <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{stats ? stats.totalUsers : '...'}</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
          </div>
          <div className="bg-white p-6 border border-gray-200 rounded-lg flex justify-between items-center">
                  <div>
              <p className="text-sm text-gray-500">Active Moderators</p>
                <p className="text-2xl font-bold">{stats ? stats.totalModerators : '...'}</p>
                  </div>
              <UserPlus className="w-8 h-8 text-gray-400" />
            </div>
          <div className="bg-white p-6 border border-gray-200 rounded-lg flex justify-between items-center">
                  <div>
              <p className="text-sm text-gray-500">Tests Conducted</p>
                <p className="text-2xl font-bold">{stats ? stats.totalTests : '...'}</p>
                  </div>
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
          <div className="bg-white p-6 border border-gray-200 rounded-lg flex justify-between items-center">
                <div>
              <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold">{stats ? stats.successRate + '%' : '...'}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="my-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          </div>
        </div>

        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-black">Recent Activity</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {userResults.length === 0 ? (
                  <div className="p-6 text-gray-400">No recent activity.</div>
                ) : (
                  userResults.slice(0, 3).map((result, index) => (
                  <div key={index} className="p-6">
                    <div className="flex justify-between items-start">
                    <div>
                          <p className="font-medium">{typeof result.user === 'object' ? (result.user?.fullName || result.user?.email || 'User') : result.user}</p>
                          <p className="text-sm text-gray-600">{result.action}</p>
                          <p className="text-xs text-gray-500">{result.timestamp}</p>
                    </div>
                        {result.score !== undefined && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                            {result.score}%
                      </span>
                    )}
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>

          <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-black">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-4">
              <button
                onClick={() => navigate('/dashboard?tab=resources')}
                className="w-full flex items-center justify-center space-x-2 bg-black text-white px-4 py-3 rounded-md hover:bg-gray-800"
              >
                <Plus className="w-5 h-5" />
                <span>Add Resource</span>
              </button>
              <button
                onClick={() => navigate('/create-contest')}
                className="w-full flex items-center justify-center space-x-2 border border-gray-300 px-4 py-3 rounded-md hover:bg-gray-50"
              >
                <Trophy className="w-5 h-5" />
                <span>Create Contest</span>
              </button>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'moderators' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black">Moderators</h2>
              <button
                onClick={() => setShowCreateModerator(true)}
                className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
              >
                <Plus className="w-4 h-4" />
                <span>Create Moderator</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tests Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {moderators.map((moderator, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{moderator.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{moderator.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          moderator.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {moderator.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>{moderator.testsCreated}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">
                          {moderator.lastActive ? new Date(moderator.lastActive).toLocaleDateString() : 'Never'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => handleDeleteModerator(moderator.id)} 
                          className="text-gray-600 hover:text-red-600 transition-colors"
                          title="Delete moderator"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'users' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">User Analytics</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.filter(u => u.role === 'user').map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{u.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{u.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.score !== null ? (
                        <span className={`px-2 py-1 text-xs rounded ${
                            u.score >= 85 ? 'bg-green-100 text-green-800' :
                            u.score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                            {u.score}%
                        </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
        )}

        {selectedTab === 'resources' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black mb-4">Resource Management</h2>
              
              {/* Add Resource Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center justify-center space-x-2 bg-black text-white px-6 py-4 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Question</span>
                </button>
                
                <button
                  onClick={() => setShowPdfForm(true)}
                  className="flex items-center justify-center space-x-2 bg-black text-white px-6 py-4 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <span>Add PDF</span>
                </button>
                
                <button
                  onClick={() => setShowVideoForm(true)}
                  className="flex items-center justify-center space-x-2 bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Video className="w-5 h-5" />
                  <span>Add Video</span>
                </button>
              </div>

              {/* Bulk Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Excel Card */}
                <form className="bg-gray-50 border border-gray-200 rounded-lg p-4" onSubmit={handleExcelUpload}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Questions (Excel)</label>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <input type="file" accept=".xlsx, .xls" ref={fileInputRef} className="border rounded px-3 py-2 w-full sm:w-auto" />
                    <button type="submit" className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 border border-black">Upload</button>
                  </div>
                  {excelUploadStatus && <p className="mt-2 text-sm text-gray-600">{excelUploadStatus}</p>}
                </form>

                {/* JSON Card */}
                <form className="bg-gray-50 border border-gray-200 rounded-lg p-4" onSubmit={handleJsonUpload}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Questions (JSON)</label>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <input type="file" accept=".json" ref={jsonFileInputRef} className="border rounded px-3 py-2 w-full sm:w-auto" />
                    <button type="submit" className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 border border-black">Upload</button>
                  </div>
                  {jsonUploadStatus && <p className="mt-2 text-sm text-gray-600">{jsonUploadStatus}</p>}
                </form>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border rounded overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="py-2 px-3">Question</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Subcategory</th>
                    <th className="py-2 px-3">Level</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentPageData(allQuestions).map((q, index) => {
                    const actualIndex = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <tr key={q.id} className="border-b hover:bg-gray-50 transition">
                        <td className="py-2 px-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">{actualIndex}</span>
                            </div>
                            <div>{q.question}</div>
                          </div>
                        </td>
                        <td className="py-2 px-3">{q.category}</td>
                        <td className="py-2 px-3">{q.subcategory}</td>
                        <td className="py-2 px-3">{q.level}</td>
                        <td className="py-2 px-3 flex gap-2">
                          <button onClick={() => handleEditQuestion(q)} className="text-gray-600 hover:text-black mr-3">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteQuestion(q.id)} className="text-gray-600 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination for Resources */}
            {getTotalPages(allQuestions) > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {getCurrentPageData(allQuestions).length} of {allQuestions.length} questions
                    {getTotalPages(allQuestions) > 1 && (
                      <span> (Page {currentPage} of {getTotalPages(allQuestions)})</span>
                    )}
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={getTotalPages(allQuestions)}
                    onPageChange={handlePageChange}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'contests' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <h2 className="text-xl font-semibold text-black">All Contests</h2>
              <div className="flex flex-wrap gap-2 items-center">
                <label className="text-sm">Sort by:</label>
                <select value={contestSort.field} onChange={e => setContestSort(s => ({ ...s, field: e.target.value }))} className="border rounded px-2 py-1">
                  <option value="startTime">Start Time</option>
                  <option value="endTime">End Time</option>
                </select>
                <select value={contestSort.order} onChange={e => setContestSort(s => ({ ...s, order: e.target.value }))} className="border rounded px-2 py-1">
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
                <label className="text-sm ml-2">Status:</label>
                <select value={contestStatus} onChange={e => setContestStatus(e.target.value)} className="border rounded px-2 py-1">
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                </select>
                <label className="text-sm ml-2">Requires Code:</label>
                <select value={contestCodeFilter} onChange={e => setContestCodeFilter(e.target.value)} className="border rounded px-2 py-1">
                  <option value="all">All</option>
                  <option value="with">With Code</option>
                  <option value="without">Without Code</option>
                </select>
                <button
                  onClick={() => navigate('/create-contest')}
                  className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Contest</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border rounded overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Start Time</th>
                    <th className="py-2 px-3">End Time</th>
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Created By</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContests.map(contest => (
                    <tr key={contest.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-2 px-3 font-semibold">{contest.title}</td>
                      <td className="py-2 px-3">{new Date(contest.startTime).toLocaleString()}</td>
                      <td className="py-2 px-3">{new Date(contest.endTime).toLocaleString()}</td>
                      <td className="py-2 px-3 font-mono text-blue-700">{contest.requiresCode ? contest.contestCode : '-'}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          getContestStatus(contest) === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          getContestStatus(contest) === 'live' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getContestStatus(contest).charAt(0).toUpperCase() + getContestStatus(contest).slice(1)}
                        </span>
                      </td>
                      <td className="py-2 px-3">{contest.creator?.fullName || 'Unknown'}</td>
                      <td className="py-2 px-3">
                        <div className="flex space-x-2">
                          <button
                            className="px-3 py-1 bg-black text-white rounded hover:bg-gray-800 text-sm font-semibold"
                            onClick={() => handleViewContestQuestions(contest)}
                          >
                            View
                          </button>
                          {getContestStatus(contest) === 'upcoming' && (
                            <button
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
                              onClick={() => navigate(`/edit-contest/${contest.id}`)}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'results' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Contest Results</h2>
            </div>
            <div className="p-0">
              <AdminResults user={user} embedded />
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-sm border border-gray-200 p-6 w-full max-w-md relative animate-fadeIn" style={{maxHeight:'95vh',overflow:'auto'}}>
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-6 text-black-800 text-center">Create New Question</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select name="category" value={form.category} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                      <option value="Aptitude">Aptitude</option>
                      <option value="Technical">Technical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Subcategory</label>
                    <input name="subcategory" value={form.subcategory} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Subcategory" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Level</label>
                    <select name="level" value={form.level} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mt-2">
                  <label className="block text-base font-semibold text-gray-700 mb-2">Question</label>
                  <input name="question" value={form.question} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-400" placeholder="Question" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option A</label>
                      <input name="a" value={form.options.a} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Option A" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option B</label>
                      <input name="b" value={form.options.b} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Option B" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option C</label>
                      <input name="c" value={form.options.c} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Option C" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option D</label>
                      <input name="d" value={form.options.d} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Option D" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer (a/b/c/d)</label>
                    <input name="correctAns" value={form.correctAns} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Correct Answer (a/b/c/d)" />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                    <input name="explanation" value={form.explanation} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Explanation" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 px-4 py-2 bg-black text-white rounded-sm font-bold hover:bg-gray-800">Add</button>
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-sm font-bold">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Form for CREATE CONTEST */}
        {showContestForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-sm border border-gray-200 p-6 w-full max-w-2xl relative animate-fadeIn" style={{maxHeight:'95vh',overflow:'auto'}}>
              <button
                onClick={() => setShowContestForm(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-6 text-black-800 text-center">Add New Contest</h2>
              <form onSubmit={handleContestSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                    <input name="name" value={contestForm.name} onChange={handleContestChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Contest Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                    <select name="type" value={contestForm.type} onChange={handleContestChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                      <option value="DSA">DSA</option>
                      <option value="Technical">Technical</option>
                      <option value="Aptitude">Aptitude</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Questions</label>
                    <input name="numberOfQuestions" value={contestForm.numberOfQuestions} onChange={handleContestChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" type="number" min="1" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                    <input name="startDate" value={contestForm.startDate} onChange={handleContestChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" type="date" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                    <div className="flex gap-2">
                      <select name="startTime" value={contestForm.startTime} onChange={handleContestChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                        {Array.from({length: 48}).map((_,i) => {
                          const h = ((Math.floor(i/4)+11)%12+1);
                          const m = (i%4)*15;
                          const label = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
                          return <option key={label} value={label}>{label}</option>;
                        })}
                      </select>
                      <select name="startAMPM" value={contestForm.startAMPM} onChange={handleContestChange} className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                    <input name="endDate" value={contestForm.endDate} onChange={handleContestChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" type="date" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
                    <div className="flex gap-2">
                      <select name="endTime" value={contestForm.endTime} onChange={handleContestChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                        {Array.from({length: 48}).map((_,i) => {
                          const h = ((Math.floor(i/4)+11)%12+1);
                          const m = (i%4)*15;
                          const label = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
                          return <option key={label} value={label}>{label}</option>;
                        })}
                      </select>
                      <select name="endAMPM" value={contestForm.endAMPM} onChange={handleContestChange} className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700 text-lg">Question {currentQuestionIdx + 1} of {contestForm.numberOfQuestions}</h3>
                    <div className="flex gap-2">
                      <button type="button" disabled={currentQuestionIdx === 0} onClick={() => setCurrentQuestionIdx(i => i - 1)} className="px-4 py-2 bg-gray-200 rounded-lg font-semibold disabled:opacity-50">Prev</button>
                      <button type="button" disabled={currentQuestionIdx === contestForm.numberOfQuestions - 1} onClick={() => setCurrentQuestionIdx(i => i + 1)} className="px-4 py-2 bg-gray-200 rounded-lg font-semibold disabled:opacity-50">Next</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-base font-semibold text-gray-700 mb-2">Question</label>
                      <input name="question" value={contestForm.questions[currentQuestionIdx].question} onChange={handleContestQuestionChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 mb-2" placeholder="Question" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option A</label>
                      <input name="a" value={contestForm.questions[currentQuestionIdx].options.a} onChange={handleContestQuestionChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Option A" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option B</label>
                      <input name="b" value={contestForm.questions[currentQuestionIdx].options.b} onChange={handleContestQuestionChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Option B" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option C</label>
                      <input name="c" value={contestForm.questions[currentQuestionIdx].options.c} onChange={handleContestQuestionChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Option C" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option D</label>
                      <input name="d" value={contestForm.questions[currentQuestionIdx].options.d} onChange={handleContestQuestionChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Option D" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                      <input name="subcategory" value={contestForm.questions[currentQuestionIdx].subcategory || ''} onChange={handleContestQuestionChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 mb-2" placeholder="Subcategory" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                      <select name="level" value={contestForm.questions[currentQuestionIdx].level || ''} onChange={handleContestQuestionChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 mb-2">
                        <option value="">Select Level</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer (a/b/c/d)</label>
                      <input name="correctAns" value={contestForm.questions[currentQuestionIdx].correctAns} onChange={handleContestQuestionChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Correct Answer (a/b/c/d)" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                      <input name="explanation" value={contestForm.questions[currentQuestionIdx].explanation} onChange={handleContestQuestionChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Explanation" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 px-4 py-2 bg-black text-white rounded-sm font-bold hover:bg-gray-800">Add</button>
                  <button type="button" onClick={() => setShowContestForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-sm font-bold">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Form for Edit Question */}
        {editModalOpen && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-sm border border-gray-200 p-6 w-full max-w-md relative animate-fadeIn" style={{maxHeight:'95vh',overflow:'auto'}}>
              <button
                onClick={() => setEditModalOpen(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-6 text-black-800 text-center">Edit Question</h2>
              <form onSubmit={handleEditFormSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select name="category" value={editForm.category} onChange={handleEditFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                      <option value="Aptitude">Aptitude</option>
                      <option value="Technical">Technical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Subcategory</label>
                    <input name="subcategory" value={editForm.subcategory} onChange={handleEditFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Subcategory" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Level</label>
                    <select name="level" value={editForm.level} onChange={handleEditFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mt-2">
                  <label className="block text-base font-semibold text-gray-700 mb-2">Question</label>
                  <input name="question" value={editForm.question} onChange={handleEditFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-400" placeholder="Question" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option A</label>
                      <input name="a" value={editForm.options.a} onChange={handleEditFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Option A" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option B</label>
                      <input name="b" value={editForm.options.b} onChange={handleEditFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Option B" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option C</label>
                      <input name="c" value={editForm.options.c} onChange={handleEditFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Option C" />
                    </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option D</label>
                      <input name="d" value={editForm.options.d} onChange={handleEditFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Option D" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer (a/b/c/d)</label>
                    <input name="correctAns" value={editForm.correctAns} onChange={handleEditFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Correct Answer (a/b/c/d)" />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                    <input name="explanation" value={editForm.explanation} onChange={handleEditFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Explanation" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 px-4 py-2 bg-black text-white rounded-sm font-bold hover:bg-gray-800">Save</button>
                  <button type="button" onClick={() => setEditModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-sm font-bold">Cancel</button>
              </div>
              </form>
            </div>
          </div>
        )}

        {/* selectedTab === 'results' && (
          <div className="bg-white rounded-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">User Results & Analytics</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userActivities.map((activity, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{typeof activity.user === 'object' ? (activity.user?.fullName || activity.user?.email || 'User') : activity.user}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{activity.action}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          activity.score !== null ? (activity.score >= 85 ? 'bg-green-100 text-green-800' :
                          activity.score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800') : 'bg-gray-100 text-gray-800'}`}>
                          {activity.score !== null ? `${activity.score}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{activity.timestamp}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{new Date(activity.timestamp).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-gray-600 hover:text-black">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )} */}

      {showCreateModerator && (
        <CreateModeratorForm
          onSubmit={handleCreateModerator}
          onCancel={() => setShowCreateModerator(false)}
        />
        )}
      {/* Contest Questions Modal */}
      {showContestQuestionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4 relative">
            <button
              onClick={() => setShowContestQuestionsModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-6 text-black-800 text-center">Questions in: {selectedContestTitle}</h2>
            {selectedContestQuestions.length > 0 && selectedContestQuestions[0].testSeries && selectedContestQuestions[0].testSeries.requiresCode && (
              <div className="mb-4 text-center">
                <span className="text-sm text-blue-700 font-mono">Contest Code: {selectedContestQuestions[0].testSeries.contestCode}</span>
              </div>
            )}
            {loadingContestQuestions ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : selectedContestQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No questions found for this contest.</div>
            ) : (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                {selectedContestQuestions.map((q, idx) => (
                  <div key={q.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="mb-2 text-sm text-gray-500">Question {idx + 1}</div>
                    <div className="font-semibold text-gray-900 mb-2">{q.question}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                      {['a', 'b', 'c', 'd'].map(opt => (
                        <div key={opt} className={`px-3 py-2 rounded border ${q.correctAns === opt ? 'bg-green-100 border-green-300 font-semibold text-green-800' : 'bg-white border-gray-200'}`}>
                          <span className="font-bold mr-2">{opt.toUpperCase()}.</span> {q.options[opt]}
                          {q.correctAns === opt && <span className="ml-2 text-green-600">✓</span>}
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-700"><span className="font-semibold">Explanation:</span> {q.explanation}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contest Statistics Modal */}
      {showContestStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowContestStatsModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-6 text-black text-center">Detailed Statistics: {selectedContestStats?.contestTitle || 'Contest'}</h2>
            {loadingContestStats ? (
              <div className="text-center py-8 text-gray-500">Loading statistics...</div>
            ) : !selectedContestStats ? (
              <div className="text-center py-8 text-gray-500">No statistics available for this contest.</div>
            ) : (
              <div className="space-y-8">
                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Bar Chart: Question-wise stats */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                    <h3 className="font-semibold text-black mb-4 text-center">Question-wise Attempts</h3>
                    <Bar
                      data={{
                        labels: selectedContestStats.questionStats.map((q, i) => `Q${i + 1}`),
                        datasets: [
                          {
                            label: 'Correct',
                            data: selectedContestStats.questionStats.map(q => q.correctAttempts),
                            backgroundColor: '#22c55e',
                            borderWidth: 1,
                          },
                          {
                            label: 'Incorrect',
                            data: selectedContestStats.questionStats.map(q => q.incorrectAttempts),
                            backgroundColor: '#ef4444',
                            borderWidth: 1,
                          },
                          {
                            label: 'Not Attempted',
                            data: selectedContestStats.questionStats.map(q => q.notAttempted),
                            backgroundColor: '#f59e0b',
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            labels: { color: '#374151', font: { weight: 'bold' } },
                          },
                          title: { display: false },
                        },
                        scales: {
                          x: { ticks: { color: '#374151' }, grid: { color: '#e5e5e5' } },
                          y: { ticks: { color: '#374151' }, grid: { color: '#e5e5e5' } },
                        },
                      }}
                      height={220}
                    />
                  </div>
                  {/* Pie Chart: Overall distribution */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                    <h3 className="font-semibold text-black mb-4 text-center">Overall Answer Distribution</h3>
                    <Pie
                      data={{
                        labels: ['Correct', 'Incorrect', 'Not Attempted'],
                        datasets: [
                          {
                            data: [
                              selectedContestStats.questionStats.reduce((a, q) => a + q.correctAttempts, 0),
                              selectedContestStats.questionStats.reduce((a, q) => a + q.incorrectAttempts, 0),
                              selectedContestStats.questionStats.reduce((a, q) => a + q.notAttempted, 0),
                            ],
                            backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
                            borderColor: ['#fff', '#fff', '#fff'],
                            borderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        plugins: {
                          legend: {
                            labels: { color: '#374151', font: { weight: 'bold' } },
                          },
                        },
                        cutout: '50%', // This makes the pie chart hollow (donut chart)
                      }}
                      height={220}
                    />
                  </div>
                </div>

                {/* Overall Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-black">{selectedContestStats.average?.toFixed(2) || '0'}</div>
                    <div className="text-sm text-gray-700">Average Score</div>
                  </div>
                  <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-black">{selectedContestStats.averagePercentage?.toFixed(1) || '0'}%</div>
                    <div className="text-sm text-gray-700">Average Percentage</div>
                  </div>
                  <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-black">{selectedContestStats.totalParticipants || '0'}</div>
                    <div className="text-sm text-gray-700">Total Participants</div>
                  </div>
                  <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-black">{selectedContestStats.totalQuestions || '0'}</div>
                    <div className="text-sm text-gray-700">Total Questions</div>
                  </div>
                </div>

                {/* Question Highlights - Minimalist Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold text-black mb-2 flex items-center gap-2">
                      <span>Most Correctly Answered</span>
                      <span className="inline-block w-4 h-4 border-2 border-black rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    </h3>
                    {selectedContestStats.mostCorrect ? (
                      <div>
                        <div className="font-medium text-black mb-1">{selectedContestStats.mostCorrect.question}</div>
                        <div className="text-xs text-gray-700">Correct: {selectedContestStats.mostCorrect.correctAttempts} | Total: {selectedContestStats.mostCorrect.totalAttempts}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No data available</div>
                    )}
                  </div>
                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold text-black mb-2 flex items-center gap-2">
                      <span>Most Incorrectly Answered</span>
                      <span className="inline-block w-4 h-4 border-2 border-black rounded-full flex items-center justify-center text-xs font-bold">✗</span>
                    </h3>
                    {selectedContestStats.mostIncorrect ? (
                      <div>
                        <div className="font-medium text-black mb-1">{selectedContestStats.mostIncorrect.question}</div>
                        <div className="text-xs text-gray-700">Incorrect: {selectedContestStats.mostIncorrect.incorrectAttempts} | Total: {selectedContestStats.mostIncorrect.totalAttempts}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No data available</div>
                    )}
                  </div>
                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold text-black mb-2 flex items-center gap-2">
                      <span>Most Attempted</span>
                      <span className="inline-block w-4 h-4 border-2 border-black rounded-full flex items-center justify-center text-xs font-bold">→</span>
                    </h3>
                    {selectedContestStats.mostAttempted ? (
                      <div>
                        <div className="font-medium text-black mb-1">{selectedContestStats.mostAttempted.question}</div>
                        <div className="text-xs text-gray-700">Attempts: {selectedContestStats.mostAttempted.totalAttempts}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No data available</div>
                    )}
                  </div>
                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold text-black mb-2 flex items-center gap-2">
                      <span>Least Attempted</span>
                      <span className="inline-block w-4 h-4 border-2 border-black rounded-full flex items-center justify-center text-xs font-bold">↓</span>
                    </h3>
                    {selectedContestStats.leastAttempted ? (
                      <div>
                        <div className="font-medium text-black mb-1">{selectedContestStats.leastAttempted.question}</div>
                        <div className="text-xs text-gray-700">Attempts: {selectedContestStats.leastAttempted.totalAttempts}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No data available</div>
                    )}
                  </div>
                </div>

                {/* Question-wise Statistics Table */}
                {selectedContestStats.questionStats && selectedContestStats.questionStats.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-black mb-4">Question-wise Performance</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-3 px-4 font-medium text-black">Question</th>
                            <th className="py-3 px-4 font-medium text-black">Correct</th>
                            <th className="py-3 px-4 font-medium text-black">Incorrect</th>
                            <th className="py-3 px-4 font-medium text-black">Not Attempted</th>
                            <th className="py-3 px-4 font-medium text-black">Success Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedContestStats.questionStats.map((q, idx) => (
                            <tr key={q.questionId} className="border-t border-gray-200">
                              <td className="py-3 px-4 max-w-xs truncate" title={q.question}>
                                <span className="font-medium text-black">{q.question}</span>
                              </td>
                              <td className="py-3 px-4 text-black font-medium">{q.correctAttempts}</td>
                              <td className="py-3 px-4 text-black font-medium">{q.incorrectAttempts}</td>
                              <td className="py-3 px-4 text-black font-medium">{q.notAttempted}</td>
                              <td className="py-3 px-4 font-medium text-black">
                                {q.totalAttempts > 0 ? `${((q.correctAttempts / q.totalAttempts) * 100).toFixed(1)}%` : '0%'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF Form Modal */}
      {showPdfForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add PDF Resource</h2>
              <button
                onClick={() => setShowPdfForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handlePdfSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={pdfForm.title}
                  onChange={handlePdfChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={pdfForm.description}
                  onChange={handlePdfChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    name="category"
                    value={pdfForm.category}
                    onChange={handlePdfChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="Aptitude">Aptitude</option>
                    <option value="Technical">Technical</option>
                    <option value="Logical">Logical</option>
                    <option value="Verbal">Verbal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    name="level"
                    value={pdfForm.level}
                    onChange={handlePdfChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                <input
                  type="text"
                  name="subcategory"
                  value={pdfForm.subcategory}
                  onChange={handlePdfChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF File *</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfFileChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPdfForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Add PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Form Modal */}
      {showVideoForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Video Resource</h2>
              <button
                onClick={() => setShowVideoForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleVideoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={videoForm.title}
                  onChange={handleVideoChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={videoForm.description}
                  onChange={handleVideoChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    name="category"
                    value={videoForm.category}
                    onChange={handleVideoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="Aptitude">Aptitude</option>
                    <option value="Technical">Technical</option>
                    <option value="Logical">Logical</option>
                    <option value="Verbal">Verbal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    name="level"
                    value={videoForm.level}
                    onChange={handleVideoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                <input
                  type="text"
                  name="subcategory"
                  value={videoForm.subcategory}
                  onChange={handleVideoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL *</label>
                <input
                  type="url"
                  name="videoUrl"
                  value={videoForm.videoUrl}
                  onChange={handleVideoChange}
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVideoForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Add Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;