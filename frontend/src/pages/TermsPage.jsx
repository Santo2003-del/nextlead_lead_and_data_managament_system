import { Box, Container, Typography } from '@mui/material';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

export default function TermsPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#030712', color: '#f0f9ff' }}>
      <LandingNavbar />
      
      <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Typography variant="h2" fontWeight={900} mb={2}>Terms of Service</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.5)">Last updated: March 2026</Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">1. Acceptance of Terms</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          By accessing and using the NexLead platform, you accept and agree to be bound by the terms and
          provision of this agreement. In addition, when using these particular services, you shall be subject
          to any posted guidelines or rules applicable to such services.
        </Typography>

        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">2. Provision of Services</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          NexLead is constantly innovating in order to provide the best possible experience for its users. You
          acknowledge and agree that the form and nature of the Services which NexLead provides may change from
          time to time without prior notice to you.
        </Typography>

        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">3. User Responsibilities</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          You are responsible for maintaining the confidentiality of any passwords associated with any account you
          use to access the Services. Accordingly, you agree that you will be solely responsible to NexLead for
          all activities that occur under your account.
        </Typography>

        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">4. Limitation of Liability</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          You expressly understand and agree that NexLead, its subsidiaries and affiliates, and its licensors shall
          not be liable to you for any direct, indirect, incidental, special consequential or exemplary damages which
          may be incurred by you, however caused and under any theory of liability.
        </Typography>
      </Container>
      
      <LandingFooter />
    </Box>
  );
}
