import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Badge,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import DataTable from '../../components/common/UI/DataTable';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import api from '../../services/api';

/**
 * Pending Reviews Page
 * List of pending student submissions awaiting teacher review
 */
const PendingReviews = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchTerm, filterType, filterPriority]);

  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/submissions/pending');
      setSubmissions(response.data?.submissions || []);
    } catch (err) {
      console.error('Error fetching pending reviews:', err);
      setError(err.response?.data?.message || 'Failed to load pending reviews');
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.activity?.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((sub) => sub.activity?.type === filterType);
    }

    // Filter by priority (based on submission date - older submissions have higher priority)
    if (filterPriority === 'high') {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      filtered = filtered.filter((sub) => new Date(sub.submittedAt) < threeDaysAgo);
    } else if (filterPriority === 'recent') {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      filtered = filtered.filter((sub) => new Date(sub.submittedAt) >= oneDayAgo);
    }

    // Sort by submission date (oldest first)
    filtered.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

    setFilteredSubmissions(filtered);
  };

  const getPriorityBadge = (submittedAt) => {
    const daysSinceSubmission = Math.floor(
      (new Date() - new Date(submittedAt)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceSubmission >= 5) {
      return <Chip label="Urgent" size="small" color="error" />;
    } else if (daysSinceSubmission >= 3) {
      return <Chip label="High Priority" size="small" color="warning" />;
    } else if (daysSinceSubmission >= 1) {
      return <Chip label="Normal" size="small" color="info" />;
    } else {
      return <Chip label="Recent" size="small" color="success" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'speaking':
        return 'primary';
      case 'writing':
        return 'secondary';
      case 'quiz':
        return 'info';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      id: 'priority',
      label: 'Priority',
      align: 'center',
      format: (value, row) => getPriorityBadge(row.submittedAt),
    },
    {
      id: 'student',
      label: 'Student',
      format: (value) => value?.name || 'Unknown',
    },
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
        <Chip
          label={row.activity?.type || 'N/A'}
          size="small"
          color={getTypeColor(row.activity?.type)}
          variant="outlined"
        />
      ),
    },
    {
      id: 'submittedAt',
      label: 'Submitted',
      format: (value) => {
        const date = new Date(value);
        const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
        return (
          <Box>
            <Typography variant="body2">{format(date, 'MMM dd, yyyy')}</Typography>
            <Typography variant="caption" color="text.secondary">
              {daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'aiScore',
      label: 'AI Score',
      align: 'center',
      format: (value) =>
        value ? (
          <Chip label={`${value}%`} size="small" color="default" />
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
      <TeacherLayout title="Pending Reviews">
        <LoadingSpinner message="Loading pending reviews..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title="Pending Reviews">
        <ErrorMessage
          title="Error Loading Reviews"
          message={error}
          onRetry={fetchPendingReviews}
        />
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Pending Reviews">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Pending Reviews
              <Badge
                badgeContent={filteredSubmissions.length}
                color="warning"
                sx={{ ml: 2 }}
                max={99}
              />
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review and evaluate student submissions awaiting your feedback.
            </Typography>
          </Box>
        </Box>

        {/* Filters */}
        <CustomCard>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search by student or activity..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FilterIcon color="action" />
              <ToggleButtonGroup
                value={filterType}
                exclusive
                onChange={(e, newType) => newType && setFilterType(newType)}
                size="small"
              >
                <ToggleButton value="all">All Types</ToggleButton>
                <ToggleButton value="speaking">Speaking</ToggleButton>
                <ToggleButton value="writing">Writing</ToggleButton>
                <ToggleButton value="quiz">Quiz</ToggleButton>
              </ToggleButtonGroup>

              <ToggleButtonGroup
                value={filterPriority}
                exclusive
                onChange={(e, newPriority) => newPriority && setFilterPriority(newPriority)}
                size="small"
              >
                <ToggleButton value="all">All Priority</ToggleButton>
                <ToggleButton value="high">High Priority</ToggleButton>
                <ToggleButton value="recent">Recent</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </CustomCard>
      </Box>

      {/* Submissions Table */}
      <CustomCard title={`Submissions (${filteredSubmissions.length})`}>
        <DataTable
          columns={columns}
          rows={filteredSubmissions}
          emptyMessage="No pending reviews"
          emptyIcon={ReviewIcon}
          onRowClick={(row) => navigate(`/teacher/review/${row._id}`)}
        />
      </CustomCard>
    </TeacherLayout>
  );
};

export default PendingReviews;
