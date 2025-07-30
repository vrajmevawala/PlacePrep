import { BookmarkCheck } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const Bookmark = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [category, setCategory] = useState('Aptitude');
  const [subcategory, setSubcategory] = useState('');
  const [level, setLevel] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [showExplanation, setShowExplanation] = useState({});

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

  useEffect(() => {
    fetch('/api/questions/bookmarks', { credentials: 'include' })
      .then(res => res.ok ? res.json() : { bookmarks: [] })
      .then(data => setBookmarks(data.bookmarks || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (subcategory && subcategory !== 'All') params.append('subcategory', subcategory);
      if (level) params.append('level', level);
      const res = await fetch(`/api/questions/bookmarks?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch bookmarks');
      const data = await res.json();
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (bm) => {
    try {
      const res = await fetch('/api/questions/bookmarks/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questionId: bm.questionId })
      });
      if (!res.ok) throw new Error('Failed to remove bookmark');
      setBookmarks(prev => prev.filter(b => b.id !== bm.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShowExplanation = (id) => {
    setShowExplanation(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] py-12 bg-gray-50">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] py-12 bg-gray-50">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <h1 className="text-4xl font-extrabold text-center text-black drop-shadow mb-10">Bookmarks</h1>

      <div className="flex flex-col lg:flex-row gap-10 justify-center">
        {/* Filter Panel */}
        <div className="bg-white shadow border border-gray-200 rounded-sm p-6 w-full max-w-sm sticky top-24 self-start">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded"
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
                className="w-full px-3 py-2 border rounded"
                disabled={subcategories.length === 0}
              >
                {subcategories.length === 0 ? (
                  <option value="">No subcategories found</option>
                ) : (
                  subcategories.map(sub => (
                    <option key={sub} value={sub}>
                      {sub === 'All' ? 'All (All Subcategories)' : sub}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Level</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">No Filter</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <button
              onClick={handleSearch}
              className="w-full mt-2 px-6 py-2 bg-black text-white font-bold rounded-sm border border-black hover:bg-gray-900"
              disabled={!subcategory}
            >
              Search Now
            </button>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>
        </div>

        {/* Bookmarked Questions */}
        <div className="flex-1 w-full max-w-3xl">
          {bookmarks.length === 0 ? (
            <p className="text-xl text-gray-500 text-center">No bookmarks yet.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {bookmarks.map((bm, idx) => {
                const q = bm.question;
                return (
                  <div
                    key={bm.id}
                    className="bg-white rounded-sm shadow p-6 border border-gray-200 hover:shadow-xl transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="text-lg font-bold text-black">Q{idx + 1}.</div>
                      <div className="px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-800 rounded-full">
                        {q.level?.charAt(0).toUpperCase() + q.level?.slice(1)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Category: <span className="font-semibold">{q.category}</span> | Subcategory:{' '}
                        <span className="font-semibold">{q.subcategory}</span>
                      </div>
                      <BookmarkCheck
                        className="w-5 h-5 text-yellow-500 cursor-pointer"
                        title="Remove Bookmark"
                        onClick={() => handleRemoveBookmark(bm)}
                      />
                    </div>

                    <div className="mb-4 text-black font-medium text-lg">{q.question}</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                      {Object.entries(q.options).map(([key, val]) => {
                        const isCorrect = q.correctAns === key;
                        const btnClass = isCorrect
                          ? 'border-green-600 bg-green-50 text-green-800'
                          : 'border-gray-300';
                        return (
                          <div
                            key={key}
                            className={`px-4 py-2 rounded border bg-gray-50 font-medium text-left transition ${btnClass}`}
                          >
                            {key.toUpperCase()}. {val}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      className="text-black underline text-sm mb-2"
                      onClick={() => handleShowExplanation(bm.id)}
                    >
                      {showExplanation[bm.id] ? 'Hide Explanation' : 'See Explanation'}
                    </button>
                    {showExplanation[bm.id] && (
                      <div className="bg-black text-white p-4 mt-2 rounded">
                        <div className="font-semibold mb-1">Explanation:</div>
                        <div className="mb-1">Correct Option: <span className="font-bold text-green-700">{q.correctAns?.toUpperCase()}</span></div>
                        <div>{q.explanation}</div>
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      Bookmarked on: {new Date(bm.createdAt).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookmark;
