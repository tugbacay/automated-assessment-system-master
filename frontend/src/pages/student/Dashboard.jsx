import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayArrowIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  EventAvailable as EventAvailableIcon,
  Mic as MicIcon,
  Edit as EditIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import StudentLayout from '../../components/common/Layout/StudentLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import DataTable from '../../components/common/UI/DataTable';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import useApi from '../../hooks/useApi';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { ENDPOINTS } from '../../config/env';
import { ACTIVITY_TYPES } from '../../utils/constants';
import { format, isAfter, isBefore, addDays } from 'date-fns';

/**
 * Student Dashboard Page
 * Overview of student's activities, progress, and recent submissions
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, error, execute } = useApi();
  const [activities, setActivities] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    completedActivities: 0,
    pendingActivities: 0,
    averageScore: 0,
  });

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch activities and submissions in parallel
    const [activitiesResult, submissionsResult] = await Promise.all([
      execute(() => api.get('/activities'), { showErrorToast: false }),
      execute(() => api.get(ENDPOINTS.SUBMISSIONS.STUDENT_ME), { showErrorToast: false }),
    ]);

    if (activitiesResult.success) {
      const activitiesData = activitiesResult.data.activities || activitiesResult.data || [];
      setActivities(activitiesData);
      calculateStats(activitiesData, submissionsResult.data?.submissions || []);
    }

    if (submissionsResult.success) {
      const submissionsData = submissionsResult.data.submissions || submissionsResult.data || [];
      setSubmissions(submissionsData);
    }
  };

  const calculateStats = (activitiesData, submissionsData) => {
    const totalActivities = activitiesData.length;
    const completedActivities = submissionsData.filter(
      (s) => s.status === 'completed'
    ).length;
    const pendingActivities = totalActivities - completedActivities;

    // Calculate average score from completed submissions
    const completedWithScores = submissionsData.filter(
      (s) => s.evaluationId?.overallScore !== undefined
    );
    const averageScore =
      completedWithScores.length > 0
        ? completedWithScores.reduce((sum, s) => sum + s.evaluationId.overallScore, 0) /
          completedWithScores.length
        : 0;

    setStats({
      totalActivities,
      completedActivities,
      pendingActivities,
      averageScore,
    });
  };

  // Get upcoming deadlines (next 7 days)
  const getUpcomingDeadlines = () => {
    const now = new Date();
    const nextWeek = addDays(now, 7);

    return activities
      .filter((activity) => {
        if (!activity.deadline) return false;
        const deadline = new Date(activity.deadline);
        return isAfter(deadline, now) && isBefore(deadline, nextWeek);
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);
  };

  // Get recent submissions (last 5)
  const getRecentSubmissions = () => {
    return submissions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  };

  // Prepare chart data for recent performance
  const preparePerformanceData = () => {
    if (!submissions || submissions.length === 0) return [];

    // Get last 10 submissions with scores
    const submissionsWithScores = submissions
      .filter((s) => s.evaluationId?.overallScore !== undefined)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-10);

    return submissionsWithScores.map((sub, index) => ({
      name: `#${index + 1}`,
      score: sub.evaluationId.overallScore,
      date: format(new Date(sub.createdAt), 'MMM dd'),
    }));
  };

  // Navigate to activity based on type
  const handleStartActivity = (activity) => {
    const routes = {
      [ACTIVITY_TYPES.SPEAKING]: `/student/activities/${activity._id}/speaking`,
      [ACTIVITY_TYPES.WRITING]: `/student/activities/${activity._id}/writing`,
      [ACTIVITY_TYPES.QUIZ]: `/student/activities/${activity._id}/quiz`,
    };

    const route = routes[activity.type];
    if (route) {
      navigate(route);
    }
  };

  // Get icon for activity type
  const getActivityIcon = (type) => {
    const icons = {
      [ACTIVITY_TYPES.SPEAKING]: <MicIcon fontSize="small" />,
      [ACTIVITY_TYPES.WRITING]: <EditIcon fontSize="small" />,
      [ACTIVITY_TYPES.QUIZ]: <QuizIcon fontSize="small" />,
    };
    return icons[type] || <AssignmentIcon fontSize="small" />;
  };

  // Table columns for recent submissions
  const submissionColumns = [
    {
      id: 'activity',
      label: 'Activity',
      format: (value, row) => row.activityId?.title || 'Unknown',
    },
    {
      id: 'type',
      label: 'Type',
      format: (value, row) => (
        <Chip label={row.activityId?.type || 'Unknown'} size="small" />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      format: (value) => (
        <Chip
          label={value}
          size="small"
          color={
            value === 'completed'
              ? 'success'
              : value === 'evaluating'
              ? 'info'
              : 'warning'
          }
        />
      ),
    },
    {
      id: 'score',
      label: 'Score',
      align: 'center',
      format: (value, row) =>
        row.evaluationId?.overallScore !== undefined
          ? `${row.evaluationId.overallScore.toFixed(1)}%`
          : '-',
    },
  ];

  const performanceData = preparePerformanceData();
  const upcomingDeadlines = getUpcomingDeadlines();
  const recentSubmissions = getRecentSubmissions();

  if (loading && activities.length === 0 && submissions.length === 0) {
    return (
      <StudentLayout title="Dashboard">
        <LoadingSpinner message="Loading dashboard..." />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Dashboard">
      <Box>
        {/* Welcome Message */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {user?.name || 'Student'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's an overview of your learning progress and activities.
          </Typography>
        </Box>

        {error && (
          <ErrorMessage
            title="Error Loading Dashboard"
            message={error.message}
            onRetry={fetchDashboardData}
          />
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Activities
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.totalActivities}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {stats.completedActivities}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {stats.pendingActivities}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Average Score
                  </Typography>
                </Box>
                <Typography variant="h4" color="info.main">
                  {stats.averageScore.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Recent Performance Chart */}
          {performanceData.length > 0 && (
            <Grid item xs={12} lg={8}>
              <CustomCard title="Recent Performance Trend">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#1976d2"
                      strokeWidth={2}
                      name="Score (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CustomCard>
            </Grid>
          )}

          {/* Quick Actions */}
          <Grid item xs={12} lg={4}>
            <CustomCard title="Quick Actions">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => navigate('/student/activities')}
                >
                  Start New Activity
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/student/progress')}
                >
                  View Progress
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate('/student/submissions')}
                >
                  View Submissions
                </Button>
              </Box>
            </CustomCard>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Upcoming Deadlines */}
          <Grid item xs={12} lg={6}>
            <CustomCard
              title="Upcoming Deadlines"
              subtitle={
                upcomingDeadlines.length > 0
                  ? 'Next 7 days'
                  : 'No upcoming deadlines'
              }
            >
              {upcomingDeadlines.length > 0 ? (
                <List>
                  {upcomingDeadlines.map((activity, index) => (
                    <div key={activity._id}>
                      <ListItem
                        button
                        onClick={() => handleStartActivity(activity)}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemIcon>{getActivityIcon(activity.type)}</ListItemIcon>
                        <ListItemText
                          primary={activity.title}
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {activity.type}
                              </Typography>
                              {' — Due: '}
                              {format(new Date(activity.deadline), 'MMM dd, yyyy HH:mm')}
                            </>
                          }
                        />
                        <Box>
                          {new Date(activity.deadline) < addDays(new Date(), 2) && (
                            <Chip
                              icon={<WarningIcon />}
                              label="Urgent"
                              color="error"
                              size="small"
                            />
                          )}
                        </Box>
                      </ListItem>
                      {index < upcomingDeadlines.length - 1 && <Divider />}
                    </div>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <EventAvailableIcon
                    sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    No upcoming deadlines in the next 7 days
                  </Typography>
                </Box>
              )}
            </CustomCard>
          </Grid>

          {/* Recent Activities */}
          <Grid item xs={12} lg={6}>
            <CustomCard
              title="Recent Submissions"
              subtitle={
                recentSubmissions.length > 0
                  ? 'Latest 5 submissions'
                  : 'No submissions yet'
              }
            >
              {recentSubmissions.length > 0 ? (
                <DataTable
                  columns={submissionColumns}
                  rows={recentSubmissions}
                  emptyMessage="No submissions yet"
                  pagination={false}
                />
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AssignmentIcon
                    sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    You haven't submitted any activities yet
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => navigate('/student/activities')}
                    sx={{ mt: 2 }}
                  >
                    Start Your First Activity
                  </Button>
                </Box>
              )}
            </CustomCard>
          </Grid>
        </Grid>
      </Box>
    </StudentLayout>
  );
};

export default Dashboard;
