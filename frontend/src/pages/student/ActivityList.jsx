import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Mic as MicIcon,
  Edit as EditIcon,
  Quiz as QuizIcon,
  PlayArrow as PlayArrowIcon,
  EventAvailable as EventAvailableIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import StudentLayout from '../../components/common/Layout/StudentLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import EmptyState from '../../components/common/UI/EmptyState';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import useApi from '../../hooks/useApi';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { ACTIVITY_TYPES } from '../../utils/constants';
import { format } from 'date-fns';

/**
 * ActivityList Component
 * Display list of available activities with filtering and navigation
 */
const ActivityList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, error, execute } = useApi();
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');

  // Fetch activities on component mount
  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    const result = await execute(
      () => api.get('/activities'),
      { showErrorToast: true }
    );

    if (result.success) {
      setActivities(result.data.activities || result.data || []);
    }
  };

  // Filter activities by type
  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'all') return true;
    return activity.type === filter;
  });

  // Navigate to appropriate submission page based on activity type
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

  // Get icon based on activity type
  const getActivityIcon = (type) => {
    const icons = {
      [ACTIVITY_TYPES.SPEAKING]: <MicIcon />,
      [ACTIVITY_TYPES.WRITING]: <EditIcon />,
      [ACTIVITY_TYPES.QUIZ]: <QuizIcon />,
    };
    return icons[type] || <AssignmentIcon />;
  };

  // Get chip color based on activity type
  const getActivityColor = (type) => {
    const colors = {
      [ACTIVITY_TYPES.SPEAKING]: 'primary',
      [ACTIVITY_TYPES.WRITING]: 'secondary',
      [ACTIVITY_TYPES.QUIZ]: 'success',
    };
    return colors[type] || 'default';
  };

  // Get status chip for activity
  const getStatusChip = (activity) => {
    if (activity.isCompleted) {
      return <Chip icon={<CheckCircleIcon />} label="Completed" color="success" size="small" />;
    }

    if (activity.deadline) {
      const deadline = new Date(activity.deadline);
      const now = new Date();
      const isOverdue = deadline < now;

      if (isOverdue) {
        return <Chip icon={<ScheduleIcon />} label="Overdue" color="error" size="small" />;
      }

      return <Chip icon={<EventAvailableIcon />} label="Active" color="warning" size="small" />;
    }

    return <Chip label="Available" color="info" size="small" />;
  };

  if (loading && activities.length === 0) {
    return (
      <StudentLayout title="Activities">
        <LoadingSpinner message="Loading activities..." />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Activities">
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Available Activities
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse and select activities to complete. Filter by type to find specific activities.
          </Typography>
        </Box>

        {error && (
          <ErrorMessage
            title="Error Loading Activities"
            message={error.message}
            onRetry={fetchActivities}
          />
        )}

        {/* Filter Buttons */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={handleFilterChange}
            aria-label="activity type filter"
          >
            <ToggleButton value="all" aria-label="all activities">
              All Activities
            </ToggleButton>
            <ToggleButton value={ACTIVITY_TYPES.SPEAKING} aria-label="speaking activities">
              <MicIcon sx={{ mr: 1 }} />
              Speaking
            </ToggleButton>
            <ToggleButton value={ACTIVITY_TYPES.WRITING} aria-label="writing activities">
              <EditIcon sx={{ mr: 1 }} />
              Writing
            </ToggleButton>
            <ToggleButton value={ACTIVITY_TYPES.QUIZ} aria-label="quiz activities">
              <QuizIcon sx={{ mr: 1 }} />
              Quiz
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Activities Grid */}
        {filteredActivities.length === 0 ? (
          <EmptyState
            icon={AssignmentIcon}
            title="No Activities Found"
            message={
              filter === 'all'
                ? 'There are no activities available at the moment.'
                : `No ${filter} activities available.`
            }
            actionLabel={filter !== 'all' ? 'Show All Activities' : undefined}
            onAction={filter !== 'all' ? () => setFilter('all') : undefined}
          />
        ) : (
          <Grid container spacing={3}>
            {filteredActivities.map((activity) => (
              <Grid item xs={12} sm={6} md={4} key={activity._id}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          mr: 2,
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {getActivityIcon(activity.type)}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Chip
                          label={activity.type}
                          color={getActivityColor(activity.type)}
                          size="small"
                        />
                      </Box>
                      {getStatusChip(activity)}
                    </Box>

                    <Typography variant="h6" gutterBottom>
                      {activity.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {activity.description || 'No description provided.'}
                    </Typography>

                    {activity.deadline && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <EventAvailableIcon
                          fontSize="small"
                          sx={{ mr: 1, color: 'text.secondary' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Due: {format(new Date(activity.deadline), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </Box>
                    )}

                    {activity.duration && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <ScheduleIcon
                          fontSize="small"
                          sx={{ mr: 1, color: 'text.secondary' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Duration: {activity.duration} minutes
                        </Typography>
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant={activity.isCompleted ? 'outlined' : 'contained'}
                      color="primary"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleStartActivity(activity)}
                    >
                      {activity.isCompleted ? 'View Submission' : 'Start Activity'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </StudentLayout>
  );
};

export default ActivityList;
