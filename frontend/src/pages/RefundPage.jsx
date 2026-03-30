import { Box, Container, Typography } from '@mui/material';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

export default function RefundPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#030712', color: '#f0f9ff' }}>
      <LandingNavbar />
      
      <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Typography variant="h2" fontWeight={900} mb={2}>Refund Policy</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.5)">Last updated: March 2026</Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">14-Day Money-Back Guarantee</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          We stand behind our platform. If you are not entirely satisfied with your purchase, we're here to help.
          We offer a full 14-day money-back guarantee for all new subscriptions. If you decide NexLead isn't right
          for you within the first 14 days, contact support for a full refund.
        </Typography>

        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">Cancellations</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          You can cancel your subscription at any time. When you cancel, you will remain on your current billing
          cycle until the end of the term you have already paid for. We do not offer prorated refunds for
          mid-cycle cancellations except as required by law.
        </Typography>

        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">How to Request a Refund</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          To request a refund within your eligible period, please email billing@nexlead.io from the email address
          associated with your account. Please include your company name and reason for cancellation so we can
          improve our services.
        </Typography>
      </Container>
      
      <LandingFooter />
    </Box>
  );
}
