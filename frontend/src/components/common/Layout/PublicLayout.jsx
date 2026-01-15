import { Box, Container, Paper, Typography } from '@mui/material';

/**
 * PublicLayout Component
 * Layout for public pages (login, register)
 * Simple centered layout without navigation
 */
const PublicLayout = ({ children, title }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
          }}
        >
          {title && (
            <Typography
              variant="h4"
              component="h1"
              align="center"
              gutterBottom
              sx={{ mb: 3, fontWeight: 600 }}
            >
              {title}
            </Typography>
          )}
          {children}
        </Paper>

        {/* Footer */}
        <Typography
          variant="body2"
          color="white"
          align="center"
          sx={{ mt: 3 }}
        >
          © 2024 Automated Assessment System
        </Typography>
      </Container>
    </Box>
  );
};

export default PublicLayout;
