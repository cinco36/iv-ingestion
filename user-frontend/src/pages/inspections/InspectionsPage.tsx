import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

export const InspectionsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Inspections
        </Typography>
        <Paper sx={{ p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Inspections list page coming soon...
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}; 