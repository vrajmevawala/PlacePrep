import React, { useState, useRef, useEffect } from 'react';
import { User, Bell, BookOpen, Target, Trophy, Bookmark, BarChart3, LogOut, Trash2, Check, Bot, AlertTriangle } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext.jsx';
import logo from '../../assests/logo.png';

const Navigation = ({ user, onLogout, isContestMode = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [showPracticeDropdown, setShowPracticeDropdown] = useState(false);
  const practiceDropdownRef = useRef(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

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
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (practiceDropdownRef.current && !practiceDropdownRef.current.contains(event.target)) {
        setShowPracticeDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }
    if (showNotifications || showPracticeDropdown || showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showPracticeDropdown, showUserDropdown]);

  const handleNotificationClick = async (notification) => {
    if (isContestMode) {
      alert('Navigation is disabled during contest. Please complete or submit the contest first.');
      return;
    }

    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.data?.contestId) {
      navigate(`/contests`);
    } else if (notification.data?.resultId) {
      navigate(`/results`);
    }
    
    setShowNotifications(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const formatNotificationTime = (createdAt) => {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'CONTEST_ANNOUNCED':
      case 'CONTEST_STARTED':
      case 'CONTEST_ENDED':
        return <Trophy className="w-4 h-4 text-blue-500" />;
      case 'RESULT_AVAILABLE':
        return <BarChart3 className="w-4 h-4 text-green-500" />;
      case 'NEW_QUESTION':
        return <BookOpen className="w-4 h-4 text-purple-500" />;
      case 'SYSTEM_UPDATE':
        return <Bell className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleNavigationClick = (e, path) => {
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side - Logo */}
          <div className="flex-shrink-0">
            <Link 
              to="/" 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={(e) => handleNavigationClick(e, '/')}
            >
              <img src={logo} alt="PlacePrep Logo" className="w-32 h-auto" />
            </Link>
          </div>

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
                  
                  // Special handling for Practice dropdown
                  if (item.name === 'Practice') {
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
                        {showPracticeDropdown && !isContestMode && (
                          <div
                            className="absolute left-0 mt-1 w-44 bg-white border border-gray-200 rounded shadow-lg z-50"
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
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Regular navigation items
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
                <Link
                  to="/login"
                  className={`text-sm font-medium transition-colors ${
                    isContestMode 
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-black'
                  }`}
                  onClick={(e) => handleNavigationClick(e, '/login')}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                    isContestMode 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                  onClick={(e) => handleNavigationClick(e, '/signup')}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {/* Contest Mode Warning */}
                {isContestMode && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
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

                {/* Notification */}
                <div className="relative" ref={notificationRef}>
                  <button
                    className={`p-2 transition-colors relative ${
                      isContestMode 
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-black'
                    }`}
                    onClick={() => {
                      if (isContestMode) {
                        alert('Notifications are disabled during contest. Please complete or submit the contest first.');
                        return;
                      }
                      setShowNotifications((prev) => !prev);
                    }}
                    disabled={isContestMode}
                  >
                    <Bell className="w-5 h-5" />
                    {/* Notification dot */}
                    {unreadCount > 0 && !isContestMode && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && !isContestMode && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No notifications yet
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                              <li
                                key={notification.id}
                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                  !notification.isRead ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0 mt-0.5">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                      <p className={`text-sm font-medium ${
                                        !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                      }`}>
                                        {notification.title}
                                      </p>
                                      <button
                                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                      {formatNotificationTime(notification.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>

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
                  {showUserDropdown && !isContestMode && (
                    <div 
                      className="absolute right-1/2 transform translate-x-1/2 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                      onMouseEnter={() => setShowUserDropdown(true)}
                      onMouseLeave={() => setShowUserDropdown(false)}
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
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
