import { Box, Container, Typography } from '@mui/material';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

export default function DisclaimerPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#030712', color: '#f0f9ff' }}>
      <LandingNavbar />
      
      <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Typography variant="h2" fontWeight={900} mb={2}>Disclaimer</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.5)">Last updated: March 2026</Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          The information contained on the NexLead website and platform is for general information purposes only.
          NexLead assumes no responsibility for errors or omissions in the contents of the Service.
        </Typography>

        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">Data Accuracy</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          While we strive to provide a 98.4% data accuracy rate, business information changes rapidly. We make no
          representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability,
          suitability or availability with respect to the website or the information, products, services, or related
          graphics contained on the website for any purpose.
        </Typography>

        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">External Links</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          The NexLead service may contain links to external websites that are not provided or maintained by or in
          any way affiliated with NexLead. Please note that the NexLead does not guarantee the accuracy, relevance,
          timeliness, or completeness of any information on these external websites.
        </Typography>
      </Container>
      
      <LandingFooter />
    </Box>
  );
}
