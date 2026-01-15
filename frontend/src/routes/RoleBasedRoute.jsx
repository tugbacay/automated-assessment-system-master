import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { CircularProgress, Box, Typography, Paper } from '@mui/material';
import { USER_ROLES } from '../utils/constants';

/**
 * RoleBasedRoute Component
 * Protects routes based on user role
 * Redirects to appropriate dashboard if user doesn't have required role
 */
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (!hasRole(allowedRoles)) {
    // Redirect to user's appropriate dashboard based on role
    let redirectPath = '/';

    if (user?.role === USER_ROLES.STUDENT) {
      redirectPath = '/student/dashboard';
    } else if (user?.role === USER_ROLES.TEACHER) {
      redirectPath = '/teacher/dashboard';
    } else if (user?.role === USER_ROLES.ADMIN) {
      redirectPath = '/admin/dashboard';
    }

    // Show access denied message
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          padding: 3,
        }}
      >
        <Paper
          sx={{
            padding: 4,
            textAlign: 'center',
            maxWidth: 500,
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You don't have permission to access this page.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirecting to your dashboard...
          </Typography>
        </Paper>
        <Navigate to={redirectPath} replace />
      </Box>
    );
  }

  // Render children if user has required role
  return children;
};

export default RoleBasedRoute;
