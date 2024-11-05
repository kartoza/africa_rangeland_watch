import * as Sentry from "@sentry/react";
import React from 'react';
import { createRoot } from "react-dom/client";

import Home from "./Home";
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from "./components/ErrorBoundary";

import './styles/index.scss';

Sentry.init({
    dsn: (window as any).sentryDsn,
    tunnel: '/sentry-proxy/',
    tracesSampleRate: 0.5
})

const rootElement = document.getElementById('app')!
const root = createRoot(rootElement);
root.render(
    <ErrorBoundary>
        <Home/>
    </ErrorBoundary>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
