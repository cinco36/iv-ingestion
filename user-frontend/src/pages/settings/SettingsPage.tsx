import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

export const SettingsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Paper sx={{ p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Settings page coming soon...
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}; 