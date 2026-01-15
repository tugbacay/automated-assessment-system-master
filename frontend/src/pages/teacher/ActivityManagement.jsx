import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import DataTable from '../../components/common/UI/DataTable';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import ConfirmDialog from '../../components/common/UI/ConfirmDialog';
import api from '../../services/api';
import { toast } from 'react-toastify';

/**
 * Activity Management Page
 * List, filter, edit, and delete teacher's activities
 */
const ActivityManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, filterType, filterStatus]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/activities/teacher/me');
      setActivities(response.data?.activities || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err.response?.data?.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = [...activities];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (activity) =>
          activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((activity) => activity.type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((activity) => activity.status === filterStatus);
    }

    setFilteredActivities(filtered);
  };

  const handleMenuOpen = (event, activity) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedActivity(activity);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedActivity(null);
  };

  const handleEdit = () => {
    if (selectedActivity) {
      navigate(`/teacher/activities/edit/${selectedActivity._id}`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (selectedActivity) {
      setActivityToDelete(selectedActivity);
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!activityToDelete) return;

    try {
      await api.delete(`/activities/${activityToDelete._id}`);
      toast.success('Activity deleted successfully');
      setActivities((prev) => prev.filter((a) => a._id !== activityToDelete._id));
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    } catch (err) {
      console.error('Error deleting activity:', err);
      toast.error(err.response?.data?.message || 'Failed to delete activity');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'default';
      case 'archived':
        return 'warning';
      default:
        return 'default';
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
      id: 'title',
      label: 'Title',
      minWidth: 200,
    },
    {
      id: 'type',
      label: 'Type',
      align: 'center',
      format: (value) => (
        <Chip
          label={value}
          size="small"
          color={getTypeColor(value)}
          variant="outlined"
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      format: (value) => (
        <Chip
          label={value}
          size="small"
          color={getStatusColor(value)}
        />
      ),
    },
    {
      id: 'rubric',
      label: 'Rubric',
      format: (value) => value?.name || 'No rubric',
    },
    {
      id: 'deadline',
      label: 'Deadline',
      format: (value) => (value ? format(new Date(value), 'MMM dd, yyyy') : 'No deadline'),
    },
    {
      id: 'submissions',
      label: 'Submissions',
      align: 'center',
      format: (value, row) => row.submissionCount || 0,
    },
    {
      id: 'createdAt',
      label: 'Created',
      format: (value) => format(new Date(value), 'MMM dd, yyyy'),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      format: (value, row) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, row)}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  if (loading) {
    return (
      <TeacherLayout title="Activity Management">
        <LoadingSpinner message="Loading activities..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title="Activity Management">
        <ErrorMessage
          title="Error Loading Activities"
          message={error}
          onRetry={fetchActivities}
        />
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Activity Management">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Activity Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your activities, view submissions, and track student progress.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/teacher/activities/create')}
          >
            Create Activity
          </Button>
        </Box>

        {/* Filters */}
        <CustomCard>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search activities..."
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

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FilterIcon color="action" />
              <ToggleButtonGroup
                value={filterType}
                exclusive
                onChange={(e, newType) => newType && setFilterType(newType)}
                size="small"
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="speaking">Speaking</ToggleButton>
                <ToggleButton value="writing">Writing</ToggleButton>
                <ToggleButton value="quiz">Quiz</ToggleButton>
              </ToggleButtonGroup>

              <ToggleButtonGroup
                value={filterStatus}
                exclusive
                onChange={(e, newStatus) => newStatus && setFilterStatus(newStatus)}
                size="small"
              >
                <ToggleButton value="all">All Status</ToggleButton>
                <ToggleButton value="active">Active</ToggleButton>
                <ToggleButton value="draft">Draft</ToggleButton>
                <ToggleButton value="archived">Archived</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </CustomCard>
      </Box>

      {/* Activities Table */}
      <CustomCard title={`Activities (${filteredActivities.length})`}>
        <DataTable
          columns={columns}
          rows={filteredActivities}
          emptyMessage="No activities found"
          onRowClick={(row) => navigate(`/teacher/activities/${row._id}`)}
        />
      </CustomCard>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Activity"
        message={`Are you sure you want to delete "${activityToDelete?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setActivityToDelete(null);
        }}
        confirmText="Delete"
        confirmColor="error"
      />
    </TeacherLayout>
  );
};

export default ActivityManagement;
