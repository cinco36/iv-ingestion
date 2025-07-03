import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

export const UploadPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Upload Files
        </Typography>
        <Paper sx={{ p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            File upload page coming soon...
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}; 