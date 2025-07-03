import React from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';

interface LoadingScreenProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  size = 40,
  fullScreen = false,
}) => {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      minHeight={fullScreen ? '100vh' : '200px'}
    >
      <Fade in={true} timeout={500}>
        <CircularProgress size={size} />
      </Fade>
      <Fade in={true} timeout={700}>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Fade>
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={9999}
        bgcolor="background.default"
      >
        {content}
      </Box>
    );
  }

  return content;
}; 