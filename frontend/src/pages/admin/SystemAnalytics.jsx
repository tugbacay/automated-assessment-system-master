import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/Layout/AdminLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import api from '../../services/api';

/**
 * System Analytics Page
 * System-wide analytics and metrics
 */
const SystemAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [metrics, setMetrics] = useState({});
  const [userGrowth, setUserGrowth] = useState([]);
  const [activityDistribution, setActivityDistribution] = useState([]);
  const [storageUsage, setStorageUsage] = useState([]);
  const [apiResponseTime, setApiResponseTime] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics/system?range=${timeRange}`);
      setMetrics(response.data.metrics || {});
      setUserGrowth(response.data.userGrowth || generateUserGrowth());
      setActivityDistribution(response.data.activityDistribution || generateActivityDistribution());
      setStorageUsage(response.data.storageUsage || generateStorageUsage());
      setApiResponseTime(response.data.apiResponseTime || generateApiResponseTime());
    } catch (error) {
      console.error('Error fetching system analytics:', error);
      // Generate sample data
      setMetrics({
        totalRequests: 125680,
        avgResponseTime: 245,
        totalStorage: 45.6,
        activeUsers: 1247,
      });
      setUserGrowth(generateUserGrowth());
      setActivityDistribution(generateActivityDistribution());
      setStorageUsage(generateStorageUsage());
      setApiResponseTime(generateApiResponseTime());
    } finally {
      setLoading(false);
    }
  };

  const generateUserGrowth = () => {
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: Math.floor(800 + i * 15 + Math.random() * 50),
      activeUsers: Math.floor(600 + i * 10 + Math.random() * 30),
      newUsers: Math.floor(20 + Math.random() * 15),
    }));
  };

  const generateActivityDistribution = () => {
    return [
      { name: 'Login', value: 3245, color: '#1976d2' },
      { name: 'Submission', value: 2856, color: '#388e3c' },
      { name: 'View Activity', value: 4521, color: '#f57c00' },
      { name: 'Grade Review', value: 1632, color: '#7b1fa2' },
      { name: 'File Upload', value: 987, color: '#d32f2f' },
      { name: 'Other', value: 564, color: '#0288d1' },
    ];
  };

  const generateStorageUsage = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, i) => ({
      month,
      storage: (10 + i * 3 + Math.random() * 2).toFixed(1),
      uploads: Math.floor(200 + i * 50 + Math.random() * 100),
    }));
  };

  const generateApiResponseTime = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => ({
      hour: `${hour}:00`,
      responseTime: Math.floor(150 + Math.random() * 200 + (hour >= 8 && hour <= 18 ? 100 : 0)),
      requests: Math.floor(500 + Math.random() * 500 + (hour >= 8 && hour <= 18 ? 1000 : 0)),
    }));
  };

  const COLORS = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#d32f2f', '#0288d1'];

  const metricCards = [
    {
      title: 'Total Requests',
      value: metrics.totalRequests?.toLocaleString() || '0',
      icon: <TrendingUpIcon />,
      color: '#1976d2',
      subtitle: 'Last 30 days',
    },
    {
      title: 'Avg Response Time',
      value: `${metrics.avgResponseTime || '0'}ms`,
      icon: <SpeedIcon />,
      color: '#388e3c',
      subtitle: 'System performance',
    },
    {
      title: 'Total Storage',
      value: `${metrics.totalStorage || '0'} GB`,
      icon: <StorageIcon />,
      color: '#f57c00',
      subtitle: 'Used storage',
    },
    {
      title: 'Active Users',
      value: metrics.activeUsers?.toLocaleString() || '0',
      icon: <PeopleIcon />,
      color: '#7b1fa2',
      subtitle: 'Currently active',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="System Analytics">
        <LoadingSpinner message="Loading analytics..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="System Analytics">
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            System Analytics
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="90days">Last 90 Days</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAnalytics}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Metric Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {metricCards.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                elevation={3}
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${metric.color}15 0%, ${metric.color}05 100%)`,
                  borderTop: `3px solid ${metric.color}`,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {metric.title}
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight={600} sx={{ my: 1 }}>
                        {metric.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {metric.subtitle}
                      </Typography>
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

        {/* Charts */}
        <Grid container spacing={3}>
          {/* User Growth Chart */}
          <Grid item xs={12} lg={8}>
            <CustomCard title="User Growth Trend" subtitle="Total and active users over time">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={userGrowth}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#388e3c" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#388e3c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#1976d2"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    name="Total Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#388e3c"
                    fillOpacity={1}
                    fill="url(#colorActive)"
                    name="Active Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>

          {/* Activity Distribution */}
          <Grid item xs={12} lg={4}>
            <CustomCard title="Activity Distribution" subtitle="Breakdown by action type">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={activityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {activityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>

          {/* Storage Usage */}
          <Grid item xs={12} lg={6}>
            <CustomCard title="Storage Usage" subtitle="Monthly storage consumption">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={storageUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" stroke="#f57c00" />
                  <YAxis yAxisId="right" orientation="right" stroke="#1976d2" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="storage" fill="#f57c00" name="Storage (GB)" />
                  <Bar yAxisId="right" dataKey="uploads" fill="#1976d2" name="Uploads" />
                </BarChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>

          {/* API Response Time */}
          <Grid item xs={12} lg={6}>
            <CustomCard title="API Response Time" subtitle="Average response time by hour">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={apiResponseTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#388e3c"
                    strokeWidth={2}
                    name="Response Time (ms)"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
};

export default SystemAnalytics;
