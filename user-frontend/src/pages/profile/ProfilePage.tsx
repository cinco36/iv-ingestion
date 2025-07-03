import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

export const ProfilePage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        <Paper sx={{ p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Profile page coming soon...
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}; 