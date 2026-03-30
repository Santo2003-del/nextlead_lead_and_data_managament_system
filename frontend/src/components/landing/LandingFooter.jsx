import { Box, Container, Typography, Grid, Stack, Divider } from '@mui/material';
import { BoltOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function LandingFooter() {
  const navigate = useNavigate();

  return (
    <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.04)', py: { xs: 5, md: 8 }, bgcolor: '#020617' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ mb: 5 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={900} mb={2}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
              onClick={() => navigate('/')}>
              <Box sx={{
                width: 32, height: 32, borderRadius: 1.5,
                background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BoltOutlined sx={{ color: '#fff', fontSize: 18 }} />
              </Box>
              NexLead
            </Typography>
            <Typography variant="body2" color="rgba(240,249,255,0.35)" sx={{ maxWidth: 300, lineHeight: 1.7 }}>
              Next-generation B2B lead intelligence platform. Import, enrich, score, and export
              millions of verified contacts with enterprise-grade security.
            </Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} mb={2} color="rgba(240,249,255,0.7)">Platform</Typography>
            <Stack spacing={1}>
              {[
                { label: 'Features', path: '/features' },
                { label: 'Pricing', path: '/pricing' },
                { label: 'Solutions', path: '/solutions' },
                { label: 'Login', path: '/login' },
              ].map(t => (
                <Typography key={t.label} variant="caption" onClick={() => navigate(t.path)}
                  sx={{ color: 'rgba(255,255,255,0.35)', cursor: 'pointer', '&:hover': { color: '#0ea5e9' }, transition: '0.2s' }}>
                  {t.label}
                </Typography>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} mb={2} color="rgba(240,249,255,0.7)">Company</Typography>
            <Stack spacing={1}>
              {[
                { label: 'About Us', path: '/about' },
                { label: 'Contact', path: '/contact' },
                { label: 'Careers', path: '/careers' },
                { label: 'Blog', path: '/blog' },
              ].map(t => (
                <Typography key={t.label} variant="caption" onClick={() => navigate(t.path)}
                  sx={{ color: 'rgba(255,255,255,0.35)', cursor: 'pointer', '&:hover': { color: '#0ea5e9' }, transition: '0.2s' }}>
                  {t.label}
                </Typography>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} mb={2} color="rgba(240,249,255,0.7)">Legal</Typography>
            <Stack spacing={1}>
              {[
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Terms of Service', path: '/terms' },
                { label: 'Disclaimer', path: '/disclaimer' },
                { label: 'Refund Policy', path: '/refund' },
              ].map(t => (
                <Typography key={t.label} variant="caption" onClick={() => navigate(t.path)}
                  sx={{ color: 'rgba(255,255,255,0.35)', cursor: 'pointer', '&:hover': { color: '#0ea5e9' }, transition: '0.2s' }}>
                  {t.label}
                </Typography>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} mb={2} color="rgba(240,249,255,0.7)">Resources</Typography>
            <Stack spacing={1}>
              {[
                { label: 'Documentation', path: '/documentation' },
                { label: 'Support', path: '/support' },
                { label: 'Status', path: '/status' },
                { label: 'FAQ', path: '/faq' },
              ].map(t => (
                <Typography key={t.label} variant="caption" onClick={() => navigate(t.path)}
                  sx={{ color: 'rgba(255,255,255,0.35)', cursor: 'pointer', '&:hover': { color: '#0ea5e9' }, transition: '0.2s' }}>
                  {t.label}
                </Typography>
              ))}
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', mb: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="caption" color="rgba(240,249,255,0.2)">
            © {new Date().getFullYear()} NexLead Platform. All Rights Reserved.
          </Typography>
          <Typography variant="caption" color="rgba(240,249,255,0.15)">
            Built with React & Node.js
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
