import * as Sentry from "@sentry/react";
import React from 'react';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from "./components/ErrorBoundary";
import { HashRouter as Router } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider } from 'react-redux';
import theme from "./theme";
import store from "./store";
import ProjectRoutes from "./Routes";

Sentry.init({
    dsn: (window as any).sentryDsn,
    tunnel: '/sentry-proxy/',
    tracesSampleRate: 0.5
});


function App() {
  return (
    <ErrorBoundary>
      <ChakraProvider theme={theme}>
        <Provider store={store}>
          <Router>
            <ProjectRoutes />
          </Router>
        </Provider>
      </ChakraProvider>
    </ErrorBoundary>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

export default App;
