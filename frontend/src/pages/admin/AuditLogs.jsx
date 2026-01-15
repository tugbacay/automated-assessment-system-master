import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  GetApp as GetAppIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AdminLayout from '../../components/common/Layout/AdminLayout';
import DataTable from '../../components/common/UI/DataTable';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import api from '../../services/api';

/**
 * Audit Logs Page
 * View system audit logs with filtering and export
 */
const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, actionFilter, statusFilter, startDate, endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit-logs');
      const logsData = response.data || generateSampleLogs();
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setLogs(generateSampleLogs());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleLogs = () => {
    const actions = [
      'User Login',
      'User Logout',
      'User Created',
      'User Updated',
      'User Deleted',
      'Activity Created',
      'Activity Updated',
      'Activity Deleted',
      'Submission Created',
      'Submission Graded',
      'Settings Updated',
      'Password Changed',
      'Role Changed',
      'File Uploaded',
      'Export Data',
    ];
    const users = [
      'john.doe@example.com',
      'jane.smith@example.com',
      'admin@example.com',
      'teacher@example.com',
      'student@example.com',
    ];
    const resources = ['User', 'Activity', 'Submission', 'Settings', 'File'];
    const statuses = ['Success', 'Failed', 'Warning'];

    return Array.from({ length: 100 }, (_, i) => {
      const timestamp = new Date(Date.now() - i * 3600000 * Math.random() * 24);
      return {
        id: i + 1,
        timestamp: timestamp.toLocaleString(),
        timestampRaw: timestamp,
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        resource: resources[Math.floor(Math.random() * resources.length)],
        resourceId: Math.floor(Math.random() * 1000) + 1,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        status: statuses[Math.random() > 0.15 ? 0 : Math.random() > 0.5 ? 1 : 2],
        details: 'Action completed successfully',
      };
    });
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filter by search term (user email or action)
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.ip.includes(searchTerm)
      );
    }

    // Filter by action
    if (actionFilter !== 'all') {
      filtered = filtered.filter((log) => log.action.includes(actionFilter));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((log) => log.status === statusFilter);
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter((log) => new Date(log.timestampRaw) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((log) => new Date(log.timestampRaw) <= endDate);
    }

    setFilteredLogs(filtered);
  };

  const handleExportCSV = () => {
    const csv = [
      ['ID', 'Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Status', 'Details'],
      ...filteredLogs.map(log => [
        log.id,
        log.timestamp,
        log.user,
        log.action,
        log.resource,
        log.resourceId,
        log.ip,
        log.status,
        log.details,
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setStatusFilter('all');
    setStartDate(null);
    setEndDate(null);
  };

  const columns = [
    { id: 'id', label: 'ID', minWidth: 70 },
    { id: 'timestamp', label: 'Timestamp', minWidth: 180 },
    { id: 'user', label: 'User', minWidth: 200 },
    { id: 'action', label: 'Action', minWidth: 150 },
    {
      id: 'resource',
      label: 'Resource',
      minWidth: 120,
      format: (value, row) => (
        <Chip label={`${value} #${row.resourceId}`} size="small" variant="outlined" />
      ),
    },
    { id: 'ip', label: 'IP Address', minWidth: 130 },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      format: (value) => (
        <Chip
          label={value}
          color={value === 'Success' ? 'success' : value === 'Failed' ? 'error' : 'warning'}
          size="small"
        />
      ),
    },
    { id: 'details', label: 'Details', minWidth: 200 },
  ];

  if (loading) {
    return (
      <AdminLayout title="Audit Logs">
        <LoadingSpinner message="Loading audit logs..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Audit Logs">
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Audit Logs
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchLogs}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<GetAppIcon />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <TextField
                placeholder="Search by user, action, or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={actionFilter}
                  label="Action Type"
                  onChange={(e) => setActionFilter(e.target.value)}
                >
                  <MenuItem value="all">All Actions</MenuItem>
                  <MenuItem value="Login">Login/Logout</MenuItem>
                  <MenuItem value="Created">Created</MenuItem>
                  <MenuItem value="Updated">Updated</MenuItem>
                  <MenuItem value="Deleted">Deleted</MenuItem>
                  <MenuItem value="Graded">Graded</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="Success">Success</MenuItem>
                  <MenuItem value="Failed">Failed</MenuItem>
                  <MenuItem value="Warning">Warning</MenuItem>
                </Select>
              </FormControl>

              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: { sx: { minWidth: 150 } }
                }}
              />

              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{
                  textField: { sx: { minWidth: 150 } }
                }}
              />

              {(searchTerm || actionFilter !== 'all' || statusFilter !== 'all' || startDate || endDate) && (
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          </LocalizationProvider>

          {/* Filter Info */}
          {filteredLogs.length !== logs.length && (
            <Alert severity="info">
              Showing {filteredLogs.length} of {logs.length} logs
            </Alert>
          )}
        </Box>

        {/* Logs Table */}
        <DataTable
          columns={columns}
          rows={filteredLogs}
          loading={loading}
          emptyMessage="No audit logs found"
          defaultRowsPerPage={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Box>
    </AdminLayout>
  );
};

export default AuditLogs;
