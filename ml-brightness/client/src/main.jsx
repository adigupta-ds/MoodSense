import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ReportsPage from './pages/ReportsPage';
import './index.css';

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: '#e63946', background: '#0d0d0d', minHeight: '100vh' }}>
          <h2>Runtime Error</h2>
          <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap', fontSize: 13 }}>{this.state.error.message}</pre>
          <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontSize: 11, color: '#666' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<App />} />
        <Route path="/ml-reports" element={<ReportsPage />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
);
