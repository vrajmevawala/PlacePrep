import React, { useState, useRef, useEffect } from 'react';
import { User, Bell, BookOpen, Target, Trophy, Bookmark, BarChart3, LogOut, Trash2, Check, Bot, AlertTriangle } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import NotificationBell from './NotificationBell.jsx';
import logo from '../../assests/logo.png';

const Navigation = ({ user, onLogout, isContestMode = false, onOpenAuthModal }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPracticeDropdown, setShowPracticeDropdown] = useState(false);
  const practiceDropdownRef = useRef(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);

  const publicNavItems = [
    { name: 'Home', path: '/' },
    { name: 'Why Choose Us', path: '/why-choose-us' },
  ];

  const privateNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: null },
    { name: 'Practice', path: '/practice', icon: Target },
    { name: 'Resource', path: '/resources', icon: BookOpen },
    { name: 'Contest', path: user?.role === 'admin' ? '/admin-contests' : '/contests', icon: Trophy },
    { name: 'Result', path: '/results', icon: BarChart3 },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Bot },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (practiceDropdownRef.current && !practiceDropdownRef.current.contains(event.target)) {
        setShowPracticeDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }
    if (showPracticeDropdown || showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPracticeDropdown, showUserDropdown]);



  const handleNavigationClick = (e, path) => {
    // Allow public pages without login, even from home
    if (!user && location.pathname === '/') {
      if (path === '/why-choose-us') {
        return true;
      }
      e.preventDefault();
      if (typeof onOpenAuthModal === 'function') onOpenAuthModal('login');
      return false;
    }
    if (isContestMode) {
      e.preventDefault();
      alert('Navigation is disabled during contest. Please complete or submit the contest first.');
      return false;
    }
    return true;
  };

  const handleLogout = () => {
    if (isContestMode) {
      alert('Cannot logout during contest. Please complete or submit the contest first.');
      return;
    }
    onLogout();
  };

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side - Logo */}
          <motion.div 
            className="flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              to="/" 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={(e) => handleNavigationClick(e, '/')}
            >
              <img src={logo} alt="PlacePrep Logo" className="w-32 h-auto" />
            </Link>
          </motion.div>

          {/* Center - Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            {!user ? (
              <>
                {publicNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'text-black border-b-2 border-black'
                        : isContestMode 
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:text-black'
                    }`}
                    onClick={(e) => handleNavigationClick(e, item.path)}
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            ) : (
              <>
                {privateNavItems.map((item) => {
                  const Icon = item.icon;
                  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

                  // Map admin nav items to AdminDashboard tabs
                  const getAdminTabForItem = (name) => {
                    switch (name) {
                      case 'Dashboard':
                        return 'overview';
                      case 'Resource':
                        return 'resources';
                      case 'Contest':
                        return 'contests';
                      case 'Result':
                        return 'results';
                      default:
                        return null;
                    }
                  };
                  const adminTab = isAdmin ? getAdminTabForItem(item.name) : null;
                  const adminTabHref = adminTab ? `/dashboard?tab=${adminTab}` : null;
                  const isAdminTabActive = adminTab
                    ? (location.pathname === '/dashboard' && new URLSearchParams(location.search).get('tab') === adminTab)
                    : false;
                  
                  // Special handling for Practice dropdown
                  if (item.name === 'Practice') {
                    if (isAdmin) return null; // hide Practice for admins/moderators
                    return (
                      <div
                        key={item.path}
                        className="relative"
                        ref={practiceDropdownRef}
                        onMouseEnter={() => !isContestMode && setShowPracticeDropdown(true)}
                        onMouseLeave={() => setShowPracticeDropdown(false)}
                      >
                        <button
                          className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                            location.pathname === '/practice'
                              ? 'text-black border-b-2 border-black'
                              : isContestMode 
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-600 hover:text-black'
                          }`}
                          onClick={() => {
                            if (isContestMode) {
                              alert('Navigation is disabled during contest. Please complete or submit the contest first.');
                              return;
                            }
                            setShowPracticeDropdown((prev) => !prev);
                          }}
                          disabled={isContestMode}
                        >
                          <Target className="w-4 h-4" />
                          <span>Practice</span>
                          <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showPracticeDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {showPracticeDropdown && !isContestMode && (
                            <motion.div
                              className="absolute left-0 mt-1 w-44 bg-white border border-gray-200 rounded shadow-lg z-50"
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                            >
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              onClick={() => { setShowPracticeDropdown(false); navigate('/practice?category=Aptitude'); }}
                            >Aptitude Test</button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              onClick={() => { setShowPracticeDropdown(false); navigate('/practice?category=Technical'); }}
                            >Technical Test</button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              onClick={() => { setShowPracticeDropdown(false); navigate('/practice?category=DSA'); }}
                            >DSA Round</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }
                  
                  // Regular navigation items
                  // For admins, route to AdminDashboard tabs (except AI Assistant)
                  if (isAdmin && adminTab && item.name !== 'AI Assistant') {
                    return (
                      <Link
                        key={item.path}
                        to={adminTabHref}
                        className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                          isAdminTabActive
                            ? 'text-black border-b-2 border-black'
                            : isContestMode 
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-600 hover:text-black'
                        }`}
                        onClick={(e) => handleNavigationClick(e, adminTabHref)}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{item.name}</span>
                      </Link>
                    );
                  }

                  // Default behavior
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                        location.pathname === item.path
                          ? 'text-black border-b-2 border-black'
                          : isContestMode 
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:text-black'
                      }`}
                      onClick={(e) => handleNavigationClick(e, item.path)}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {!user ? (
              <>
                <button
                  className={`text-sm font-medium transition-colors ${
                    isContestMode 
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-black'
                  }`}
                  onClick={() => {
                    if (isContestMode) {
                      alert('Login is disabled during contest. Please complete or submit the contest first.');
                      return;
                    }
                    onOpenAuthModal('login');
                  }}
                  disabled={isContestMode}
                >
                  Login
                </button>
                <button
                  className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                    isContestMode 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                  onClick={() => {
                    if (isContestMode) {
                      alert('Sign up is disabled during contest. Please complete or submit the contest first.');
                      return;
                    }
                    onOpenAuthModal('signup');
                  }}
                  disabled={isContestMode}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                {/* Contest Mode Warning */}
                {isContestMode && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <alertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-800">Contest Mode</span>
                  </div>
                )}

                {/* Bookmark Icon Only */}
                <Link
                  to="/bookmarks"
                  className={`p-2 transition-colors ${
                    location.pathname === '/bookmarks'
                      ? 'text-black'
                      : isContestMode 
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-black'
                  }`}
                  onClick={(e) => handleNavigationClick(e, '/bookmarks')}
                >
                  <Bookmark className="w-5 h-5" />
                </Link>

                {/* Notification Bell */}
                {!isContestMode ? (
                  <NotificationBell />
                ) : (
                  <div className="p-2 text-gray-400 cursor-not-allowed" title="Notifications disabled during contest">
                    <Bell className="w-5 h-5" />
                  </div>
                )}

                {/* User Profile Dropdown */}
                <div className="relative" ref={userDropdownRef}>
                  <div 
                    className={`w-8 h-8 bg-black rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                      isContestMode 
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'hover:bg-gray-800'
                    }`}
                    onMouseEnter={() => !isContestMode && setShowUserDropdown(true)}
                    onMouseLeave={() => setShowUserDropdown(false)}
                    onClick={() => {
                      if (isContestMode) {
                        alert('User menu is disabled during contest. Please complete or submit the contest first.');
                        return;
                      }
                    }}
                  >
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <AnimatePresence>
                    {showUserDropdown && !isContestMode && (
                      <motion.div 
                        className="absolute right-1/2 transform translate-x-1/2 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                        onMouseEnter={() => setShowUserDropdown(true)}
                        onMouseLeave={() => setShowUserDropdown(false)}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                      <div className="p-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;
