/**
 * @module ErrorBoundary
 * @description React error boundary for catching errors.
 */
import { Component } from "react";
import { Result, Button } from "antd";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="An unexpected error occurred. Please refresh the page."
          extra={<Button onClick={() => window.location.reload()}>Refresh</Button>}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
