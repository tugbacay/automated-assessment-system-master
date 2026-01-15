import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
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
  PieChart,
  Pie,
  Cell,
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
import { format } from 'date-fns';

/**
 * MyProgress Component
 * Student progress analytics with charts and statistics
 */
const MyProgress = () => {
  const { user } = useAuth();
  const { loading, error, execute } = useApi();
  const [progressData, setProgressData] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  // Fetch progress data on component mount
  useEffect(() => {
    fetchProgressData();
    fetchSubmissions();
  }, []);

  const fetchProgressData = async () => {
    const result = await execute(
      () => api.get(ENDPOINTS.PROGRESS.SUMMARY_ME),
      { showErrorToast: true }
    );

    if (result.success) {
      setProgressData(result.data);
    }
  };

  const fetchSubmissions = async () => {
    const result = await execute(
      () => api.get(ENDPOINTS.SUBMISSIONS.STUDENT_ME),
      { showErrorToast: false }
    );

    if (result.success) {
      setSubmissions(result.data.submissions || result.data || []);
    }
  };

  // Prepare data for charts
  const prepareTimelineData = () => {
    if (!submissions || submissions.length === 0) return [];

    // Group submissions by date
    const grouped = submissions.reduce((acc, sub) => {
      if (sub.evaluationId?.overallScore !== undefined) {
        const date = format(new Date(sub.createdAt), 'MMM dd');
        if (!acc[date]) {
          acc[date] = { date, scores: [] };
        }
        acc[date].scores.push(sub.evaluationId.overallScore);
      }
      return acc;
    }, {});

    // Calculate average score per date
    return Object.values(grouped).map((item) => ({
      date: item.date,
      score: item.scores.reduce((sum, score) => sum + score, 0) / item.scores.length,
    }));
  };

  const prepareActivityTypeData = () => {
    if (!submissions || submissions.length === 0) return [];

    const types = {
      [ACTIVITY_TYPES.SPEAKING]: { name: 'Speaking', scores: [], count: 0 },
      [ACTIVITY_TYPES.WRITING]: { name: 'Writing', scores: [], count: 0 },
      [ACTIVITY_TYPES.QUIZ]: { name: 'Quiz', scores: [], count: 0 },
    };

    submissions.forEach((sub) => {
      const type = sub.activityId?.type;
      if (type && types[type] && sub.evaluationId?.overallScore !== undefined) {
        types[type].scores.push(sub.evaluationId.overallScore);
        types[type].count++;
      }
    });

    return Object.values(types)
      .filter((t) => t.count > 0)
      .map((t) => ({
        name: t.name,
        average: t.scores.reduce((sum, score) => sum + score, 0) / t.scores.length,
        count: t.count,
      }));
  };

  const prepareCompletionData = () => {
    if (!submissions || submissions.length === 0) return [];

    const total = submissions.length;
    const completed = submissions.filter((s) => s.status === 'completed').length;
    const pending = submissions.filter((s) => s.status === 'pending').length;
    const evaluating = submissions.filter((s) => s.status === 'evaluating').length;

    return [
      { name: 'Completed', value: completed, color: '#4caf50' },
      { name: 'Evaluating', value: evaluating, color: '#2196f3' },
      { name: 'Pending', value: pending, color: '#ff9800' },
    ].filter((item) => item.value > 0);
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
      id: 'score',
      label: 'Score',
      align: 'center',
      format: (value, row) =>
        row.evaluationId?.overallScore !== undefined
          ? `${row.evaluationId.overallScore.toFixed(1)}%`
          : '-',
    },
    {
      id: 'createdAt',
      label: 'Submitted',
      format: (value) => format(new Date(value), 'MMM dd, yyyy'),
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
  ];

  const calculateStats = () => {
    if (!submissions || submissions.length === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        completionRate: 0,
        bestScore: 0,
      };
    }

    const completedSubmissions = submissions.filter(
      (s) => s.evaluationId?.overallScore !== undefined
    );

    const scores = completedSubmissions.map((s) => s.evaluationId.overallScore);
    const averageScore =
      scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const completionRate = (completedSubmissions.length / submissions.length) * 100;

    return {
      totalSubmissions: submissions.length,
      averageScore,
      completionRate,
      bestScore,
    };
  };

  const stats = calculateStats();
  const timelineData = prepareTimelineData();
  const activityTypeData = prepareActivityTypeData();
  const completionData = prepareCompletionData();
  const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336'];

  if (loading && !progressData && submissions.length === 0) {
    return (
      <StudentLayout title="My Progress">
        <LoadingSpinner message="Loading progress data..." />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="My Progress">
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            My Progress
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your learning progress with detailed analytics and insights.
          </Typography>
        </Box>

        {error && (
          <ErrorMessage
            title="Error Loading Progress Data"
            message={error.message}
            onRetry={fetchProgressData}
          />
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Submissions
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.totalSubmissions}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Average Score
                  </Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {stats.averageScore.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StarIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Best Score
                  </Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {stats.bestScore.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                </Box>
                <Typography variant="h4" color="info.main">
                  {stats.completionRate.toFixed(0)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Progress Over Time */}
          {timelineData.length > 0 && (
            <Grid item xs={12} lg={8}>
              <CustomCard title="Progress Over Time">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#1976d2"
                      strokeWidth={2}
                      name="Average Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CustomCard>
            </Grid>
          )}

          {/* Completion Status */}
          {completionData.length > 0 && (
            <Grid item xs={12} lg={4}>
              <CustomCard title="Submission Status">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={completionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {completionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CustomCard>
            </Grid>
          )}

          {/* Performance by Activity Type */}
          {activityTypeData.length > 0 && (
            <Grid item xs={12}>
              <CustomCard title="Performance by Activity Type">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="average" fill="#1976d2" name="Average Score (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CustomCard>
            </Grid>
          )}
        </Grid>

        {/* Recent Submissions Table */}
        <CustomCard title="Recent Submissions">
          <DataTable
            columns={submissionColumns}
            rows={submissions.slice(0, 10)}
            emptyMessage="No submissions yet"
            pagination={false}
          />
        </CustomCard>
      </Box>
    </StudentLayout>
  );
};

export default MyProgress;
