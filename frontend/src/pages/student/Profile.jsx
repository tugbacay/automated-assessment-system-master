import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Avatar,
  Divider,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  Star as StarIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import StudentLayout from '../../components/common/Layout/StudentLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import useApi from '../../hooks/useApi';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { ENDPOINTS } from '../../config/env';
import { format } from 'date-fns';

/**
 * Student Profile Page
 * Manage student profile information and change password
 */
const Profile = () => {
  const { user, updateUser } = useAuth();
  const { loading, error, execute } = useApi();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [profileStats, setProfileStats] = useState({
    joinDate: null,
    totalSubmissions: 0,
    bestScore: 0,
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
      fetchProfileStats();
    }
  }, [user]);

  const fetchProfileStats = async () => {
    // Fetch user submissions to calculate stats
    const result = await execute(
      () => api.get(ENDPOINTS.SUBMISSIONS.STUDENT_ME),
      { showErrorToast: false }
    );

    if (result.success) {
      const submissions = result.data.submissions || result.data || [];
      const completedSubmissions = submissions.filter(
        (s) => s.evaluationId?.overallScore !== undefined
      );

      const scores = completedSubmissions.map((s) => s.evaluationId.overallScore);
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

      setProfileStats({
        joinDate: user?.createdAt || null,
        totalSubmissions: submissions.length,
        bestScore,
      });
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordError('');
  };

  const handleTogglePassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSaveProfile = async () => {
    setSuccessMessage('');

    const result = await execute(
      () =>
        api.put(ENDPOINTS.AUTH.ME, {
          name: profileData.name,
          email: profileData.email,
        }),
      {
        showSuccessToast: true,
        successMessage: 'Profile updated successfully!',
        showErrorToast: true,
      }
    );

    if (result.success) {
      // Update user in auth context
      updateUser(result.data.user || result.data);
      setSuccessMessage('Profile updated successfully!');

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setSuccessMessage('');

    // Validate passwords
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
    const hasNumber = /\d/.test(passwordData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setPasswordError('Password must contain uppercase, lowercase, and number');
      return;
    }

    const result = await execute(
      () =>
        api.put(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      {
        showSuccessToast: true,
        successMessage: 'Password changed successfully!',
        showErrorToast: true,
      }
    );

    if (result.success) {
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setSuccessMessage('Password changed successfully!');

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (loading && !user) {
    return (
      <StudentLayout title="Profile">
        <LoadingSpinner message="Loading profile..." />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Profile">
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            My Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your profile information and account settings.
          </Typography>
        </Box>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <ErrorMessage
            title="Error Loading Profile"
            message={error.message}
            onRetry={fetchProfileStats}
          />
        )}

        <Grid container spacing={3}>
          {/* Profile Information Card */}
          <Grid item xs={12} lg={8}>
            <CustomCard title="Profile Information">
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.main',
                    fontSize: '2rem',
                    mr: 3,
                  }}
                >
                  {getInitials(user?.name)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{user?.name || 'User'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Role: {user?.role || 'Student'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    Save Changes
                  </Button>
                </Grid>
              </Grid>
            </CustomCard>

            {/* Change Password Card */}
            <Box sx={{ mt: 3 }}>
              <CustomCard title="Change Password">
                {passwordError && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {passwordError}
                  </Alert>
                )}

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      name="currentPassword"
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePassword('current')}
                              edge="end"
                            >
                              {showPassword.current ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="New Password"
                      name="newPassword"
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePassword('new')}
                              edge="end"
                            >
                              {showPassword.new ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      helperText="At least 8 characters with uppercase, lowercase, and number"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      name="confirmPassword"
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePassword('confirm')}
                              edge="end"
                            >
                              {showPassword.confirm ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<LockIcon />}
                      onClick={handleChangePassword}
                      disabled={loading}
                    >
                      Change Password
                    </Button>
                  </Grid>
                </Grid>
              </CustomCard>
            </Box>
          </Grid>

          {/* Profile Statistics Card */}
          <Grid item xs={12} lg={4}>
            <CustomCard title="Profile Statistics">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Member Since
                      </Typography>
                    </Box>
                    <Typography variant="h6">
                      {profileStats.joinDate
                        ? format(new Date(profileStats.joinDate), 'MMMM dd, yyyy')
                        : 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AssessmentIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Total Submissions
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="success.main">
                      {profileStats.totalSubmissions}
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <StarIcon color="warning" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Best Score
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="warning.main">
                      {profileStats.bestScore.toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </CustomCard>

            {/* Avatar Placeholder Card */}
            <Box sx={{ mt: 3 }}>
              <CustomCard title="Profile Picture">
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: 'primary.main',
                      fontSize: '3rem',
                      margin: '0 auto',
                      mb: 2,
                    }}
                  >
                    {getInitials(user?.name)}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Profile picture feature coming soon
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AccountCircleIcon />}
                    disabled
                    sx={{ mt: 2 }}
                  >
                    Upload Photo
                  </Button>
                </Box>
              </CustomCard>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </StudentLayout>
  );
};

export default Profile;
