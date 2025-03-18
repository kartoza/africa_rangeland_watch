import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import ticketReducer from './ticketSlice';
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
import dataPreviewReducer from './dataPreviewSlice';


const store = configureStore({
  reducer: {
    auth: authReducer,
    ticket: ticketReducer,
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
    dataPreview: dataPreviewReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
