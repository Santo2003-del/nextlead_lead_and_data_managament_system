import { Box, Button, Container, Typography, Stack } from '@mui/material';
import { BoltOutlined } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Features', path: '/features' },
  { label: 'Solutions', path: '/solutions' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export default function LandingNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Box component="nav" sx={{
      position: 'sticky', top: 0, zIndex: 100,
      backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.04)',
      bgcolor: 'rgba(3,7,18,0.85)',
    }}>
      <Container maxWidth="xl" sx={{ py: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={900}
          onClick={() => navigate('/')}
          sx={{ letterSpacing: -1, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
          <Box sx={{
            width: 36, height: 36, background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
            borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(14,165,233,0.2)',
          }}>
            <BoltOutlined sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          NexLead
        </Typography>

        <Stack direction="row" spacing={3} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
          {NAV_LINKS.map(n => (
            <Typography key={n.label} variant="body2"
              onClick={() => navigate(n.path)}
              sx={{
                cursor: 'pointer', fontWeight: pathname === n.path ? 600 : 400,
                color: pathname === n.path ? '#0ea5e9' : 'rgba(255,255,255,0.55)',
                '&:hover': { color: '#0ea5e9' }, transition: '0.2s',
                borderBottom: pathname === n.path ? '2px solid #0ea5e9' : '2px solid transparent',
                pb: 0.3,
              }}>
              {n.label}
            </Typography>
          ))}
          <Button variant="contained" onClick={() => navigate('/login')}
            sx={{
              borderRadius: 2, px: 3, py: 0.8, ml: 1,
              background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)',
              '&:hover': { background: '#0ea5e9', transform: 'translateY(-1px)' },
              fontWeight: 700, fontSize: 13,
            }}>
            Get Started
          </Button>
        </Stack>

        <Button variant="contained" onClick={() => navigate('/login')}
          sx={{
            display: { xs: 'inline-flex', md: 'none' }, borderRadius: 2, px: 2,
            background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 700, fontSize: 12,
          }}>
          Login
        </Button>
      </Container>
    </Box>
  );
}
