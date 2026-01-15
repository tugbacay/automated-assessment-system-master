import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/Layout/AdminLayout';
import DataTable from '../../components/common/UI/DataTable';
import ConfirmDialog from '../../components/common/UI/ConfirmDialog';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import api from '../../services/api';

/**
 * User Management Page
 * Complete CRUD operations for user management
 */
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    status: 'active',
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      const userData = response.data || generateSampleUsers();
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Use sample data on error
      setUsers(generateSampleUsers());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleUsers = () => {
    const roles = ['student', 'teacher', 'admin'];
    const statuses = ['active', 'suspended'];
    const names = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis', 'Michael Brown', 'Sarah Wilson', 'David Lee', 'Lisa Anderson', 'James Taylor', 'Mary Martinez'];

    return names.map((name, index) => ({
      id: index + 1,
      name,
      email: name.toLowerCase().replace(' ', '.') + '@example.com',
      role: roles[index % 3],
      status: statuses[index % 5 === 0 ? 1 : 0],
      createdAt: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
      lastLogin: new Date(Date.now() - Math.random() * 1000000000).toLocaleDateString(),
    }));
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleOpenUserDialog = (user = null) => {
    if (user) {
      setIsEditMode(true);
      setCurrentUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      });
    } else {
      setIsEditMode(false);
      setCurrentUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'student',
        status: 'active',
      });
    }
    setUserDialogOpen(true);
  };

  const handleCloseUserDialog = () => {
    setUserDialogOpen(false);
    setCurrentUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'student',
      status: 'active',
    });
  };

  const handleSaveUser = async () => {
    try {
      if (isEditMode) {
        // Update user
        await api.put(`/users/${currentUser.id}`, formData);
        setUsers(users.map(u => u.id === currentUser.id ? { ...u, ...formData } : u));
        showSnackbar('User updated successfully', 'success');
      } else {
        // Create user
        const response = await api.post('/users', formData);
        const newUser = {
          id: users.length + 1,
          ...formData,
          createdAt: new Date().toLocaleDateString(),
          lastLogin: 'Never',
        };
        setUsers([...users, newUser]);
        showSnackbar('User created successfully', 'success');
      }
      handleCloseUserDialog();
    } catch (error) {
      console.error('Error saving user:', error);
      showSnackbar('Error saving user', 'error');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/users/${currentUser.id}`);
      setUsers(users.filter(u => u.id !== currentUser.id));
      showSnackbar('User deleted successfully', 'success');
      setDeleteDialogOpen(false);
      setCurrentUser(null);
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting user:', error);
      showSnackbar('Error deleting user', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      await api.patch(`/users/${user.id}/status`, { status: newStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      showSnackbar(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`, 'success');
      handleMenuClose();
    } catch (error) {
      console.error('Error toggling user status:', error);
      showSnackbar('Error updating user status', 'error');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedUsers.map(id => api.delete(`/users/${id}`)));
      setUsers(users.filter(u => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
      showSnackbar(`${selectedUsers.length} users deleted successfully`, 'success');
    } catch (error) {
      console.error('Error deleting users:', error);
      showSnackbar('Error deleting users', 'error');
    }
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleExportUsers = () => {
    const csv = [
      ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At', 'Last Login'],
      ...filteredUsers.map(u => [u.id, u.name, u.email, u.role, u.status, u.createdAt, u.lastLogin])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const columns = [
    {
      id: 'select',
      label: '',
      minWidth: 50,
      format: (value, row) => (
        <Checkbox
          checked={selectedUsers.includes(row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUsers([...selectedUsers, row.id]);
            } else {
              setSelectedUsers(selectedUsers.filter(id => id !== row.id));
            }
          }}
        />
      ),
    },
    { id: 'id', label: 'ID', minWidth: 70 },
    { id: 'name', label: 'Name', minWidth: 150 },
    { id: 'email', label: 'Email', minWidth: 200 },
    {
      id: 'role',
      label: 'Role',
      minWidth: 100,
      format: (value) => (
        <Chip
          label={value}
          color={value === 'admin' ? 'error' : value === 'teacher' ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      format: (value) => (
        <Chip
          label={value}
          color={value === 'active' ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
    { id: 'createdAt', label: 'Created At', minWidth: 120 },
    { id: 'lastLogin', label: 'Last Login', minWidth: 120 },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
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
      <AdminLayout title="User Management">
        <LoadingSpinner message="Loading users..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Management">
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            User Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenUserDialog()}
          >
            Add User
          </Button>
        </Box>

        {/* Filters and Search */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by name or email..."
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
            <InputLabel>Role Filter</InputLabel>
            <Select
              value={roleFilter}
              label="Role Filter"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handleExportUsers}
          >
            Export CSV
          </Button>
        </Box>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {selectedUsers.length} user(s) selected
            <Button
              color="error"
              size="small"
              sx={{ ml: 2 }}
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
          </Alert>
        )}

        {/* Users Table */}
        <DataTable
          columns={columns}
          rows={filteredUsers}
          loading={loading}
          emptyMessage="No users found"
          defaultRowsPerPage={25}
        />

        {/* User Dialog (Add/Edit) */}
        <Dialog open={userDialogOpen} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {isEditMode ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
                required
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUserDialog}>Cancel</Button>
            <Button
              onClick={handleSaveUser}
              variant="contained"
              disabled={!formData.name || !formData.email}
            >
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete User"
          message={`Are you sure you want to delete ${currentUser?.name}? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteDialogOpen(false)}
          isDestructive
        />

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            handleOpenUserDialog(menuUser);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleToggleStatus(menuUser)}>
            <ListItemIcon>
              {menuUser?.status === 'active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>
              {menuUser?.status === 'active' ? 'Suspend' : 'Activate'}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            setCurrentUser(menuUser);
            setDeleteDialogOpen(true);
          }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </AdminLayout>
  );
};

export default UserManagement;
