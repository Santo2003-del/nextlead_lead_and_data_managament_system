import { Box, Container, Typography, Grid, Card, CardContent, Chip, Button } from '@mui/material';
import { WorkOutline, ArrowForward, LocationOn, AccessTime } from '@mui/icons-material';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

const jobs = [
  { title: 'Senior Backend Engineer', dept: 'Engineering', location: 'Pune, India', type: 'Full-time', remote: true },
  { title: 'Frontend Developer (React)', dept: 'Engineering', location: 'Remote', type: 'Full-time', remote: true },
  { title: 'Data Scientist', dept: 'Data', location: 'London, UK', type: 'Full-time', remote: false },
  { title: 'Account Executive', dept: 'Sales', location: 'Pune, India', type: 'Full-time', remote: false },
  { title: 'Product Marketing Manager', dept: 'Marketing', location: 'Remote', type: 'Full-time', remote: true },
];

export default function CareersPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#030712', color: '#f0f9ff' }}>
      <LandingNavbar />
      
      <Box sx={{ pt: { xs: 8, md: 14 }, pb: { xs: 6, md: 10 }, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Container maxWidth="md">
          <Chip icon={<WorkOutline sx={{ color: '#0ea5e9 !important', fontSize: 14 }} />} label="WE ARE HIRING"
            sx={{ mb: 3, bgcolor: 'rgba(14,165,233,0.08)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(14,165,233,0.15)', letterSpacing: 1.5 }} />
          <Typography variant="h2" fontWeight={900} mb={2} sx={{ fontSize: { xs: '2rem', md: '3.5rem' }, letterSpacing: -2 }}>
            Build the Future of Lead Intelligence
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(240,249,255,0.45)', fontWeight: 400, lineHeight: 1.7, mb: 4 }}>
            Join a fast-growing team of engineers, data scientists, and sales professionals building
            the most powerful revenue platform in the world.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" fontWeight={900} mb={4}>Open Positions</Typography>
        <Grid container spacing={3}>
          {jobs.map((job, i) => (
            <Grid item xs={12} key={i}>
              <Card sx={{
                bgcolor: 'rgba(13,31,60,0.4)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3,
                transition: 'all 0.3s', '&:hover': { borderColor: 'rgba(14,165,233,0.3)', transform: 'translateY(-2px)' },
              }}>
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 3 }}>
                  <Box>
                    <Typography variant="h5" fontWeight={800} color="#f0f9ff" mb={1}>{job.title}</Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip label={job.dept} size="small" sx={{ bgcolor: 'rgba(139,92,246,0.1)', color: '#a78bfa', fontWeight: 600 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'rgba(240,249,255,0.5)' }}>
                        <LocationOn sx={{ fontSize: 16 }} />
                        <Typography variant="body2">{job.location}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'rgba(240,249,255,0.5)' }}>
                        <AccessTime sx={{ fontSize: 16 }} />
                        <Typography variant="body2">{job.type}</Typography>
                      </Box>
                      {job.remote && (
                        <Chip label="Remote Available" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#34d399', fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)' }} />
                      )}
                    </Box>
                  </Box>
                  <Button variant="outlined" endIcon={<ArrowForward />}
                    sx={{ borderColor: 'rgba(14,165,233,0.3)', color: '#0ea5e9', fontWeight: 700, borderRadius: 2 }}>
                    Apply Now
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
