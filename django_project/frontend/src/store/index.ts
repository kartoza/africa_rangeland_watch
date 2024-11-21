import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import ticketReducer from './ticketSlice';
import organisationReducer from './organisationSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    ticket: ticketReducer,
    organization: organizationReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
