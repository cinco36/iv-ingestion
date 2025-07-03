import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Alert,
  CircularProgress
} from '@mui/material';

// Login Page Component
const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For now, use hardcoded credentials for testing
      if (email === 'admin@example.com' && password === 'admin123') {
        // Store a mock token
        localStorage.setItem('authToken', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify({ 
          id: 1, 
          email: 'admin@example.com', 
          name: 'Admin User',
          role: 'admin' 
        }));
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Use admin@example.com / admin123');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          IV Ingestion Admin
        </Typography>
        <Typography variant="h6" color="primary" gutterBottom align="center">
          Sign In
        </Typography>
        
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoFocus
          />
          
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          
          <Typography variant="body2" color="text.secondary" align="center">
            Test Credentials: admin@example.com / admin123
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

const DashboardPage = () => (
  <Container maxWidth="lg" sx={{ mt: 4 }}>
    <Typography variant="h4" gutterBottom>
      Dashboard
    </Typography>
    <Typography>
      Main dashboard content will be here
    </Typography>
  </Container>
);

const Layout = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ display: 'flex', minHeight: '100vh' }}>
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      {children}
    </Box>
  </Box>
);

// Placeholder components for other pages
const FileTestingPage = () => <Typography variant="h4">File Testing</Typography>;
const QueueMonitoringPage = () => <Typography variant="h4">Queue Monitoring</Typography>;
const ApiTestingPage = () => <Typography variant="h4">API Testing</Typography>;
const MonitoringPage = () => <Typography variant="h4">Monitoring</Typography>;
const UserManagementPage = () => <Typography variant="h4">User Management</Typography>;
const DebugToolsPage = () => <Typography variant="h4">Debug Tools</Typography>;

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('authToken');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Outlet />
            </Layout>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="file-testing" element={<FileTestingPage />} />
        <Route path="queue-monitoring" element={<QueueMonitoringPage />} />
        <Route path="api-testing" element={<ApiTestingPage />} />
        <Route path="monitoring" element={<MonitoringPage />} />
        <Route path="user-management" element={<UserManagementPage />} />
        <Route path="debug-tools" element={<DebugToolsPage />} />
      </Route>
    </Routes>
  );
}

export default App; 