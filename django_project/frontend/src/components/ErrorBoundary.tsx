import React, { ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: undefined };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error details
    this.setState({ error, errorInfo });

    // Send to Sentry
    Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div>
          <h1>Something went wrong!</h1>
          <p>{this.state.error ? this.state.error.message : null}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
