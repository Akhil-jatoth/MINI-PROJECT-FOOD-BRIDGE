import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const { unreadCount, setUnreadCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef();
  const profileRef = useRef();

  const profileSrc = user?.profilePhoto
    ? `/uploads/profiles/${user.profilePhoto}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=16a34a&color=fff&size=64`;

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {}
  };

  const handleNotifOpen = () => {
    setNotifOpen(p => !p);
    if (!notifOpen) loadNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const roleLabels = { donor: 'Donor', ngo: 'NGO Partner', volunteer: 'Volunteer', admin: 'Administrator' };
  const roleColors = { donor: 'badge-green', ngo: 'badge-blue', volunteer: 'badge-yellow', admin: 'badge-red' };

  return (
    <nav className="sticky top-0 z-40 glass border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-400 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-brand-300 transition-shadow">
              <span className="text-lg">🍽</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-gray-900 dark:text-white text-lg">Food Bridge</span>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Notifications */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleNotifOpen}
                  className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-12 w-80 card shadow-2xl z-50 animate-slide-up">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-brand-600 hover:underline">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-sm">No notifications yet</p>
                      ) : notifications.map(n => (
                        <div key={n._id} className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.isRead ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{n.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile dropdown */}
            {user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(p => !p)}
                  className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <img src={profileSrc} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-brand-400" />
                  <span className="hidden md:block text-sm font-semibold text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <span className="text-gray-400 text-xs">▾</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 w-64 card shadow-2xl z-50 animate-slide-up overflow-hidden">
                    <div className="px-4 py-4 bg-gradient-to-r from-brand-600 to-brand-500 text-white">
                      <div className="flex items-center gap-3">
                        <img src={profileSrc} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white/50" />
                        <div className="min-w-0">
                          <p className="font-bold truncate">{user.name}</p>
                          <p className="text-xs text-brand-100 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className={roleColors[user.role]}>{roleLabels[user.role]}</span>
                        <span className={user.status === 'approved' ? 'badge-green' : user.status === 'pending' ? 'badge-yellow' : 'badge-red'}>
                          {user.status}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full btn-danger text-sm py-2"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
