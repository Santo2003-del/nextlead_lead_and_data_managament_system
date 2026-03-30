import { Box, Container, Typography, Grid, Paper, Stack } from '@mui/material';
import { Description, Api, Settings, AdminPanelSettings, Search, CloudUpload } from '@mui/icons-material';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

const categories = [
  { icon: CloudUpload, color: '#3b82f6', title: 'Data Import Guide', desc: 'Learn how to format CSV/Excel files for seamless import and automated scoring.' },
  { icon: Search, color: '#10b981', title: 'Search & Filtering', desc: 'Master the Elasticsearch-powered search engine to build hyper-targeted lead lists.' },
  { icon: AdminPanelSettings, color: '#ef4444', title: 'Admin & RBAC', desc: 'How to manage team accounts, set up role-based access, and monitor employee activity.' },
  { icon: Api, color: '#8b5cf6', title: 'API Reference', desc: 'Complete documentation for the NexLead RESTful API for custom integrations.' },
  { icon: Settings, color: '#f59e0b', title: 'Account Settings', desc: 'Managing your subscription, profile preferences, and notification settings.' },
  { icon: Description, color: '#0ea5e9', title: 'Export Templates', desc: 'How to customize Excel exports with your branding and specific column mappings.' },
];

export default function DocsPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#030712', color: '#f0f9ff' }}>
      <LandingNavbar />
      
      <Box sx={{ pt: { xs: 8, md: 14 }, pb: { xs: 6, md: 10 }, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={900} mb={2} sx={{ fontSize: { xs: '2rem', md: '3.5rem' }, letterSpacing: -2 }}>
            NexLead Documentation
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(240,249,255,0.45)', fontWeight: 400, lineHeight: 1.7 }}>
            Everything you need to know to get the most out of the platform.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={3}>
          {categories.map((cat, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Paper sx={{
                p: 4, height: '100%', bgcolor: 'rgba(13,31,60,0.4)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3, cursor: 'pointer',
                transition: 'all 0.3s', '&:hover': { borderColor: `${cat.color}40`, transform: 'translateY(-4px)' },
              }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, color: cat.color }}>
                  <cat.icon />
                </Box>
                <Typography variant="h6" fontWeight={800} color="#f0f9ff" mb={1}>{cat.title}</Typography>
                <Typography variant="body2" color="rgba(240,249,255,0.5)" lineHeight={1.6}>{cat.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
      
      <LandingFooter />
    </Box>
  );
}
