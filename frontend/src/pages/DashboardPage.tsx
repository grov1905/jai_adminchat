import DashboardStats from '../components/DashboardStats';
import { Container } from '@mui/material';

const DashboardPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <DashboardStats />
      {/* Otros componentes del dashboard */}
    </Container>
  );
};

export default DashboardPage;