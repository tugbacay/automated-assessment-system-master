import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import api from '../../services/api';

/**
 * Teacher Analytics Page
 * Comprehensive analytics and insights for teacher
 */
const TeacherAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [overview, setOverview] = useState({
    totalStudents: 0,
    totalActivities: 0,
    totalSubmissions: 0,
    avgScore: 0,
    completionRate: 0,
  });
  const [activityTypeDistribution, setActivityTypeDistribution] = useState([]);
  const [submissionTrends, setSubmissionTrends] = useState([]);
  const [performanceByActivity, setPerformanceByActivity] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [needsAttention, setNeedsAttention] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [avgScoreByType, setAvgScoreByType] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/teacher/analytics?timeRange=${timeRange}`);
      const data = response.data;

      // Set overview data
      setOverview({
        totalStudents: data.totalStudents || 0,
        totalActivities: data.totalActivities || 0,
        totalSubmissions: data.totalSubmissions || 0,
        avgScore: data.avgScore || 0,
        completionRate: data.completionRate || 0,
      });

      // Activity type distribution
      setActivityTypeDistribution([
        { name: 'Speaking', value: data.speakingActivities || 0, color: '#8884d8' },
        { name: 'Writing', value: data.writingActivities || 0, color: '#82ca9d' },
        { name: 'Quiz', value: data.quizActivities || 0, color: '#ffc658' },
      ]);

      // Submission trends
      setSubmissionTrends(data.submissionTrends || []);

      // Performance by activity
      setPerformanceByActivity(data.performanceByActivity || []);

      // Top performers
      setTopPerformers(data.topPerformers || []);

      // Students needing attention
      setNeedsAttention(data.needsAttention || []);

      // Grade distribution
      setGradeDistribution([
        { grade: 'A (90-100)', count: data.gradeA || 0 },
        { grade: 'B (80-89)', count: data.gradeB || 0 },
        { grade: 'C (70-79)', count: data.gradeC || 0 },
        { grade: 'D (60-69)', count: data.gradeD || 0 },
        { grade: 'F (<60)', count: data.gradeF || 0 },
      ]);

      // Average score by activity type
      setAvgScoreByType([
        { type: 'Speaking', score: data.avgSpeakingScore || 0 },
        { type: 'Writing', score: data.avgWritingScore || 0 },
        { type: 'Quiz', score: data.avgQuizScore || 0 },
      ]);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

  if (loading) {
    return (
      <TeacherLayout title="Analytics">
        <LoadingSpinner message="Loading analytics..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title="Analytics">
        <ErrorMessage
          title="Error Loading Analytics"
          message={error}
          onRetry={fetchAnalytics}
        />
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Analytics">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Teaching Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive insights into your teaching activities and student performance.
            </Typography>
          </Box>
          <TextField
            select
            size="small"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="7">Last 7 Days</MenuItem>
            <MenuItem value="30">Last 30 Days</MenuItem>
            <MenuItem value="90">Last 90 Days</MenuItem>
            <MenuItem value="365">Last Year</MenuItem>
          </TextField>
        </Box>
      </Box>

      {/* Overview Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Students
                  </Typography>
                  <Typography variant="h4">{overview.totalStudents}</Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Activities
                  </Typography>
                  <Typography variant="h4">{overview.totalActivities}</Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Submissions
                  </Typography>
                  <Typography variant="h4">{overview.totalSubmissions}</Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Avg Score
                  </Typography>
                  <Typography variant="h4">{overview.avgScore.toFixed(1)}%</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Completion Rate
                  </Typography>
                  <Typography variant="h4">{overview.completionRate.toFixed(0)}%</Typography>
                </Box>
                <TimerIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <CustomCard title="Submission Trends">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={submissionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="submissions" stroke="#8884d8" strokeWidth={2} name="Submissions" />
                <Line type="monotone" dataKey="avgScore" stroke="#82ca9d" strokeWidth={2} name="Avg Score (%)" />
              </LineChart>
            </ResponsiveContainer>
          </CustomCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <CustomCard title="Activity Type Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {activityTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CustomCard>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <CustomCard title="Performance by Activity">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceByActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="activity" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgScore" fill="#8884d8" name="Avg Score (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CustomCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <CustomCard title="Grade Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CustomCard>
        </Grid>
      </Grid>

      {/* Charts Row 3 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <CustomCard title="Average Score by Activity Type">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={avgScoreByType}>
                <PolarGrid />
                <PolarAngleAxis dataKey="type" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Avg Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CustomCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <CustomCard title="Top Performers">
                <List>
                  {topPerformers.length > 0 ? (
                    topPerformers.map((student, index) => (
                      <Box key={student._id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1">
                                  {index + 1}. {student.name}
                                </Typography>
                                <Typography variant="h6" color="success.main">
                                  {student.avgScore.toFixed(1)}%
                                </Typography>
                              </Box>
                            }
                            secondary={`${student.submissionCount} submissions`}
                          />
                        </ListItem>
                        {index < topPerformers.length - 1 && <Divider />}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                      No data available
                    </Typography>
                  )}
                </List>
              </CustomCard>
            </Grid>

            <Grid item xs={12}>
              <CustomCard title="Students Needing Attention">
                <List>
                  {needsAttention.length > 0 ? (
                    needsAttention.map((student, index) => (
                      <Box key={student._id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1">{student.name}</Typography>
                                <Typography variant="h6" color="error.main">
                                  {student.avgScore.toFixed(1)}%
                                </Typography>
                              </Box>
                            }
                            secondary={`${student.submissionCount} submissions`}
                          />
                        </ListItem>
                        {index < needsAttention.length - 1 && <Divider />}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                      All students performing well
                    </Typography>
                  )}
                </List>
              </CustomCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </TeacherLayout>
  );
};

export default TeacherAnalytics;
