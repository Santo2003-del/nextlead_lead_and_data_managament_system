import { Box, Container, Typography } from '@mui/material';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

export default function PrivacyPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#030712', color: '#f0f9ff' }}>
      <LandingNavbar />
      
      <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Typography variant="h2" fontWeight={900} mb={2}>Privacy Policy</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.5)">Last updated: March 2026</Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">1. Introduction</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          At NexLead, we take your privacy seriously. This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you visit our website and use our lead intelligence platform.
        </Typography>

        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">2. Information We Collect</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          We may collect personal identification information from users in a variety of ways, including, but not
          limited to, when users visit our site, register on the site, place an order, fill out a form, and in
          connection with other activities, services, features, or resources we make available. Users may be asked
          for their name, email address, mailing address, mapping data, and phone number.
        </Typography>

        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">3. How We Use Information</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          We use the information we collect primarily to provide, maintain, protect, and improve our services,
          to develop new ones, and to protect NexLead and our users. We also use this information to offer you
          tailored content – like giving you more relevant lead recommendations.
        </Typography>

        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">4. Data Security</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          We adopt appropriate data collection, storage, and processing practices and security measures to protect
          against unauthorized access, alteration, disclosure, or destruction of your personal information, username,
          password, transaction information, and data stored on our platform.
        </Typography>

        <Typography variant="h5" fontWeight={700} mb={2} color="#0ea5e9">5. Contact Us</Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.6)" mb={4} lineHeight={1.8}>
          If you have any questions about this Privacy Policy, the practices of this site, or your dealings with
          this site, please contact us at privacy@nexlead.io.
        </Typography>
      </Container>
      
      <LandingFooter />
    </Box>
  );
}
