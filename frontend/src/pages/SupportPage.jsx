import { Box, Container, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Email, HeadsetMic, MenuBook, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

export default function SupportPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#030712', color: '#f0f9ff' }}>
      <LandingNavbar />
      
      <Box sx={{ pt: { xs: 8, md: 14 }, pb: { xs: 6, md: 10 }, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={900} mb={2} sx={{ fontSize: { xs: '2rem', md: '3.5rem' }, letterSpacing: -2 }}>
            How Can We Help You?
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(240,249,255,0.45)', fontWeight: 400, lineHeight: 1.7 }}>
            Our support team is available around the clock to ensure your pipeline never stops.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} justifyContent="center">
          {[
            { icon: MenuBook, title: 'Documentation', desc: 'Read guides, tutorials, and API references.', action: 'Browse Docs', path: '/documentation', color: '#0ea5e9' },
            { icon: HeadsetMic, title: 'Contact Support', desc: 'Open a ticket with our technical support team.', action: 'Submit Ticket', path: '/contact', color: '#10b981' },
            { icon: Email, title: 'Email Us', desc: 'Direct email support for billing and account inquiries.', action: 'Email support@nexlead.io', path: 'mailto:support@nexlead.io', color: '#8b5cf6' },
          ].map((item, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Card sx={{
                height: '100%', bgcolor: 'rgba(13,31,60,0.4)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3, textAlign: 'center',
                transition: 'all 0.3s', '&:hover': { borderColor: `${item.color}40`, transform: 'translateY(-4px)' },
              }}>
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: 2.5, bgcolor: `${item.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, color: item.color
                  }}>
                    <item.icon sx={{ fontSize: 28 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={800} color="#f0f9ff" mb={1}>{item.title}</Typography>
                  <Typography variant="body2" color="rgba(240,249,255,0.5)" mb={4} sx={{ flexGrow: 1 }}>{item.desc}</Typography>
                  <Button variant="outlined" endIcon={<ArrowForward />}
                    onClick={() => item.path.startsWith('mailto') ? window.location.href = item.path : navigate(item.path)}
                    sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#f0f9ff', fontWeight: 700, borderRadius: 2, '&:hover': { borderColor: item.color, color: item.color } }}>
                    {item.action}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      
      <LandingFooter />
    </Box>
  );
}
