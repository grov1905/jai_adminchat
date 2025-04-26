import { useDashboardStats } from '../hooks/useDashboardStats';
import { 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Alert, 
  Divider,
  Box,
  useTheme,
  styled
} from '@mui/material';
import { 
  Business as BusinessIcon,
  People as PeopleIcon,
  CheckCircle as ActiveIcon,
  AdminPanelSettings as AdminIcon,
  Update as UpdatedIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { StatItem } from './StatItem';

interface BusinessStats {
  total: number;
  active: number;
  inactive: number;
  by_month: Array<{
    month: string;
    count: number;
  }>;
}

interface UserStats {
  total: number;
  admins: number;
  staff: number;
  active: number;
}

interface DashboardStats {
  business_stats: BusinessStats;
  user_stats: UserStats;
  last_updated: string;
}

const Grid = styled('div')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(3),
  gridTemplateColumns: 'repeat(12, 1fr)',
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(12, 1fr)',
  },
}));

const DashboardStats = () => {
  const theme = useTheme();
  const { data, isLoading, isError, error } = useDashboardStats();

  // Datos por defecto con el tipo correcto
  const defaultStats: DashboardStats = {
    business_stats: {
      total: 0,
      active: 0,
      inactive: 0,
      by_month: []
    },
    user_stats: {
      total: 0,
      admins: 0,
      staff: 0,
      active: 0
    },
    last_updated: new Date().toISOString()
  };

  // Combina los datos con los valores por defecto
  const stats: DashboardStats = data ? { ...defaultStats, ...data } : defaultStats;

  // Calcula la distribución de roles
  const usersByRole = {
    admin: stats.user_stats.admins,
    staff: stats.user_stats.staff,
    user: stats.user_stats.total - stats.user_stats.admins - stats.user_stats.staff
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ my: 3 }}>
        {error.response?.data?.detail || 'Error al cargar las estadísticas del dashboard'}
      </Alert>
    );
  }

  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Panel de Control
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" mb={4}>
        Resumen general del sistema
      </Typography>

      <Box 
        sx={{ 
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          }
        }}
      >
        {/* Tarjeta de Negocios Totales */}
        <Card elevation={3}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <BusinessIcon fontSize="large" color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="div">
                Negocios
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box mt={2}>
              <StatItem label="Total" value={stats.business_stats.total} />
              <StatItem 
                label="Activos" 
                value={stats.business_stats.active} 
                icon={<ActiveIcon color="success" sx={{ fontSize: 16 }} />}
              />
              <StatItem 
                label="Inactivos" 
                value={stats.business_stats.inactive} 
                icon={<ActiveIcon color="action" sx={{ fontSize: 16 }} />}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Tarjeta de Usuarios */}
        <Card elevation={3}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <PeopleIcon fontSize="large" color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="div">
                Usuarios
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box mt={2}>
              <StatItem label="Total" value={stats.user_stats.total} />
              <StatItem 
                label="Administradores" 
                value={stats.user_stats.admins} 
                icon={<AdminIcon color="info" sx={{ fontSize: 16 }} />}
              />
              <StatItem 
                label="Staff" 
                value={stats.user_stats.staff} 
                icon={<AdminIcon color="secondary" sx={{ fontSize: 16 }} />}
              />
              <StatItem 
                label="Activos" 
                value={stats.user_stats.active} 
                icon={<ActiveIcon color="success" sx={{ fontSize: 16 }} />}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Tarjeta de Distribución de Roles */}
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Distribución por Roles
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box mt={2}>
              {Object.entries(usersByRole).map(([role, count]) => (
                <StatItem 
                  key={role} 
                  label={role === 'admin' ? 'Administradores' : 
                        role === 'staff' ? 'Staff' : 'Usuarios'} 
                  value={count} 
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Tarjeta de Última Actualización */}
        <Card elevation={3}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <UpdatedIcon fontSize="large" color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="div">
                Actualización
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                {format(new Date(stats.last_updated), 'dd/MM/yyyy HH:mm:ss')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DashboardStats;