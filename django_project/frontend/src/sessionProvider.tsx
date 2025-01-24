import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AnalysisData as AnalysisState } from './components/Map/DataTypes';


// interface AnalysisState {
//   analysisType?: string;
//   community?: string | null;
//   landscape?: string;
//   latitude?: number | null;
//   longitude?: number | null;
// }

interface SessionData {
  lastPage: string;
  activityData: Record<string, any>;
  analysisState: AnalysisState | null;
}

interface SessionContextType {
  session: SessionData | null;
  saveSession: (page: string, activity: Record<string, any>, analysis?: AnalysisState) => void;
  loadSession: () => Promise<void>;
  loadingSession: boolean;
  hasPromptBeenOpened: boolean;
  setHasPromptBeenOpened: (opened: boolean) => void;
  clearAnalysisState: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within SessionProvider");
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loadingSession, setLoading] = useState(true);
  const [hasPromptBeenOpened, setHasPromptBeenOpenedState] = useState(
    () => localStorage.getItem("hasPromptBeenOpened") === "true"
  );

  const setHasPromptBeenOpened = (opened: boolean) => {
    setHasPromptBeenOpenedState(opened);
    localStorage.setItem("hasPromptBeenOpened", opened.toString());
  };

  const saveSession = useCallback(
    async (page: string, activity: Record<string, any>, analysis?: AnalysisState) => {
      console.log('save analysis ', analysis)
      const sessionData: Record<string, any> = {
        last_page: page,
        activity_data: activity,
      };

      if (analysis) {
        sessionData.analysisState = analysis;
      }

      try {
        await axios.put('/api/session/', sessionData);
        if (analysis) {
          setSession({
            lastPage: page,
            activityData: activity,
            analysisState: null
          })
        } else {
          setSession({
            ...session,
            lastPage: page,
            activityData: activity
          })
        }
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    },
    []
  );

  const loadSession = useCallback(async () => {
    console.log('loadSession')
    setLoading(true);
    try {
      const response = await axios.get('/api/session/');
      const transformedSession: SessionData = {
        lastPage: response.data.last_page,
        activityData: response.data.activity_data,
        analysisState: response.data.analysis_state || null,
      };

      setSession(transformedSession);
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAnalysisState = () => {
    setSession({...session, analysisState: null})
  }

  return (
    <SessionContext.Provider
      value={{
        session,
        saveSession,
        loadSession,
        loadingSession,
        hasPromptBeenOpened,
        setHasPromptBeenOpened,
        clearAnalysisState,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};