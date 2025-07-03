import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Forgot Password
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Forgot password page coming soon...
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}; 