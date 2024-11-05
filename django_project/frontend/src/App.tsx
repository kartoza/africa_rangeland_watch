import * as Sentry from "@sentry/react";
import React from 'react';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from "./components/ErrorBoundary";
import Routes from "./Routes";
import { BrowserRouter as Router } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "./theme";

Sentry.init({
    dsn: (window as any).sentryDsn,
    tunnel: '/sentry-proxy/',
    tracesSampleRate: 0.5
});


function App() {
  return (
    <ErrorBoundary>
      <ChakraProvider theme={theme}>
        <Router>
          <Routes />
        </Router>
      </ChakraProvider>
    </ErrorBoundary>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

export default App;
