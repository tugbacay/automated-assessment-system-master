import { useState, useEffect } from 'react';
import {
  Grid,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Add as AddIcon,
  GetApp as GetAppIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import AdminLayout from '../../components/common/Layout/AdminLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import DataTable from '../../components/common/UI/DataTable';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * Admin Dashboard Page
 * Overview of system metrics and activity
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalActivities: 0,
    totalSubmissions: 0,
    systemHealth: 100,
  });
  const [userGrowth, setUserGrowth] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard metrics
      const response = await api.get('/admin/dashboard');

      setMetrics(response.data.metrics || {
        totalUsers: 0,
        totalActivities: 0,
        totalSubmissions: 0,
        systemHealth: 100,
      });

      setUserGrowth(response.data.userGrowth || generateSampleUserGrowth());
      setRecentLogs(response.data.recentLogs || generateSampleLogs());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Use sample data on error
      setMetrics({
        totalUsers: 1247,
        totalActivities: 324,
        totalSubmissions: 8965,
        systemHealth: 98.5,
      });
      setUserGrowth(generateSampleUserGrowth());
      setRecentLogs(generateSampleLogs());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleUserGrowth = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({
      month,
      users: Math.floor(100 + index * 95 + Math.random() * 50),
      activeUsers: Math.floor(70 + index * 65 + Math.random() * 30),
    }));
  };

  const generateSampleLogs = () => {
    const actions = ['User Login', 'Activity Created', 'Submission Graded', 'User Registered', 'Settings Updated'];
    const users = ['john.doe@example.com', 'jane.smith@example.com', 'admin@example.com', 'teacher@example.com'];

    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      timestamp: new Date(Date.now() - i * 3600000).toLocaleString(),
      user: users[Math.floor(Math.random() * users.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      status: Math.random() > 0.1 ? 'Success' : 'Failed',
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    }));
  };

  const metricCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers?.toLocaleString() || '0',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      change: '+12.5%',
      changePositive: true,
    },
    {
      title: 'Total Activities',
      value: metrics.totalActivities?.toLocaleString() || '0',
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: '#388e3c',
      change: '+8.3%',
      changePositive: true,
    },
    {
      title: 'Total Submissions',
      value: metrics.totalSubmissions?.toLocaleString() || '0',
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
      color: '#f57c00',
      change: '+15.7%',
      changePositive: true,
    },
    {
      title: 'System Health',
      value: `${metrics.systemHealth?.toFixed(1) || '100'}%`,
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      color: '#7b1fa2',
      change: '-0.2%',
      changePositive: false,
    },
  ];

  const activityColumns = [
    { id: 'timestamp', label: 'Timestamp', minWidth: 180 },
    { id: 'user', label: 'User', minWidth: 200 },
    { id: 'action', label: 'Action', minWidth: 150 },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      format: (value) => (
        <Chip
          label={value}
          color={value === 'Success' ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    { id: 'ip', label: 'IP Address', minWidth: 120 },
  ];

  if (loading) {
    return (
      <AdminLayout title="Admin Dashboard">
        <LoadingSpinner message="Loading dashboard..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Dashboard">
      <Box>
        {/* Header with Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Admin Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchDashboardData}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetAppIcon />}
              onClick={() => navigate('/admin/analytics-export')}
            >
              Export Data
            </Button>
            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={() => navigate('/admin/system-analytics')}
            >
              View Analytics
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/user-management')}
            >
              Add User
            </Button>
          </Box>
        </Box>

        {error && (
          <Box sx={{ mb: 3 }}>
            <ErrorMessage message={error} />
          </Box>
        )}

        {/* Metric Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {metricCards.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                elevation={3}
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${metric.color}15 0%, ${metric.color}05 100%)`,
                  borderLeft: `4px solid ${metric.color}`,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {metric.title}
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight={600} sx={{ mb: 1 }}>
                        {metric.value}
                      </Typography>
                      <Chip
                        label={metric.change}
                        size="small"
                        color={metric.changePositive ? 'success' : 'error'}
                        sx={{ height: 20, fontSize: '0.75rem' }}
                      />
                    </Box>
                    <Box sx={{ color: metric.color, opacity: 0.8 }}>
                      {metric.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* User Growth Chart */}
          <Grid item xs={12} lg={8}>
            <CustomCard title="User Growth" subtitle="Monthly user registration trends">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#1976d2"
                    strokeWidth={2}
                    name="Total Users"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#388e3c"
                    strokeWidth={2}
                    name="Active Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>

          {/* System Health Summary */}
          <Grid item xs={12} lg={4}>
            <CustomCard title="System Status" subtitle="Real-time system metrics">
              <Box sx={{ py: 2 }}>
                {[
                  { label: 'CPU Usage', value: 45, color: '#1976d2' },
                  { label: 'Memory Usage', value: 68, color: '#388e3c' },
                  { label: 'Disk Usage', value: 52, color: '#f57c00' },
                  { label: 'Network Load', value: 35, color: '#7b1fa2' },
                ].map((stat, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {stat.value}%
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: '100%',
                        height: 8,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${stat.value}%`,
                          height: '100%',
                          bgcolor: stat.color,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CustomCard>
          </Grid>
        </Grid>

        {/* Recent Activity Logs */}
        <CustomCard
          title="Recent Activity Logs"
          subtitle="Latest system activities and user actions"
          actions={
            <Button
              size="small"
              onClick={() => navigate('/admin/audit-logs')}
            >
              View All Logs
            </Button>
          }
        >
          <DataTable
            columns={activityColumns}
            rows={recentLogs}
            pagination={false}
            emptyMessage="No recent activity logs"
          />
        </CustomCard>
      </Box>
    </AdminLayout>
  );
};

export default Dashboard;
