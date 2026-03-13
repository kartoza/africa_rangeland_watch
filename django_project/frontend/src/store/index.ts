import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import authReducer from './authSlice';
import ticketReducer from './ticketSlice';
import feedbackReducer from './feedbackSlice';
import organizationReducer from './organizationSlice';
import baseMapReducer from './baseMapSlice';
import landscapeReducer from './landscapeSlice';
import layerReducer from './layerSlice';
import mapConfigReducer from './mapConfigSlice';
import analysisReducer from './analysisSlice';
import uploadReducer from './uploadSlice';
import userProfileReducer from './userProfileSlice';
import userAnalysisReducer from './userAnalysisSlice';
import dashboardReducer from './dashboardSlice';
import indicatorReducer from "./indicatorSlice";
import alertSettingReducer from "./alertSettingSlice";
import dataPreviewReducer from './dataPreviewSlice';
import downloadReducer from './downloadSlice';
import userAnalysisSearchReducer from './userAnalysisSearchSlice';
import userIndicatorReducer from './userIndicatorSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  ticket: ticketReducer,
  feedback: feedbackReducer,
  organization: organizationReducer,
  baseMap: baseMapReducer,
  landscape: landscapeReducer,
  layer: layerReducer,
  mapConfig: mapConfigReducer,
  analysis: analysisReducer,
  upload: uploadReducer,
  userProfile: userProfileReducer,
  userAnalysis: userAnalysisReducer,
  dashboard: dashboardReducer,
  indicators: indicatorReducer,
  alertSettings: alertSettingReducer,
  dataPreview: dataPreviewReducer,
  download: downloadReducer,
  userAnalysisSearch: userAnalysisSearchReducer,
  userIndicator: userIndicatorReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['analysis'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
