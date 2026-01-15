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
  MenuItem,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import PublicLayout from '../../components/common/Layout/PublicLayout';
import useAuth from '../../hooks/useAuth';
import { VALIDATION_RULES, USER_ROLES } from '../../utils/constants';

// Validation schema
const registerSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),
  email: yup
    .string()
    .required('Email is required')
    .matches(VALIDATION_RULES.EMAIL.PATTERN, VALIDATION_RULES.EMAIL.MESSAGE),
  password: yup
    .string()
    .required('Password is required')
    .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, VALIDATION_RULES.PASSWORD.MESSAGE)
    .matches(VALIDATION_RULES.PASSWORD.PATTERN, VALIDATION_RULES.PASSWORD.MESSAGE),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  role: yup
    .string()
    .required('Please select a role')
    .oneOf([USER_ROLES.STUDENT, USER_ROLES.TEACHER], 'Invalid role selected'),
});

/**
 * RegisterPage Component
 * User registration page with form validation
 */
const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      role: USER_ROLES.STUDENT,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = data;
      const result = await registerUser(userData);

      if (result.success) {
        // Redirect based on user role
        const user = result.data.user;
        if (user.role === 'student') {
          navigate('/student/dashboard');
        } else if (user.role === 'teacher') {
          navigate('/teacher/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <PublicLayout title="Register">
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Full Name"
          autoComplete="name"
          margin="normal"
          {...register('name')}
          error={!!errors.name}
          helperText={errors.name?.message}
        />

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
          select
          label="Role"
          margin="normal"
          {...register('role')}
          error={!!errors.role}
          helperText={errors.role?.message}
        >
          <MenuItem value={USER_ROLES.STUDENT}>Student</MenuItem>
          <MenuItem value={USER_ROLES.TEACHER}>Teacher</MenuItem>
        </TextField>

        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
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

        <TextField
          fullWidth
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          margin="normal"
          {...register('confirmPassword')}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" underline="hover">
              Login here
            </Link>
          </Typography>
        </Box>
      </Box>
    </PublicLayout>
  );
};

export default RegisterPage;
