import * as Sentry from "@sentry/react";
import React, { useEffect } from 'react';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from "./components/ErrorBoundary";
import { HashRouter as Router } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider } from 'react-redux';
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import theme from "./theme";
import store from "./store";
import ProjectRoutes from "./Routes";

Sentry.init({
    dsn: (window as any).sentryDsn,
    tunnel: '/sentry-proxy/',
    tracesSampleRate: 0.5
});


/** Global declarations **/
declare global {
  interface Window {
    map: any;
  }
}

function App() {

  // Initialize maplibre pmtiles protocol
  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => {
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);

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
