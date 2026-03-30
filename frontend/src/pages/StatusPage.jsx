import { Box, Container, Typography, Grid, Paper, Stack, Chip } from '@mui/material';
import { CheckCircle, Info } from '@mui/icons-material';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

const services = [
  { name: 'API Server (London)', status: 'Operational', uptime: '99.99%' },
  { name: 'API Server (Singapore)', status: 'Operational', uptime: '99.99%' },
  { name: 'Elasticsearch Cluster', status: 'Operational', uptime: '100.0%' },
  { name: 'Authentication Service', status: 'Operational', uptime: '99.99%' },
  { name: 'Background Workers (Import/Export)', status: 'Operational', uptime: '99.98%' },
  { name: 'Web Application UI', status: 'Operational', uptime: '100.0%' },
];

export default function StatusPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#030712', color: '#f0f9ff' }}>
      <LandingNavbar />
      
      <Box sx={{ pt: { xs: 8, md: 14 }, pb: { xs: 6, md: 10 }, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={900} mb={2} sx={{ fontSize: { xs: '2rem', md: '3.5rem' }, letterSpacing: -2 }}>
            System Status
          </Typography>
          <Chip icon={<CheckCircle sx={{ color: '#10b981 !important', fontSize: 16 }} />}
            label="All Systems Operational"
            sx={{ mt: 2, bgcolor: 'rgba(16,185,129,0.1)', color: '#34d399', fontWeight: 700, border: '1px solid rgba(16,185,129,0.2)', py: 2.5, px: 1, fontSize: '1rem' }} />
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h6" fontWeight={700} mb={3}>Current Status by Service</Typography>
        <Stack spacing={2} mb={8}>
          {services.map((service, i) => (
            <Paper key={i} sx={{
              p: 3, bgcolor: 'rgba(13,31,60,0.4)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2,
            }}>
              <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff">{service.name}</Typography>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <Typography variant="body2" color="rgba(240,249,255,0.5)">Uptime: {service.uptime}</Typography>
                <Chip label={service.status} size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 700 }} />
              </Box>
            </Paper>
          ))}
        </Stack>

        <Typography variant="h6" fontWeight={700} mb={3}>Past Incidents</Typography>
        <Paper sx={{ p: 4, bgcolor: 'rgba(13,31,60,0.4)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Info sx={{ color: 'rgba(240,249,255,0.3)' }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#f0f9ff" mb={0.5}>No incidents reported</Typography>
              <Typography variant="body2" color="rgba(240,249,255,0.5)">
                There have been no performance issues or downtime events reported in the last 30 days.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
      
      <LandingFooter />
    </Box>
  );
}
