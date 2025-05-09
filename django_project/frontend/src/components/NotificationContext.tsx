import React, { createContext, useCallback, useContext, useState } from "react";
import axios from "axios";

const NotificationContext = createContext<any>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get("/api/in-app-notifications/");
      const unreadCount = response.data?.results?.filter((n: any) => !n.is_read)?.length || 0;
      setNotificationCount(unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ notificationCount, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
