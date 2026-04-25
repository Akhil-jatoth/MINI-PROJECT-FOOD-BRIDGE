import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const s = io('/', { transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('connect', () => {
      s.emit('join', user.id);
    });

    // Real-time event handlers
    s.on('donation:new', (data) => {
      if (user.role === 'ngo') {
        toast.success(`🍽 New donation from ${data.fromUser}!`, { duration: 5000 });
        setUnreadCount(p => p + 1);
      }
    });

    s.on('donation:accepted', (data) => {
      toast.success(`✅ Your donation was accepted by ${data.ngoName}!`, { duration: 6000 });
      setUnreadCount(p => p + 1);
    });

    s.on('donation:rejected', () => {
      toast.error('Your donation was not accepted at this time.', { duration: 5000 });
    });

    s.on('donation:cancelled', () => {
      if (user.role === 'ngo') toast.error('A donation was cancelled by the donor.');
    });

    s.on('volunteer:assigned', (data) => {
      toast.success(`🚴 ${data.volunteerName} is picking up the food!`);
      setUnreadCount(p => p + 1);
    });

    s.on('delivery:completed', () => {
      toast.success('🎉 Delivery completed successfully!', { duration: 6000 });
      setUnreadCount(p => p + 1);
    });

    s.on('account:approved', () => {
      toast.success('🎉 Your account has been approved! Refresh to access all features.', { duration: 8000 });
    });

    return () => { s.disconnect(); };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
