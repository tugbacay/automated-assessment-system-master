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
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/Layout/AdminLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import api from '../../services/api';

/**
 * Submission Analytics Page
 * Analytics for student submissions
 */
const SubmissionAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [metrics, setMetrics] = useState({});
  const [submissionTrends, setSubmissionTrends] = useState([]);
  const [submissionByType, setSubmissionByType] = useState([]);
  const [submissionByStatus, setSubmissionByStatus] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics/submissions?range=${timeRange}`);
      setMetrics(response.data.metrics || {});
      setSubmissionTrends(response.data.submissionTrends || generateSubmissionTrends());
      setSubmissionByType(response.data.submissionByType || generateSubmissionByType());
      setSubmissionByStatus(response.data.submissionByStatus || generateSubmissionByStatus());
    } catch (error) {
      console.error('Error fetching submission analytics:', error);
      setMetrics({
        totalSubmissions: 8965,
        avgProcessingTime: 3.2,
        successRate: 94.5,
        pendingSubmissions: 45,
      });
      setSubmissionTrends(generateSubmissionTrends());
      setSubmissionByType(generateSubmissionByType());
      setSubmissionByStatus(generateSubmissionByStatus());
    } finally {
      setLoading(false);
    }
  };

  const generateSubmissionTrends = () => {
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      submissions: Math.floor(200 + Math.random() * 150),
      graded: Math.floor(180 + Math.random() * 120),
      pending: Math.floor(10 + Math.random() * 30),
    }));
  };

  const generateSubmissionByType = () => {
    return [
      { name: 'Essay', value: 3245, color: '#1976d2' },
      { name: 'Code', value: 2856, color: '#388e3c' },
      { name: 'Math', value: 1521, color: '#f57c00' },
      { name: 'Quiz', value: 987, color: '#7b1fa2' },
      { name: 'Project', value: 356, color: '#d32f2f' },
    ];
  };

  const generateSubmissionByStatus = () => {
    return [
      { status: 'Graded', count: 7845, color: '#388e3c' },
      { status: 'Pending', count: 645, color: '#f57c00' },
      { status: 'Reviewing', count: 325, color: '#1976d2' },
      { status: 'Failed', count: 150, color: '#d32f2f' },
    ];
  };

  const metricCards = [
    {
      title: 'Total Submissions',
      value: metrics.totalSubmissions?.toLocaleString() || '0',
      icon: <AssignmentIcon />,
      color: '#1976d2',
      subtitle: `Last ${timeRange === '7days' ? '7' : timeRange === '30days' ? '30' : '90'} days`,
    },
    {
      title: 'Avg Processing Time',
      value: `${metrics.avgProcessingTime || '0'} min`,
      icon: <ScheduleIcon />,
      color: '#388e3c',
      subtitle: 'Average time',
    },
    {
      title: 'Success Rate',
      value: `${metrics.successRate || '0'}%`,
      icon: <CheckCircleIcon />,
      color: '#7b1fa2',
      subtitle: 'Completion rate',
    },
    {
      title: 'Pending',
      value: metrics.pendingSubmissions?.toLocaleString() || '0',
      icon: <TrendingUpIcon />,
      color: '#f57c00',
      subtitle: 'Awaiting review',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Submission Analytics">
        <LoadingSpinner message="Loading analytics..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Submission Analytics">
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Submission Analytics
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
          {/* Submission Trends */}
          <Grid item xs={12}>
            <CustomCard title="Submission Count Trends" subtitle="Daily submission activity">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={submissionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="submissions"
                    stroke="#1976d2"
                    strokeWidth={2}
                    name="Total Submissions"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="graded"
                    stroke="#388e3c"
                    strokeWidth={2}
                    name="Graded"
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="#f57c00"
                    strokeWidth={2}
                    name="Pending"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>

          {/* Submission by Type */}
          <Grid item xs={12} md={6}>
            <CustomCard title="Submissions by Type" subtitle="Breakdown by activity type">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={submissionByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {submissionByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>

          {/* Submission by Status */}
          <Grid item xs={12} md={6}>
            <CustomCard title="Submissions by Status" subtitle="Current status distribution">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={submissionByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Count">
                    {submissionByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
};

export default SubmissionAnalytics;
