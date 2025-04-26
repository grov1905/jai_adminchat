import React from 'react';
import { Box, Typography } from '@mui/material';

interface StatItemProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
}

export const StatItem: React.FC<StatItemProps> = ({ label, value, icon }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
    <Typography variant="body1" color="text.secondary">
      {label}:
    </Typography>
    <Box display="flex" alignItems="center">
      {icon && <Box mr={1}>{icon}</Box>}
      <Typography variant="body1" fontWeight="bold">
        {value}
      </Typography>
    </Box>
  </Box>
); 