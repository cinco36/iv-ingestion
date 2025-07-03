import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useParams } from 'react-router-dom';

export const InspectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Inspection Details
        </Typography>
        <Paper sx={{ p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Inspection detail page for ID: {id} coming soon...
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}; 