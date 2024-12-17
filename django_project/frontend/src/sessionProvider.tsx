import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface SessionData {
    lastPage: string;
    activityData: Record<string, any>;
}

interface SessionContextType {
    session: SessionData | null;
    saveSession: (page: string, activity: Record<string, any>) => void;
    loadSession: () => Promise<void>;
    loading: boolean;
    hasPromptBeenOpened: boolean;
    setHasPromptBeenOpened: (opened: boolean) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) throw new Error("useSession must be used within SessionProvider");
    return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<SessionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasPromptBeenOpened, setHasPromptBeenOpened] = useState(false);

    const saveSession = useCallback(async (page: string, activity: Record<string, any>) => {
        await axios.put('/api/session/', { last_page: page, activity_data: activity });
        setSession({ lastPage: page, activityData: activity });
    }, []);

    const loadSession = useCallback(async () => {
      setLoading(true);
      try {
          const response = await axios.get('/api/session/');
  
          // Transform response keys to match the SessionData interface
          const transformedSession: SessionData = {
              lastPage: response.data.last_page,
              activityData: response.data.activity_data 
          };
  
          setSession(transformedSession);
      } catch (error) {
          console.error('Failed to load session:', error);
      } finally {
          setLoading(false);
      }
  }, []);
  

    return (
        <SessionContext.Provider
            value={{
                session,
                saveSession,
                loadSession,
                loading,
                hasPromptBeenOpened,
                setHasPromptBeenOpened,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};
