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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
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
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';

/**
 * Rubric Management Page
 * List, filter, edit, and delete teacher's rubrics
 */
const RubricManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rubrics, setRubrics] = useState([]);
  const [filteredRubrics, setFilteredRubrics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRubric, setSelectedRubric] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rubricToDelete, setRubricToDelete] = useState(null);
  const [expandedRubric, setExpandedRubric] = useState(null);

  useEffect(() => {
    fetchRubrics();
  }, []);

  useEffect(() => {
    filterRubrics();
  }, [rubrics, searchTerm, filterType]);

  const fetchRubrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/rubrics/teacher/${user._id}`);
      setRubrics(response.data?.rubrics || []);
    } catch (err) {
      console.error('Error fetching rubrics:', err);
      setError(err.response?.data?.message || 'Failed to load rubrics');
    } finally {
      setLoading(false);
    }
  };

  const filterRubrics = () => {
    let filtered = [...rubrics];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (rubric) =>
          rubric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rubric.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((rubric) => rubric.type === filterType);
    }

    setFilteredRubrics(filtered);
  };

  const handleMenuOpen = (event, rubric) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRubric(rubric);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRubric(null);
  };

  const handleEdit = () => {
    if (selectedRubric) {
      navigate(`/teacher/rubrics/edit/${selectedRubric._id}`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (selectedRubric) {
      setRubricToDelete(selectedRubric);
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!rubricToDelete) return;

    try {
      await api.delete(`/rubrics/${rubricToDelete._id}`);
      toast.success('Rubric deleted successfully');
      setRubrics((prev) => prev.filter((r) => r._id !== rubricToDelete._id));
      setDeleteDialogOpen(false);
      setRubricToDelete(null);
    } catch (err) {
      console.error('Error deleting rubric:', err);
      toast.error(err.response?.data?.message || 'Failed to delete rubric');
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
      id: 'name',
      label: 'Rubric Name',
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
      id: 'description',
      label: 'Description',
      minWidth: 250,
      format: (value) => value || 'No description',
    },
    {
      id: 'criteria',
      label: 'Criteria',
      align: 'center',
      format: (value) => value?.length || 0,
    },
    {
      id: 'maxScore',
      label: 'Max Score',
      align: 'center',
      format: (value, row) => {
        const total = row.criteria?.reduce((sum, c) => sum + (c.maxScore || 0), 0) || 0;
        return total;
      },
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
      <TeacherLayout title="Rubric Management">
        <LoadingSpinner message="Loading rubrics..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title="Rubric Management">
        <ErrorMessage
          title="Error Loading Rubrics"
          message={error}
          onRetry={fetchRubrics}
        />
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Rubric Management">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Rubric Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your evaluation rubrics and grading criteria.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/teacher/rubrics/create')}
          >
            Create Rubric
          </Button>
        </Box>

        {/* Filters */}
        <CustomCard>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search rubrics..."
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
                <ToggleButton value="all">All Types</ToggleButton>
                <ToggleButton value="speaking">Speaking</ToggleButton>
                <ToggleButton value="writing">Writing</ToggleButton>
                <ToggleButton value="quiz">Quiz</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </CustomCard>
      </Box>

      {/* Rubrics Table */}
      <CustomCard title={`Rubrics (${filteredRubrics.length})`}>
        <DataTable
          columns={columns}
          rows={filteredRubrics}
          emptyMessage="No rubrics found"
          emptyIcon={AssignmentIcon}
          onRowClick={(row) => {
            setExpandedRubric(expandedRubric === row._id ? null : row._id);
          }}
        />

        {/* Expanded Rubric Details */}
        {filteredRubrics.map((rubric) => (
          expandedRubric === rubric._id && (
            <Box key={rubric._id} sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Criteria for {rubric.name}
              </Typography>
              <List>
                {rubric.criteria?.map((criterion, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {criterion.name}
                          </Typography>
                          <Chip label={`${criterion.maxScore} pts`} size="small" color="primary" />
                        </Box>
                      }
                      secondary={criterion.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )
        ))}
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
        title="Delete Rubric"
        message={`Are you sure you want to delete "${rubricToDelete?.name}"? This action cannot be undone and may affect existing activities.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setRubricToDelete(null);
        }}
        confirmText="Delete"
        confirmColor="error"
      />
    </TeacherLayout>
  );
};

export default RubricManagement;
