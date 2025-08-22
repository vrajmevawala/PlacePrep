import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bookmark as BookmarkIcon, BookmarkCheck } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip } from 'recharts';

const Practice = ({ user }) => {
  // Filter state
  const location = useLocation();
  // Read category from query param if present
  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get('category');
  const [category, setCategory] = useState(categoryParam === 'Aptitude' || categoryParam === 'Technical' ? categoryParam : 'Aptitude');
  const [categoryLocked, setCategoryLocked] = useState(categoryParam === 'Aptitude' || categoryParam === 'Technical');
  const [subcategory, setSubcategory] = useState('');
  const [level, setLevel] = useState(''); 
  const [numQuestions, setNumQuestions] = useState(5);
  const [subcategories, setSubcategories] = useState([]);
  // Track bookmarked questions
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  const navigate = useNavigate();
  // Practice state
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]); // {selected, isCorrect, showExplanation}
  const [showExplanation, setShowExplanation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // For practice test
  const [practiceTestId, setPracticeTestId] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Restore test state from localStorage if present
  useEffect(() => {
    const saved = localStorage.getItem('practiceTestState');
    if (saved) {
      const state = JSON.parse(saved);
      setQuestions(state.questions || []);
      setCurrentQ(state.currentQ || 0);
      setUserAnswers(state.userAnswers || []);
      setShowExplanation(state.showExplanation || []);
      setPracticeTestId(state.practiceTestId || null);
      setSubmitted(state.submitted || false);
    }
  }, []);

  // Persist test state to localStorage
  useEffect(() => {
    if (questions.length > 0 && !submitted) {
      localStorage.setItem('practiceTestState', JSON.stringify({
        questions,
        currentQ,
        userAnswers,
        showExplanation,
        practiceTestId,
        submitted
      }));
    } else if (submitted) {
      localStorage.removeItem('practiceTestState');
    }
  }, [questions, currentQ, userAnswers, showExplanation, practiceTestId, submitted]);

  // Lock category select if param is present
  useEffect(() => {
    if (categoryParam === 'Aptitude' || categoryParam === 'Technical') {
      setCategory(categoryParam);
      setCategoryLocked(true);
    } else {
      setCategoryLocked(false);
    }
  }, [categoryParam]);

  // Fetch subcategories from backend when category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const res = await fetch(`/api/questions/subcategories?category=${category}`);
        const data = await res.json();
        if (res.ok && data.subcategories && data.subcategories.length) {
          setSubcategories(data.subcategories);
          setSubcategory(data.subcategories.includes('All') ? 'All' : data.subcategories[0]);
        } else {
          setSubcategories([]);
          setSubcategory('');
        }
      } catch {
        setSubcategories([]);
        setSubcategory('');
      }
    };
    fetchSubcategories();
  }, [category]);

  // Fetch bookmarked questions on mount
  useEffect(() => {
    fetch('/api/questions/bookmarks', { credentials: 'include' })
      .then(res => res.ok ? res.json() : { bookmarks: [] })
      .then(data => setBookmarkedIds((data.bookmarks || []).map(bm => bm.questionId)));
  }, []);

  // Start practice handler
  const startPractice = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setUserAnswers([]);
    setShowExplanation([]);
    setCurrentQ(0);
    setPracticeTestId(null);
    setSubmitted(false);
    try {
      // Practice Test mode: random n questions
      const body = { category, level, numQuestions };
      if (subcategory && subcategory !== 'All') body.subcategory = subcategory;
      const res = await fetch('/api/free-practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data.questions || !data.questions.length) {
        setError(data.message || 'No questions found.');
        setLoading(false);
        return;
      }
      setQuestions(data.questions);
      setPracticeTestId(data.freePracticeId);
      setUserAnswers(Array(data.questions.length).fill(null));
      setShowExplanation(Array(data.questions.length).fill(false));
      // Save to localStorage
      localStorage.setItem('practiceTestState', JSON.stringify({
        questions: data.questions,
        currentQ: 0,
        userAnswers: Array(data.questions.length).fill(null),
        showExplanation: Array(data.questions.length).fill(false),
        practiceTestId: data.freePracticeId,
        submitted: false
      }));
    } catch (err) {
      setError('Failed to fetch questions.');
    }
    setLoading(false);
  };

  // Option click handler
  const handleOptionClick = (idx, option) => {
    if (userAnswers[idx]) return; // Prevent changing answer
    const isCorrect = questions[idx].correctAns === option;
    const updated = [...userAnswers];
    updated[idx] = { selected: option, isCorrect };
    setUserAnswers(updated);
    // If wrong answer, show explanation automatically
    if (!isCorrect) {
      setShowExplanation(prev => {
        const updatedShow = [...prev];
        updatedShow[idx] = true;
        return updatedShow;
      });
    }
    // Save to localStorage
    localStorage.setItem('practiceTestState', JSON.stringify({
      questions,
      currentQ,
      userAnswers: updated,
      showExplanation,
      practiceTestId,
      submitted
    }));
  };

  // Show explanation handler
  const handleShowExplanation = idx => {
    const updated = [...showExplanation];
    updated[idx] = true;
    setShowExplanation(updated);
  };

  // Submit handler for practice test
  const handleSubmitTest = async () => {
    if (!practiceTestId) return;
    setLoading(true);
    setError(null);
    try {
      const answers = questions.map((q, i) => ({ questionId: q.id, selectedOption: userAnswers[i]?.selected || '' }));
      const res = await fetch(`/api/free-practice/${practiceTestId}/practice-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || 'Submission failed.');
      else {
        setSubmitted(true);
        localStorage.removeItem('practiceTestState');
      }
    } catch {
      setError('Submission failed.');
    }
    setLoading(false);
  };

  // Bookmark handler - toggle bookmark
  const handleBookmark = async (questionId) => {
    try {
      const isBookmarked = bookmarkedIds.includes(questionId);
      const endpoint = isBookmarked ? '/api/questions/bookmarks/remove' : '/api/questions/bookmarks';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questionId })
      });
      
      if (res.ok) {
        setBookmarkedIds(prev => {
          if (isBookmarked) {
            return prev.filter(id => id !== questionId);
          } else {
            return [...prev, questionId];
          }
        });
      } else {
        const errorData = await res.json();
        console.error('Bookmark error:', errorData.message);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };



  // Navigation
  const goNext = () => setCurrentQ(q => Math.min(q + 1, questions.length - 1));
  const goPrev = () => setCurrentQ(q => Math.max(q - 1, 0));

  // Add this style at the top of the file or in a <style> tag in the component
  const selectNoArrow = {
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: 'none',
  };

  // Render
  return (
    <div className="flex flex-col items-center min-h-[60vh] w-full bg-gray-50 py-12">
      <h1 className="text-4xl font-extrabold mb-6 text-black drop-shadow tracking-tight text-center">Practice</h1>
      <div className={`flex w-full ${questions.length > 0 && !submitted ? 'max-w-6xl gap-8' : 'justify-center items-center'}`}>
        {!submitted && questions.length === 0 && (
          <div className="bg-white rounded shadow p-8 border border-gray-200 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center text-black">Create Your Practice Test</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="px-3 py-2 border rounded w-full"
                  disabled={categoryLocked || questions.length > 0}
                  style={categoryLocked || questions.length > 0 ? selectNoArrow : {}}
                >
                  <option value="Aptitude">Aptitude</option>
                  <option value="Technical">Technical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Subcategory</label>
                <select
                  value={subcategory}
                  onChange={e => setSubcategory(e.target.value)}
                  className="px-3 py-2 border rounded w-full"
                  disabled={subcategories.length === 0 || questions.length > 0}
                >
                  {subcategories.length === 0 ? (
                    <option value="">No subcategories found</option>
                  ) : (
                    subcategories.map(sub => <option key={sub} value={sub}>{sub === 'All' ? 'All (All Subcategories)' : sub}</option>)
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)} className="px-3 py-2 border rounded w-full" disabled={questions.length > 0}>
                  <option value="">No Filter</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Number of Questions</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={numQuestions}
                  onChange={e => setNumQuestions(Number(e.target.value))}
                  className="px-3 py-2 border rounded w-full"
                  disabled={questions.length > 0}
                />
              </div>
            </div>
            <button
              onClick={startPractice}
              className="w-full mt-2 px-6 py-2 bg-black text-white font-bold rounded border border-black hover:bg-gray-900"
              disabled={!subcategory}
            >
              Start Practice Test
            </button>
            {error && <div className="text-red-600 mt-2 text-center">{error}</div>}
          </div>
        )}
        {!submitted && questions.length > 0 && (
          <>
            <div className="bg-white rounded shadow p-6 border border-gray-200 w-full max-w-xs flex-shrink-0 h-fit sticky top-24 flex flex-col gap-4" style={{ minWidth: 250 }}>
              <h3 className="text-lg font-bold mb-2 text-black">Filters</h3>
              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="px-3 py-2 border rounded w-full"
                  disabled={categoryLocked || questions.length > 0}
                  style={categoryLocked || questions.length > 0 ? selectNoArrow : {}}
                >
                  <option value="Aptitude">Aptitude</option>
                  <option value="Technical">Technical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Subcategory</label>
                <select
                  value={subcategory}
                  onChange={e => setSubcategory(e.target.value)}
                  className="px-3 py-2 border rounded w-full"
                  disabled={subcategories.length === 0 || questions.length > 0}
                >
                  {subcategories.length === 0 ? (
                    <option value="">No subcategories found</option>
                  ) : (
                    subcategories.map(sub => <option key={sub} value={sub}>{sub === 'All' ? 'All (All Subcategories)' : sub}</option>)
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)} className="px-3 py-2 border rounded w-full" disabled={questions.length > 0}>
                  <option value="">No Filter</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Number of Questions</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={numQuestions}
                  onChange={e => setNumQuestions(Number(e.target.value))}
                  className="px-3 py-2 border rounded w-full"
                  disabled={questions.length > 0}
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              {loading && <div className="text-lg">Loading questions...</div>}
              {!loading && questions.length > 0 && (
                <div className="w-full max-w-xl bg-white rounded-sm shadow p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-semibold text-black">Question {currentQ + 1} of {questions.length}</div>
                    <div className="flex items-center space-x-2">
                      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">
                        {questions[currentQ].level?.charAt(0).toUpperCase() + questions[currentQ].level?.slice(1) || 'Medium'}
                      </div>
                      <button
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        title={bookmarkedIds.includes(questions[currentQ].id) ? 'Remove from bookmarks' : 'Add to bookmarks'}
                        onClick={() => handleBookmark(questions[currentQ].id)}
                      >
                        {bookmarkedIds.includes(questions[currentQ].id)
                          ? <BookmarkCheck className="w-5 h-5 text-yellow-500" />
                          : <BookmarkIcon className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="mb-4 text-lg text-black font-medium">{questions[currentQ].question}</div>
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {Object.entries(questions[currentQ].options).map(([key, val]) => {
                      const userAns = userAnswers[currentQ];
                      const isSelected = userAns && userAns.selected === key;
                      const isCorrect = questions[currentQ].correctAns === key;
                      let btnClass = 'border-gray-300 bg-white';
                      if (userAns) {
                        if (isSelected && isCorrect) btnClass = 'border-green-600 bg-green-50 text-green-800';
                        else if (isSelected && !isCorrect) btnClass = 'border-red-600 bg-red-50 text-red-800';
                        else if (!isSelected && isCorrect) btnClass = 'border-green-600 bg-green-50 text-green-800';
                      }
                      return (
                        <button
                          key={key}
                          className={`w-full text-left px-4 py-2 rounded border font-medium transition ${btnClass}`}
                          disabled={!!userAns}
                          onClick={() => handleOptionClick(currentQ, key)}
                        >
                          {key.toUpperCase()}. {val}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Show Explanation Button - only visible after answering */}
                  {userAnswers[currentQ] && (
                    <div className="mb-4">
                      <button
                        className="text-black underline text-sm hover:text-gray-700 transition-colors"
                        onClick={() => handleShowExplanation(currentQ)}
                      >
                        {showExplanation[currentQ] ? 'Hide Explanation' : 'See Explanation'}
                      </button>
                      {showExplanation[currentQ] && (
                        <div className="bg-black text-white p-4 mt-2 rounded">
                          <div className="font-semibold mb-1">Explanation:</div>
                          <div className="mb-1">
                            Correct Option: <span className="font-bold text-green-400">{questions[currentQ].correctAns?.toUpperCase()}</span>
                          </div>
                          <div>{questions[currentQ].explanation || 'No explanation available for this question.'}</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mb-4">
                    <button onClick={goPrev} disabled={currentQ === 0} className="px-4 py-2 bg-gray-200 rounded font-semibold disabled:opacity-50 hover:bg-gray-300 transition-colors">Prev</button>
                    <button onClick={goNext} disabled={currentQ === questions.length - 1} className="px-4 py-2 bg-gray-200 rounded font-semibold disabled:opacity-50 hover:bg-gray-300 transition-colors">Next</button>
                  </div>
                  {currentQ === questions.length - 1 && (
                    <button
                      className="w-full px-6 py-3 bg-black hover:bg-gray-900 text-white rounded font-bold mt-4"
                      onClick={handleSubmitTest}
                      disabled={loading}
                    >
                      Submit Practice Test
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        {submitted && (() => {
          const total = userAnswers.length;
          const correct = userAnswers.filter(ans => ans && ans.isCorrect).length;
          const incorrect = userAnswers.filter(ans => ans && !ans.isCorrect).length;
          const pieData = [
            { name: 'Correct', value: correct, color: '#22c55e' },
            { name: 'Incorrect', value: incorrect, color: '#ef4444' },
          ];
          const handleNewTest = () => {
            setQuestions([]);
            setCurrentQ(0);
            setUserAnswers([]);
            setShowExplanation([]);
            setPracticeTestId(null);
            setSubmitted(false);
            localStorage.removeItem('practiceTestState');
          };
          return (
            <div className="w-full max-w-3xl bg-white rounded-sm shadow p-8 border border-gray-200 flex flex-col md:flex-row gap-8 items-center justify-center">
              {/* Pie chart on left */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full flex flex-col items-center justify-center">
                  <PieChart width={300} height={220} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                  <div className="mt-4">
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                    <div className="flex gap-6 justify-center mt-2">
                      <span className="flex items-center"><span className="w-4 h-4 bg-green-500 inline-block mr-2 rounded"></span>Correct</span>
                      <span className="flex items-center"><span className="w-4 h-4 bg-red-500 inline-block mr-2 rounded"></span>Incorrect</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Result summary on right */}
              <div className="flex-1 flex flex-col items-center justify-center w-full">
                <h2 className="text-2xl font-bold mb-4 text-black">Practice Test Submitted!</h2>
                <div className="text-lg mb-4">Your answers have been recorded.</div>
                <div className="text-lg font-semibold mb-2">Result Summary</div>
                <div className="flex gap-8 items-center mb-6">
                  <div>
                    <div className="text-green-600 font-bold text-xl">{correct}</div>
                    <div className="text-sm">Correct</div>
                  </div>
                  <div>
                    <div className="text-red-600 font-bold text-xl">{incorrect}</div>
                    <div className="text-sm">Incorrect</div>
                  </div>
                </div>
                <div className="flex justify-center w-full">
                  <button
                    className="px-8 py-3 bg-black hover:bg-gray-900 text-white rounded font-bold text-lg mt-4"
                    onClick={handleNewTest}
                  >
                    Create New Test
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Practice; 