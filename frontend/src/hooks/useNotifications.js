import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'notifications'), (docSnap) => {
      if (docSnap.exists()) {
        const list = docSnap.data().list || [];
        // Sort by newest first
        list.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(list);
        
        // Count unread (not stored in localstorage yet)
        const lastRead = parseInt(localStorage.getItem('lastReadNotification') || '0');
        const unread = list.filter(n => n.timestamp > lastRead).length;
        setUnreadCount(unread);
      }
    });
    return () => unsub();
  }, []);

  const markAsRead = () => {
    setUnreadCount(0);
    localStorage.setItem('lastReadNotification', Date.now().toString());
  };

  return { notifications, unreadCount, markAsRead };
}
