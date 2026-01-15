import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import DataTable from '../../components/common/UI/DataTable';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import api from '../../services/api';

/**
 * Student List Page
 * View all students and their performance overview
 */
const StudentList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/teacher/students');
      setStudents(response.data?.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  };

  const getPerformanceColor = (avgScore) => {
    if (avgScore >= 90) return 'success';
    if (avgScore >= 75) return 'info';
    if (avgScore >= 60) return 'warning';
    return 'error';
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const columns = [
    {
      id: 'avatar',
      label: '',
      align: 'center',
      format: (value, row) => (
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 40,
            height: 40,
          }}
        >
          {getInitials(row.name)}
        </Avatar>
      ),
    },
    {
      id: 'name',
      label: 'Student Name',
      minWidth: 200,
    },
    {
      id: 'email',
      label: 'Email',
      minWidth: 200,
    },
    {
      id: 'studentId',
      label: 'Student ID',
      format: (value) => value || 'N/A',
    },
    {
      id: 'submissionCount',
      label: 'Submissions',
      align: 'center',
      format: (value) => value || 0,
    },
    {
      id: 'avgScore',
      label: 'Avg Score',
      align: 'center',
      format: (value) => (
        <Chip
          label={value ? `${value.toFixed(1)}%` : 'N/A'}
          size="small"
          color={value ? getPerformanceColor(value) : 'default'}
        />
      ),
    },
    {
      id: 'lastSubmission',
      label: 'Last Activity',
      format: (value) => {
        if (!value) return 'No submissions';
        const date = new Date(value);
        const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
        if (daysAgo === 0) return 'Today';
        if (daysAgo === 1) return 'Yesterday';
        return `${daysAgo} days ago`;
      },
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
            navigate(`/teacher/students/${row._id}`);
          }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  if (loading) {
    return (
      <TeacherLayout title="Students">
        <LoadingSpinner message="Loading students..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title="Students">
        <ErrorMessage
          title="Error Loading Students"
          message={error}
          onRetry={fetchStudents}
        />
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Students">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Student List
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View student performance and track their progress.
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <CustomCard>
          <TextField
            placeholder="Search students by name, email, or ID..."
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CustomCard>
      </Box>

      {/* Students Table */}
      <CustomCard title={`Students (${filteredStudents.length})`}>
        <DataTable
          columns={columns}
          rows={filteredStudents}
          emptyMessage="No students found"
          emptyIcon={PeopleIcon}
          onRowClick={(row) => navigate(`/teacher/students/${row._id}`)}
        />
      </CustomCard>
    </TeacherLayout>
  );
};

export default StudentList;
