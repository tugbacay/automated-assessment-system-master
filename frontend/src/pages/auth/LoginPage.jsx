import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  TextField,
  Button,
  Box,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import PublicLayout from '../../components/common/Layout/PublicLayout';
import useAuth from '../../hooks/useAuth';
import { VALIDATION_RULES } from '../../utils/constants';

// Validation schema
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .matches(VALIDATION_RULES.EMAIL.PATTERN, VALIDATION_RULES.EMAIL.MESSAGE),
  password: yup
    .string()
    .required('Password is required')
    .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, VALIDATION_RULES.PASSWORD.MESSAGE),
});

/**
 * LoginPage Component
 * User login page with form validation
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(data);

      if (result.success) {
        // Redirect based on user role
        const user = result.data.user;
        if (user.role === 'student') {
          navigate('/student/dashboard');
        } else if (user.role === 'teacher') {
          navigate('/teacher/dashboard');
        } else if (user.role === 'admin') {
          navigate('/admin/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <PublicLayout title="Login">
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Email"
          type="email"
          autoComplete="email"
          margin="normal"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />

        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          margin="normal"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={togglePasswordVisibility} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ mt: 3, mb: 2 }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link component={RouterLink} to="/register" underline="hover">
              Register here
            </Link>
          </Typography>
        </Box>
      </Box>
    </PublicLayout>
  );
};

export default LoginPage;
