import { Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider, Box, Typography } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  RateReview as ReviewIcon,
  Checklist as ChecklistIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  AdminPanelSettings as AdminIcon,
  AssignmentTurnedIn as RubricIcon,
  ManageAccounts as ManageAccountsIcon,
  ListAlt as AuditLogsIcon,
  ModelTraining as AIModelIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import useUIStore from '../../../store/uiStore';

const drawerWidth = 240;

/**
 * Sidebar Component
 * Side navigation with role-based menu items
 */
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { sidebarOpen } = useUIStore();

  // Student menu items
  const studentMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/student/dashboard' },
    { text: 'Activities', icon: <AssignmentIcon />, path: '/student/activities' },
    { text: 'My Progress', icon: <TrendingUpIcon />, path: '/student/progress' },
    { text: 'Profile', icon: <PersonIcon />, path: '/student/profile' },
  ];

  // Teacher menu items
  const teacherMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/teacher/dashboard' },
    { text: 'Activities', icon: <AssignmentIcon />, path: '/teacher/activities' },
    { text: 'Rubrics', icon: <RubricIcon />, path: '/teacher/rubrics' },
    { text: 'Pending Reviews', icon: <ReviewIcon />, path: '/teacher/reviews' },
    { text: 'Students', icon: <PeopleIcon />, path: '/teacher/students' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/teacher/analytics' },
  ];

  // Admin menu items
  const adminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'User Management', icon: <ManageAccountsIcon />, path: '/admin/users' },
    { text: 'System Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
    { text: 'Audit Logs', icon: <AuditLogsIcon />, path: '/admin/audit-logs' },
    { text: 'AI Models', icon: <AIModelIcon />, path: '/admin/ai-models' },
    { text: 'Export Data', icon: <DownloadIcon />, path: '/admin/analytics/export' },
  ];

  // Get menu items based on user role
  const getMenuItems = () => {
    if (user?.role === 'student') return studentMenuItems;
    if (user?.role === 'teacher') return teacherMenuItems;
    if (user?.role === 'admin') return adminMenuItems;
    return [];
  };

  const menuItems = getMenuItems();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="persistent"
      open={sidebarOpen}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          marginTop: '64px', // Height of AppBar
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        {/* User info section */}
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {user?.role?.toUpperCase()}
          </Typography>
          <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
            {user?.name}
          </Typography>
        </Box>

        <Divider />

        {/* Navigation menu */}
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
