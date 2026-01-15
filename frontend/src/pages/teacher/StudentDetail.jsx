import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import DataTable from '../../components/common/UI/DataTable';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import api from '../../services/api';

/**
 * Student Detail Page
 * Detailed view of individual student performance and submissions
 */
const StudentDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [statistics, setStatistics] = useState({
    totalSubmissions: 0,
    avgScore: 0,
    completionRate: 0,
    pendingReviews: 0,
  });
  const [performanceTrend, setPerformanceTrend] = useState([]);
  const [skillsRadar, setSkillsRadar] = useState([]);

  useEffect(() => {
    fetchStudentDetails();
  }, [id]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [studentRes, submissionsRes, statsRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/submissions/student/${id}`),
        api.get(`/teacher/students/${id}/statistics`),
      ]);

      setStudent(studentRes.data?.user);
      setSubmissions(submissionsRes.data?.submissions || []);

      // Set statistics
      const stats = statsRes.data?.statistics;
      setStatistics({
        totalSubmissions: stats?.totalSubmissions || 0,
        avgScore: stats?.avgScore || 0,
        completionRate: stats?.completionRate || 0,
        pendingReviews: stats?.pendingReviews || 0,
      });

      // Generate performance trend
      const trend = generatePerformanceTrend(submissionsRes.data?.submissions || []);
      setPerformanceTrend(trend);

      // Generate skills radar
      const skills = generateSkillsRadar(submissionsRes.data?.submissions || []);
      setSkillsRadar(skills);
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError(err.response?.data?.message || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const generatePerformanceTrend = (submissions) => {
    return submissions
      .filter((sub) => sub.status === 'reviewed' && sub.totalScore !== undefined)
      .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
      .slice(-10)
      .map((sub) => ({
        date: format(new Date(sub.submittedAt), 'MMM dd'),
        score: sub.totalScore,
        activity: sub.activity?.title?.substring(0, 15) + '...',
      }));
  };

  const generateSkillsRadar = (submissions) => {
    const skillCategories = {
      Speaking: 0,
      Writing: 0,
      Quiz: 0,
    };

    const skillCounts = {
      Speaking: 0,
      Writing: 0,
      Quiz: 0,
    };

    submissions
      .filter((sub) => sub.status === 'reviewed' && sub.totalScore !== undefined)
      .forEach((sub) => {
        const type = sub.activity?.type;
        if (type === 'speaking') {
          skillCategories.Speaking += sub.totalScore;
          skillCounts.Speaking++;
        } else if (type === 'writing') {
          skillCategories.Writing += sub.totalScore;
          skillCounts.Writing++;
        } else if (type === 'quiz') {
          skillCategories.Quiz += sub.totalScore;
          skillCounts.Quiz++;
        }
      });

    return Object.keys(skillCategories).map((skill) => ({
      skill,
      score: skillCounts[skill] > 0 ? skillCategories[skill] / skillCounts[skill] : 0,
    }));
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const columns = [
    {
      id: 'activity',
      label: 'Activity',
      minWidth: 200,
      format: (value) => value?.title || 'N/A',
    },
    {
      id: 'type',
      label: 'Type',
      align: 'center',
      format: (value, row) => (
        <Chip label={row.activity?.type || 'N/A'} size="small" color="primary" variant="outlined" />
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
      align: 'center',
      format: (value) => (
        <Chip
          label={value}
          size="small"
          color={value === 'reviewed' ? 'success' : value === 'pending' ? 'warning' : 'default'}
        />
      ),
    },
    {
      id: 'totalScore',
      label: 'Score',
      align: 'center',
      format: (value) =>
        value !== undefined ? (
          <Chip label={`${value}%`} size="small" color="info" />
        ) : (
          <Typography variant="body2" color="text.secondary">
            N/A
          </Typography>
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
      <TeacherLayout title="Student Details">
        <LoadingSpinner message="Loading student details..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title="Student Details">
        <ErrorMessage
          title="Error Loading Student"
          message={error}
          onRetry={fetchStudentDetails}
        />
      </TeacherLayout>
    );
  }

  if (!student) {
    return (
      <TeacherLayout title="Student Details">
        <ErrorMessage title="Student Not Found" message="The requested student could not be found." />
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Student Details">
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/students')}
          sx={{ mb: 2 }}
        >
          Back to Students
        </Button>
      </Box>

      {/* Student Profile Card */}
      <CustomCard sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 80,
              height: 80,
              fontSize: '2rem',
            }}
          >
            {getInitials(student.name)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
              {student.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {student.email}
                </Typography>
              </Box>
              {student.studentId && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SchoolIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {student.studentId}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </CustomCard>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Submissions
                  </Typography>
                  <Typography variant="h4">{statistics.totalSubmissions}</Typography>
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
                    Average Score
                  </Typography>
                  <Typography variant="h4">{statistics.avgScore.toFixed(1)}%</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.7 }} />
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
                    Completion Rate
                  </Typography>
                  <Typography variant="h4">{statistics.completionRate.toFixed(0)}%</Typography>
                </Box>
                <SchoolIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.7 }} />
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
                  <Typography variant="h4">{statistics.pendingReviews}</Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <CustomCard title="Performance Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Score (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CustomCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <CustomCard title="Skills Assessment">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={skillsRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Performance" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CustomCard>
        </Grid>
      </Grid>

      {/* Submissions History */}
      <CustomCard title="Submission History">
        <DataTable
          columns={columns}
          rows={submissions}
          emptyMessage="No submissions yet"
          emptyIcon={AssignmentIcon}
          onRowClick={(row) => navigate(`/teacher/review/${row._id}`)}
        />
      </CustomCard>
    </TeacherLayout>
  );
};

export default StudentDetail;
