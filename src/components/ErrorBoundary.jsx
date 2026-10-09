import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("Table rendering failed:", error.message);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="results-page">
        <h1>Unable to display the table</h1>
        <p>
          Your online seat and chips are kept by the server. Reload to
          reconnect.
        </p>
        <button className="button mint" onClick={() => location.reload()}>
          RECONNECT →
        </button>
      </main>
    );
  }
}
