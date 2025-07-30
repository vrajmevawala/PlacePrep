import React, { useState, useRef, useEffect } from 'react';
import { User, Bell, BookOpen, Target, Trophy, Bookmark, BarChart3, LogOut, Trash2, Check } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext.jsx';
import logo from '../../assests/logo.png';

const Navigation = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [showPracticeDropdown, setShowPracticeDropdown] = useState(false);
  const practiceDropdownRef = useRef(null);
  
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
    { name: 'Practice', path: '/practice', icon: Target },
    { name: 'Resources', path: '/resources', icon: BookOpen },
    { name: 'Results', path: '/results', icon: BarChart3 },
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { name: 'Contests', path: user?.role === 'admin' ? '/admin-contests' : '/contests', icon: Trophy },
  ];

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (practiceDropdownRef.current && !practiceDropdownRef.current.contains(event.target)) {
        setShowPracticeDropdown(false);
      }
    }
    if (showNotifications || showPracticeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showPracticeDropdown]);

  const handleNotificationClick = async (notification) => {
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 cursor-pointer">
            <img src={logo} alt="PlacePrep Logo" className="w-32 h-auto" />
          </Link>

          {/* Navigation Items */}
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
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'text-black border-b-2 border-black'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Dashboard
                </button>
                {/* Practice Dropdown */}
                <div
                  className="relative"
                  ref={practiceDropdownRef}
                  onMouseEnter={() => setShowPracticeDropdown(true)}
                  onMouseLeave={() => setShowPracticeDropdown(false)}
                >
                  <button
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                      location.pathname === '/practice'
                        ? 'text-black border-b-2 border-black'
                        : 'text-gray-600 hover:text-black'
                    }`}
                    onClick={() => setShowPracticeDropdown((prev) => !prev)}
                  >
                    <Target className="w-4 h-4" />
                    <span>Practice</span>
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showPracticeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showPracticeDropdown && (
                    <div
                      className="absolute left-0 mt-0 w-44 bg-white border border-gray-200 rounded shadow-lg z-50"
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
                {/* Other nav items */}
                {privateNavItems.filter(item => item.name !== 'Practice').map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                        location.pathname === item.path
                          ? 'text-black border-b-2 border-black'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
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
                  className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-black text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <div className="relative" ref={notificationRef}>
                  <button
                    className="p-2 text-gray-600 hover:text-black transition-colors relative"
                    onClick={() => setShowNotifications((prev) => !prev)}
                  >
                    <Bell className="w-5 h-5" />
                    {/* Notification dot */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
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
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-600 hover:text-black transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 