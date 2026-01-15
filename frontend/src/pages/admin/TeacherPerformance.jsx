import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Star as StarIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/Layout/AdminLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import DataTable from '../../components/common/UI/DataTable';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import api from '../../services/api';

/**
 * Teacher Performance Page
 * Teacher performance metrics
 */
const TeacherPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [metrics, setMetrics] = useState({});
  const [teacherRankings, setTeacherRankings] = useState([]);
  const [reviewTimeChart, setReviewTimeChart] = useState([]);
  const [qualityScores, setQualityScores] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics/teachers?range=${timeRange}`);
      setMetrics(response.data.metrics || {});
      setTeacherRankings(response.data.teacherRankings || generateTeacherRankings());
      setReviewTimeChart(response.data.reviewTime || generateReviewTime());
      setQualityScores(response.data.qualityScores || generateQualityScores());
    } catch (error) {
      console.error('Error fetching teacher analytics:', error);
      setMetrics({
        avgReviewTime: 2.3,
        avgQualityScore: 4.2,
        totalActivities: 324,
        avgSatisfaction: 4.5,
      });
      setTeacherRankings(generateTeacherRankings());
      setReviewTimeChart(generateReviewTime());
      setQualityScores(generateQualityScores());
    } finally {
      setLoading(false);
    }
  };

  const generateTeacherRankings = () => {
    const teachers = ['Dr. Smith', 'Prof. Johnson', 'Ms. Davis', 'Mr. Brown', 'Dr. Wilson', 'Prof. Taylor', 'Ms. Anderson', 'Mr. Lee'];
    return teachers.map((name, i) => ({
      id: i + 1,
      name,
      activitiesCreated: Math.floor(50 - i * 5 + Math.random() * 10),
      avgReviewTime: (1.5 + Math.random() * 2).toFixed(1),
      qualityScore: (4.8 - i * 0.1).toFixed(1),
      satisfaction: (4.7 - i * 0.08).toFixed(1),
      studentsHelped: Math.floor(120 - i * 10 + Math.random() * 20),
    }));
  };

  const generateReviewTime = () => {
    const teachers = ['Dr. Smith', 'Prof. Johnson', 'Ms. Davis', 'Mr. Brown', 'Dr. Wilson'];
    return teachers.map(name => ({
      teacher: name,
      avgTime: (1.5 + Math.random() * 2).toFixed(1),
    }));
  };

  const generateQualityScores = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      score: (4.0 + Math.random() * 0.8).toFixed(1),
    }));
  };

  const metricCards = [
    {
      title: 'Avg Review Time',
      value: `${metrics.avgReviewTime || '0'} hrs`,
      icon: <ScheduleIcon />,
      color: '#1976d2',
      subtitle: 'Per submission',
    },
    {
      title: 'Avg Quality Score',
      value: `${metrics.avgQualityScore || '0'}/5`,
      icon: <StarIcon />,
      color: '#388e3c',
      subtitle: 'Teacher quality',
    },
    {
      title: 'Total Activities',
      value: metrics.totalActivities?.toLocaleString() || '0',
      icon: <AssignmentIcon />,
      color: '#f57c00',
      subtitle: 'Created',
    },
    {
      title: 'Avg Satisfaction',
      value: `${metrics.avgSatisfaction || '0'}/5`,
      icon: <TrendingUpIcon />,
      color: '#7b1fa2',
      subtitle: 'Student rating',
    },
  ];

  const rankingColumns = [
    { id: 'id', label: 'Rank', minWidth: 70 },
    { id: 'name', label: 'Teacher', minWidth: 150 },
    { id: 'activitiesCreated', label: 'Activities', minWidth: 100 },
    { id: 'avgReviewTime', label: 'Avg Review (hrs)', minWidth: 130 },
    { id: 'qualityScore', label: 'Quality', minWidth: 100 },
    { id: 'satisfaction', label: 'Satisfaction', minWidth: 120 },
    { id: 'studentsHelped', label: 'Students', minWidth: 100 },
  ];

  if (loading) {
    return (
      <AdminLayout title="Teacher Performance">
        <LoadingSpinner message="Loading teacher analytics..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Teacher Performance">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Teacher Performance
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Time Range</InputLabel>
              <Select value={timeRange} label="Time Range" onChange={(e) => setTimeRange(e.target.value)}>
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="90days">Last 90 Days</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchAnalytics}>Refresh</Button>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {metricCards.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card elevation={3} sx={{ height: '100%', background: `linear-gradient(135deg, ${metric.color}15 0%, ${metric.color}05 100%)`, borderTop: `3px solid ${metric.color}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>{metric.title}</Typography>
                      <Typography variant="h4" component="div" fontWeight={600} sx={{ my: 1 }}>{metric.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{metric.subtitle}</Typography>
                    </Box>
                    <Box sx={{ color: metric.color, opacity: 0.8 }}>{metric.icon}</Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <CustomCard title="Teacher Rankings" subtitle="Top performing teachers">
              <DataTable columns={rankingColumns} rows={teacherRankings} defaultRowsPerPage={10} />
            </CustomCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomCard title="Average Review Time" subtitle="Time spent reviewing by teacher">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reviewTimeChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="teacher" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgTime" fill="#1976d2" name="Avg Time (hrs)" />
                </BarChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomCard title="Quality Score Trend" subtitle="Average quality scores over time">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={qualityScores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#388e3c" strokeWidth={2} name="Quality Score" />
                </LineChart>
              </ResponsiveContainer>
            </CustomCard>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
};

export default TeacherPerformance;
