import { Card, CardContent, CardActions, Typography, Box } from '@mui/material';

/**
 * CustomCard Component
 * Reusable card component with consistent styling
 */
const CustomCard = ({
  title,
  subtitle,
  children,
  actions,
  elevation = 2,
  sx = {},
}) => {
  return (
    <Card elevation={elevation} sx={{ height: '100%', ...sx }}>
      {(title || subtitle) && (
        <Box sx={{ p: 2, pb: 0 }}>
          {title && (
            <Typography variant="h6" component="h2" gutterBottom>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      )}

      <CardContent>
        {children}
      </CardContent>

      {actions && (
        <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default CustomCard;
