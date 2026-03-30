import { Box, Container, Typography, Paper, Stack } from '@mui/material';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

const faqs = [
  { q: 'What is NexLead?', a: 'NexLead is a cloud-based B2B lead intelligence platform that helps sales and marketing teams import, score, and export highly targeted lead lists.' },
  { q: 'How does the AI lead scoring work?', a: 'Our engine evaluates multiple parameters including industry size, executive title, company revenue, and keyword matches to assign a score from 0-100 indicating likelihood to convert.' },
  { q: 'Is my data secure?', a: 'Yes. We use AES-256 encryption, strict Role-Based Access Control (RBAC), and multi-tenant data isolation to ensure your data is always protected and never shared across instances.' },
  { q: 'What is the limit for bulk importing?', a: 'Depending on your plan, you can import files up to 50MB (roughly 500,000 rows per file) in formats like CSV and Excel. Background workers handle processing so you never experience timeouts.' },
  { q: 'Can I cancel my subscription anytime?', a: 'Yes, you can cancel your plan at any point from your dashboard. Your access will continue until the end of the current billing cycle.' },
  { q: 'Do you offer a free trial?', a: 'Yes! All new registrations come with a 14-day free trial granting full access to the Pro features so you can fully evaluate the platform.' },
];

export default function FAQPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#030712', color: '#f0f9ff' }}>
      <LandingNavbar />
      
      <Box sx={{ pt: { xs: 8, md: 14 }, pb: { xs: 6, md: 10 }, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={900} mb={2} sx={{ fontSize: { xs: '2rem', md: '3.5rem' }, letterSpacing: -2 }}>
            Frequently Asked Questions
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(240,249,255,0.45)', fontWeight: 400, lineHeight: 1.7 }}>
            Quick answers to the most common questions about the NexLead platform.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 8 }}>
        <Stack spacing={3}>
          {faqs.map((faq, i) => (
            <Paper key={i} sx={{
              p: 4, bgcolor: 'rgba(13,31,60,0.4)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3,
            }}>
              <Typography variant="h6" fontWeight={800} color="#0ea5e9" mb={1.5}>{faq.q}</Typography>
              <Typography variant="body1" color="rgba(240,249,255,0.7)" lineHeight={1.8}>{faq.a}</Typography>
            </Paper>
          ))}
        </Stack>
      </Container>
      
      <LandingFooter />
    </Box>
  );
}
