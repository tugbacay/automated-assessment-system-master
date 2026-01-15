import { Box, Container } from '@mui/material';
import Navbar from '../Navigation/Navbar';
import Sidebar from '../Navigation/Sidebar';
import useUIStore from '../../../store/uiStore';

const drawerWidth = 240;

/**
 * StudentLayout Component
 * Layout for student pages with sidebar and navbar
 */
const StudentLayout = ({ children, title }) => {
  const { sidebarOpen } = useUIStore();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar title={title} />
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginTop: '64px', // Height of AppBar
          marginLeft: sidebarOpen ? 0 : `-${drawerWidth}px`,
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          backgroundColor: 'background.default',
        }}
      >
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default StudentLayout;
