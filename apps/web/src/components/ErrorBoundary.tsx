import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", background: "#fef2f2", color: "#991b1b", minHeight: "100vh" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Component Crashed</h1>
          <pre style={{ marginTop: "20px", background: "#fee2e2", padding: "20px", borderRadius: "8px", overflow: "auto" }}>
            {this.state.error?.message}
            <br />
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
