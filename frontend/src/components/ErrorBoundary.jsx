/**
 * ── React Error Boundary ────────────────────────────────────────
 * 
 * Top-level error boundary that catches JavaScript exceptions in 
 * the React component tree and shows a recovery UI instead of
 * a blank white screen.
 * 
 * Features:
 *   - Catches render errors, lifecycle errors, and constructor errors
 *   - Shows a user-friendly error screen with "Try Again" option
 *   - "Try Again" resets the error state (no full page reload needed)
 *   - "Reload Application" does a full page reload as fallback
 *   - Logs errors in all environments for debugging
 * 
 * Limitations:
 *   - Does NOT catch event handler errors (use try/catch in handlers)
 *   - Does NOT catch async errors (use .catch() on promises)
 */

import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Always log errors — useful for remote debugging in production
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack);
  }

  /**
   * Resets the error state so the component tree re-renders.
   * This allows users to recover without a full page reload.
   */
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100vh', width: '100%',
          bgcolor: '#060d1a', color: '#f0f9ff',
          px: 3, textAlign: 'center'
        }}>
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold', color: '#ef4444' }}>
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', maxWidth: 500 }}>
            An unexpected error occurred in the application. 
            Try clicking "Try Again" to recover, or reload the page.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={this.handleReset}
            >
              Try Again
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => window.location.reload()}
            >
              Reload Application
            </Button>
          </Stack>
        </Box>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
