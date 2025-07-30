import React, { useState, useEffect, useRef } from 'react';
import { Users, Activity, BarChart3, Eye, Plus, Trophy, FileText, Tag, Edit, Trash2, Video, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const ModeratorDashboard = ({ user }) => {
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState('overview');
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
  const [allContests, setAllContests] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [subcategoryQuestions, setSubcategoryQuestions] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [userResults, setUserResults] = useState([]);

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

  // Fetch all contests
  useEffect(() => {
    if (selectedTab === 'contests') {
      fetch('/api/testseries', { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch contests');
          return res.json();
        })
        .then(data => setAllContests(data.testSeries || []))
        .catch(error => {
          console.error('Error fetching contests:', error);
          setAllContests([]);
        });
    }
  }, [selectedTab]);

  // Fetch all questions
  useEffect(() => {
    if (selectedTab === 'resources' || selectedTab === 'tags') {
      fetch('/api/questions', { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch questions');
          return res.json();
        })
        .then(data => setAllQuestions(data.questions || []))
        .catch(error => {
          console.error('Error fetching questions:', error);
          setAllQuestions([]);
        });
    }
  }, [selectedTab]);

  // Fetch all users
  useEffect(() => {
    if (selectedTab === 'users') {
      fetch('/api/auth/users', { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch users');
          return res.json();
        })
        .then(data => setAllUsers(data.users || []))
        .catch(error => {
          console.error('Error fetching users:', error);
          setAllUsers([]);
        });
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

  // Fetch user results/activity logs for overview
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
  }, [selectedTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && tab !== selectedTab) {
      setSelectedTab(tab);
    }
    // eslint-disable-next-line
  }, [location.search]);

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
    try {
      const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form)
    });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create question');
      }
      
    setShowForm(false);
      // Reset form
      setForm({
        category: 'Aptitude',
        subcategory: '',
        level: 'easy',
        question: '',
        options: { a: '', b: '', c: '', d: '' },
        correctAns: '',
        explanation: ''
      });
      
      // Refresh questions list
      const refreshRes = await fetch('/api/questions', { credentials: 'include' });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setAllQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error creating question:', error);
      alert(error.message || 'Failed to create question');
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
    for (const q of contestForm.questions) {
      if (!q.question || !q.options.a || !q.options.b || !q.options.c || !q.options.d || !q.correctAns || !q.explanation || !q.subcategory || !q.level) {
        alert('Please fill all fields (including subcategory and level) for every question in the contest.');
        return;
      }
    }
    const startDateTime = `${contestForm.startDate} ${contestForm.startTime} ${contestForm.startAMPM}`;
    const endDateTime = `${contestForm.endDate} ${contestForm.endTime} ${contestForm.endAMPM}`;
    try {
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
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create a question');
      }
        if (!data.question || !data.question.id) {
        throw new Error('Failed to create a question - no ID returned');
        }
        questionIds.push(data.question.id);
      }
    
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
    
    if (!contestRes.ok) {
      const errorData = await contestRes.json();
      throw new Error(errorData.message || 'Failed to create contest');
    }
    
        alert('Contest created successfully!');
        setShowContestForm(false);
    
    // Reset form
    setContestForm({
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
    
    // Refresh contests list
    const refreshRes = await fetch('/api/testseries', { credentials: 'include' });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setAllContests(data.testSeries || []);
      }
    } catch (err) {
    console.error('Error creating contest:', err);
    alert(err.message || 'An error occurred while creating the contest.');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!res.ok) {
      const data = await res.json();
        throw new Error(data.message || 'Failed to delete question');
      }
      
        setAllQuestions(qs => qs.filter(q => q.id !== id));
        alert('Question deleted successfully.');
    } catch (err) {
      console.error('Error deleting question:', err);
      alert(err.message || 'Failed to delete question.');
    }
  };

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
      
      if (!res.ok) {
      const data = await res.json();
        throw new Error(data.message || 'Failed to update question');
      }
      
      const data = await res.json();
        setAllQuestions(qs => qs.map(q => q.id === editForm.id ? data.question : q));
        setEditModalOpen(false);
        alert('Question updated successfully.');
    } catch (err) {
      console.error('Error updating question:', err);
      alert(err.message || 'Failed to update question.');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'User Analytics' },
    { id: 'resources', label: 'Resources' },
    { id: 'contests', label: 'Contests' },
    { id: 'results', label: 'Results' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Moderator Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage questions, contests, and view user analytics</p>
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
            <div className="bg-white rounded-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {userResults.length === 0 ? (
                  <div className="p-6 text-gray-400">No recent activity.</div>
                ) : (
                  userResults.slice(0, 3).map((result, index) => (
                    <div key={index} className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{result.user}</p>
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
            <div className="bg-white rounded-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full flex items-center justify-center space-x-2 bg-black text-white px-4 py-3 rounded-sm hover:bg-gray-800"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Question</span>
                </button>
                <button
                  onClick={() => setShowContestForm(true)}
                  className="w-full flex items-center justify-center space-x-2 border border-gray-300 px-4 py-3 rounded-sm hover:bg-gray-50"
                >
                  <Trophy className="w-5 h-5" />
                  <span>Create Contest</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {selectedTab === 'users' && (
          <div className="bg-white rounded-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">User Analytics</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
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
          <div className="bg-white rounded-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Resource Management</h2>
              
              {/* Add Resource Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                  {allQuestions.map(q => (
                    <tr key={q.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-2 px-3">{q.question}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {selectedTab === 'contests' && (
          <div className="bg-white rounded-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">All Contests</h2>
              <button
                onClick={() => setShowContestForm(true)}
                className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-sm hover:bg-gray-800"
              >
                <Plus className="w-4 h-4" />
                <span>Create Contest</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border rounded overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Start Time</th>
                    <th className="py-2 px-3">End Time</th>
                    <th className="py-2 px-3">Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {allContests.map(contest => (
                    <tr key={contest.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-2 px-3 font-semibold">{contest.title}</td>
                      <td className="py-2 px-3">{new Date(contest.startTime).toLocaleString()}</td>
                      <td className="py-2 px-3">{new Date(contest.endTime).toLocaleString()}</td>
                      <td className="py-2 px-3">{contest.creator?.fullName || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {selectedTab === 'results' && (
          <div className="bg-white rounded-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold mb-4">User Results</h2>
              <table className="min-w-full bg-white rounded shadow overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="py-2 px-4">User</th>
                    <th className="py-2 px-4">Test</th>
                    <th className="py-2 px-4">Score</th>
                    <th className="py-2 px-4">Time</th>
                    <th className="py-2 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {userResults.map((r, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2 px-4">{r.user}</td>
                      <td className="py-2 px-4">{r.test}</td>
                      <td className="py-2 px-4">{r.score}</td>
                      <td className="py-2 px-4">{r.time}</td>
                      <td className="py-2 px-4">{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Modals for create question/contest */}
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

export default ModeratorDashboard; 