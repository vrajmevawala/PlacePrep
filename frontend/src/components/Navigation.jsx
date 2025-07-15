import React, { useState, useRef, useEffect } from 'react';
import { User, Bell, BookOpen, Target, Trophy, Bookmark, BarChart3, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navigation = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const publicNavItems = [
    { name: 'Home', path: '/' },
    { name: 'Why Choose Us', path: '/why-choose-us' },
  ];

  const privateNavItems = [
    { name: 'Practice', path: '/practice', icon: Target },
    { name: 'Resources', path: '/resources', icon: BookOpen },
    { name: 'Results', path: '/results', icon: BarChart3 },
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { name: 'Contests', path: '/contests', icon: Trophy },
  ];

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 cursor-pointer">
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">PP</span>
            </div>
            <span className="text-xl font-bold tracking-tight">PlacePrep</span>
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
                {privateNavItems.map((item) => {
                  const Icon = item.icon;
                  if (item.path) {
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
                  } else {
                    return (
                      <button
                        key={item.page}
                        className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                          location.pathname === `/${item.page}`
                            ? 'text-black border-b-2 border-black'
                            : 'text-gray-600 hover:text-black'
                        }`}
                        onClick={() => navigate(`/${item.page}`)}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </button>
                    );
                  }
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
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg z-50">
                      <div className="p-4 border-b font-semibold">Notifications</div>
                      <ul className="max-h-60 overflow-y-auto">
                        <li className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer">Welcome to PlacePrep!</li>
                        <li className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer">Your test result is available.</li>
                        <li className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer">New contest announced!</li>
                      </ul>
                      <div className="p-2 text-xs text-center text-gray-400">No more notifications</div>
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