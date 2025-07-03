import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Assessment,
  Warning,
  CheckCircle,
  Schedule,
  TrendingUp,
  TrendingDown,
  AttachMoney,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { inspectionService } from '../../services/inspectionService';

export const DashboardPage: React.FC = () => {
  const theme = useTheme();

  // Mock data - replace with actual API calls
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => inspectionService.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: recentInspections } = useQuery({
    queryKey: ['recent-inspections'],
    queryFn: () => inspectionService.getRecentInspections(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mock data for demonstration
  const mockStats = {
    totalInspections: 24,
    completedInspections: 18,
    pendingInspections: 4,
    failedInspections: 2,
    totalFindings: 156,
    criticalFindings: 12,
    majorFindings: 45,
    minorFindings: 99,
    totalCost: 45600,
    averageCost: 1900,
  };

  const mockRecentInspections = [
    {
      id: 1,
      property: { address: '123 Main St, City, State' },
      status: 'completed',
      inspectionDate: '2024-01-15',
      findingsCount: 8,
      criticalFindings: 1,
    },
    {
      id: 2,
      property: { address: '456 Oak Ave, City, State' },
      status: 'processing',
      inspectionDate: '2024-01-14',
      findingsCount: 0,
      criticalFindings: 0,
    },
    {
      id: 3,
      property: { address: '789 Pine Rd, City, State' },
      status: 'pending',
      inspectionDate: '2024-01-13',
      findingsCount: 0,
      criticalFindings: 0,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'pending':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'processing':
        return <Schedule color="warning" />;
      case 'pending':
        return <Assessment color="info" />;
      case 'failed':
        return <Warning color="error" />;
      default:
        return <Assessment />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back! Here's an overview of your inspection activities.
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Inspections
                  </Typography>
                  <Typography variant="h4">
                    {mockStats.totalInspections}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <Assessment />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {mockStats.completedInspections}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Critical Findings
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {mockStats.criticalFindings}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Warning />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Cost
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    ${mockStats.totalCost.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AttachMoney />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress and Recent Activity */}
      <Grid container spacing={3}>
        {/* Progress Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inspection Progress
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Completion Rate</Typography>
                  <Typography variant="body2" color="primary.main">
                    {Math.round((mockStats.completedInspections / mockStats.totalInspections) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(mockStats.completedInspections / mockStats.totalInspections) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Success Rate</Typography>
                  <Typography variant="body2" color="success.main">
                    {Math.round(((mockStats.completedInspections - mockStats.failedInspections) / mockStats.totalInspections) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={((mockStats.completedInspections - mockStats.failedInspections) / mockStats.totalInspections) * 100}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Average Cost per Inspection</Typography>
                  <Typography variant="body2" color="primary.main">
                    ${mockStats.averageCost}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={75}
                  color="secondary"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Inspections */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Inspections
              </Typography>
              
              <List>
                {mockRecentInspections.map((inspection) => (
                  <ListItem key={inspection.id} divider>
                    <ListItemIcon>
                      {getStatusIcon(inspection.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={inspection.property.address}
                      secondary={`${inspection.findingsCount} findings • ${inspection.criticalFindings} critical`}
                    />
                    <Chip
                      label={inspection.status}
                      color={getStatusColor(inspection.status) as any}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}; 