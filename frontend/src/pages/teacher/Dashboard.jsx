import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  RateReview as ReviewIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import DataTable from '../../components/common/UI/DataTable';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { format } from 'date-fns';

/**
 * Teacher Dashboard Page
 * Overview of teacher's activities, statistics, and pending reviews
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalStudents: 0,
    pendingReviews: 0,
    avgScore: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [submissionTrends, setSubmissionTrends] = useState([]);
  const [activityTypeData, setActivityTypeData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard statistics
      const [statsRes, submissionsRes, activitiesRes] = await Promise.all([
        api.get('/teacher/dashboard/stats'),
        api.get('/submissions/pending?limit=5'),
        api.get('/activities/teacher/me'),
      ]);

      // Set statistics
      setStats({
        totalActivities: statsRes.data?.totalActivities || 0,
        totalStudents: statsRes.data?.totalStudents || 0,
        pendingReviews: statsRes.data?.pendingReviews || 0,
        avgScore: statsRes.data?.avgScore || 0,
      });

      // Set recent submissions
      setRecentSubmissions(submissionsRes.data?.submissions || []);

      // Generate submission trends data (last 7 days)
      const trends = generateSubmissionTrends(submissionsRes.data?.submissions || []);
      setSubmissionTrends(trends);

      // Generate activity type distribution
      const activities = activitiesRes.data?.activities || [];
      const typeDistribution = generateActivityTypeData(activities);
      setActivityTypeData(typeDistribution);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateSubmissionTrends = (submissions) => {
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'MMM dd');

      const count = submissions.filter((sub) => {
        const subDate = new Date(sub.submittedAt);
        return subDate.toDateString() === date.toDateString();
      }).length;

      last7Days.push({ date: dateStr, submissions: count });
    }

    return last7Days;
  };

  const generateActivityTypeData = (activities) => {
    const types = { speaking: 0, writing: 0, quiz: 0 };

    activities.forEach((activity) => {
      if (types.hasOwnProperty(activity.type)) {
        types[activity.type]++;
      }
    });

    return [
      { name: 'Speaking', value: types.speaking, color: '#8884d8' },
      { name: 'Writing', value: types.writing, color: '#82ca9d' },
      { name: 'Quiz', value: types.quiz, color: '#ffc658' },
    ];
  };

  const columns = [
    {
      id: 'studentName',
      label: 'Student',
      format: (value, row) => row.student?.name || 'Unknown',
    },
    {
      id: 'activityTitle',
      label: 'Activity',
      format: (value, row) => row.activity?.title || 'N/A',
    },
    {
      id: 'type',
      label: 'Type',
      format: (value, row) => (
        <Chip
          label={row.activity?.type || 'N/A'}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      id: 'submittedAt',
      label: 'Submitted',
      format: (value) => (value ? format(new Date(value), 'MMM dd, yyyy') : 'N/A'),
    },
    {
      id: 'status',
      label: 'Status',
      format: (value) => (
        <Chip
          label={value}
          size="small"
          color={value === 'pending' ? 'warning' : 'default'}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      format: (value, row) => (
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/teacher/review/${row._id}`);
          }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  if (loading) {
    return (
      <TeacherLayout title="Dashboard">
        <LoadingSpinner message="Loading dashboard..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title="Dashboard">
        <ErrorMessage
          title="Error Loading Dashboard"
          message={error}
          onRetry={fetchDashboardData}
        />
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Dashboard">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your teaching activities and pending reviews.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Activities
                  </Typography>
                  <Typography variant="h4">{stats.totalActivities}</Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Students
                  </Typography>
                  <Typography variant="h4">{stats.totalStudents}</Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Pending Reviews
                  </Typography>
                  <Typography variant="h4">{stats.pendingReviews}</Typography>
                </Box>
                <ReviewIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Average Score
                  </Typography>
                  <Typography variant="h4">{stats.avgScore.toFixed(1)}%</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <CustomCard title="Quick Actions" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/teacher/activities/create')}
          >
            Create Activity
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/teacher/rubrics/create')}
          >
            Create Rubric
          </Button>
          <Button
            variant="outlined"
            startIcon={<ReviewIcon />}
            onClick={() => navigate('/teacher/reviews')}
          >
            View Reviews
          </Button>
        </Box>
      </CustomCard>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <CustomCard title="Submission Trends (Last 7 Days)">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={submissionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="submissions"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CustomCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <CustomCard title="Activity Type Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {activityTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CustomCard>
        </Grid>
      </Grid>

      {/* Recent Submissions Requiring Review */}
      <CustomCard title="Recent Submissions Requiring Review">
        <DataTable
          columns={columns}
          rows={recentSubmissions}
          emptyMessage="No pending submissions"
          emptyIcon={ReviewIcon}
          defaultRowsPerPage={5}
          onRowClick={(row) => navigate(`/teacher/review/${row._id}`)}
        />
      </CustomCard>
    </TeacherLayout>
  );
};

export default Dashboard;
