import { Alert, AlertTitle, Box, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

/**
 * ErrorMessage Component
 * Display error messages with optional retry action
 */
const ErrorMessage = ({
  title = 'Error',
  message = 'Something went wrong. Please try again.',
  severity = 'error',
  onRetry,
  retryLabel = 'Retry',
}) => {
  return (
    <Box sx={{ width: '100%', my: 2 }}>
      <Alert
        severity={severity}
        action={
          onRetry && (
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};

export default ErrorMessage;
