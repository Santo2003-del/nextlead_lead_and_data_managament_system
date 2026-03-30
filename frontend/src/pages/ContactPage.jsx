import { useState } from 'react';
import { Box, Button, Container, Typography, Grid, Card, CardContent, Stack, Chip, Paper, TextField, Alert } from '@mui/material';
import {
  BoltOutlined, LocationOn, Email, Phone, AccessTime,
  ArrowForward, Send, CheckCircle, HeadsetMic, ChatBubbleOutline,
} from '@mui/icons-material';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setForm({ name: '', email: '', company: '', subject: '', message: '' });
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff', borderRadius: 2,
      '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
      '&:hover fieldset': { borderColor: 'rgba(14,165,233,0.3) !important' },
      '&.Mui-focused fieldset': { borderColor: '#0ea5e9 !important' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(240,249,255,0.4)' },
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#030712', color: '#f0f9ff' }}>
      <LandingNavbar />

      {/* Hero */}
      <Box sx={{
        pt: { xs: 8, md: 14 }, pb: { xs: 6, md: 10 }, textAlign: 'center',
        position: 'relative',
        '&::before': {
          content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 600,
          background: 'radial-gradient(ellipse at 50% -10%, #1e3a8a 0%, transparent 65%)',
          opacity: 0.4, pointerEvents: 'none',
        },
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Chip icon={<BoltOutlined sx={{ color: '#0ea5e9 !important', fontSize: 14 }} />}
            label="CONTACT US"
            sx={{ mb: 3, bgcolor: 'rgba(14,165,233,0.08)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(14,165,233,0.15)', letterSpacing: 1.5 }} />
          <Typography variant="h2" fontWeight={900} mb={2}
            sx={{ fontSize: { xs: '2rem', md: '3.5rem' }, letterSpacing: -2 }}>
            Let's{' '}
            <Box component="span" sx={{ background: 'linear-gradient(90deg,#0ea5e9,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Connect
            </Box>
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(240,249,255,0.45)', maxWidth: 600, mx: 'auto', fontWeight: 400, lineHeight: 1.7 }}>
            Have questions, need a demo, or ready to get started? Reach out and our team will respond within 24 hours.
          </Typography>
        </Container>
      </Box>

      {/* Contact Cards */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {[
            { icon: HeadsetMic, color: '#0ea5e9', title: 'Sales Inquiries', desc: 'Talk to our team about plans, pricing, and custom solutions for your business.', action: 'contact@nexlead.io' },
            { icon: ChatBubbleOutline, color: '#10b981', title: 'Technical Support', desc: 'Need help with the platform? Our support team is here for you.', action: 'support@nexlead.io' },
            { icon: Email, color: '#8b5cf6', title: 'Partnerships', desc: 'Interested in partnering with NexLead? Let\'s explore opportunities together.', action: 'partners@nexlead.io' },
          ].map((card, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Card sx={{
                height: '100%', bgcolor: 'rgba(13,31,60,0.4)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, textAlign: 'center',
                transition: 'all 0.3s', '&:hover': { borderColor: `${card.color}30`, transform: 'translateY(-4px)' },
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: 2.5, bgcolor: `${card.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5,
                    border: `1px solid ${card.color}20`,
                  }}>
                    <card.icon sx={{ color: card.color, fontSize: 28 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="#f0f9ff" mb={1}>{card.title}</Typography>
                  <Typography variant="body2" color="rgba(240,249,255,0.5)" mb={2.5} lineHeight={1.6}>{card.desc}</Typography>
                  <Chip label={card.action} size="small"
                    sx={{ bgcolor: `${card.color}10`, color: card.color, fontWeight: 600, border: `1px solid ${card.color}20` }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Contact Form + Info */}
      <Box sx={{ py: { xs: 8, md: 14 }, bgcolor: 'rgba(14,165,233,0.015)', borderY: '1px solid rgba(255,255,255,0.03)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            {/* Form */}
            <Grid item xs={12} md={7}>
              <Card sx={{
                borderRadius: 3, bgcolor: 'rgba(13,31,60,0.5)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(14,165,233,0.1)',
              }}>
                <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                  <Typography variant="h5" fontWeight={800} color="#f0f9ff" mb={1}>Send Us a Message</Typography>
                  <Typography variant="body2" color="rgba(240,249,255,0.4)" mb={4}>
                    Fill out the form below and we'll get back to you within 24 hours.
                  </Typography>

                  {submitted && (
                    <Alert icon={<CheckCircle />} severity="success" sx={{
                      mb: 3, bgcolor: 'rgba(16,185,129,0.08)', color: '#6ee7b7',
                      border: '1px solid rgba(16,185,129,0.2)',
                      '& .MuiAlert-icon': { color: '#10b981' },
                    }}>
                      Thank you! Your message has been sent. We'll respond within 24 hours.
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Full Name" size="small" required
                          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          sx={inputSx} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Email Address" type="email" size="small" required
                          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          sx={inputSx} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Company Name" size="small"
                          value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                          sx={inputSx} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Subject" size="small" required
                          value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                          sx={inputSx} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth label="Your Message" size="small" multiline rows={5} required
                          value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                          sx={inputSx} />
                      </Grid>
                      <Grid item xs={12}>
                        <Button type="submit" variant="contained" size="large" fullWidth endIcon={<Send />}
                          sx={{
                            background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', borderRadius: 2,
                            py: 1.5, fontWeight: 700, fontSize: 15,
                            '&:hover': { background: '#0ea5e9', transform: 'translateY(-1px)' },
                          }}>
                          Send Message
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Info */}
            <Grid item xs={12} md={5}>
              <Stack spacing={4}>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#f0f9ff" mb={2.5}>Company Address</Typography>
                  <Paper sx={{
                    p: 3, bgcolor: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 3,
                  }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <LocationOn sx={{ color: '#0ea5e9', mt: 0.3 }} />
                      <Typography variant="body2" color="rgba(240,249,255,0.6)" lineHeight={1.8}>
                        Office No: 301, Ashwamedh Building,<br />
                        Veerbhadra Nagar, Baner,<br />
                        Pune, Maharashtra 411045, India
                      </Typography>
                    </Box>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="h6" fontWeight={700} color="#f0f9ff" mb={2.5}>Contact Information</Typography>
                  <Stack spacing={2}>
                    {[
                      { icon: Email, text: 'contact@nexlead.io', color: '#0ea5e9' },
                      { icon: Phone, text: '+44 151 528 9267', color: '#10b981' },
                      { icon: Phone, text: '+44 20 8144 2701', color: '#10b981' },
                    ].map((item, i) => (
                      <Paper key={i} sx={{
                        p: 2, bgcolor: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 2.5, display: 'flex', gap: 2, alignItems: 'center',
                      }}>
                        <item.icon sx={{ color: item.color, fontSize: 20 }} />
                        <Typography variant="body2" color="rgba(240,249,255,0.7)" fontWeight={500}>{item.text}</Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="h6" fontWeight={700} color="#f0f9ff" mb={2.5}>Business Hours</Typography>
                  <Paper sx={{
                    p: 3, bgcolor: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.12)',
                    borderRadius: 3,
                  }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <AccessTime sx={{ color: '#0ea5e9', mt: 0.3 }} />
                      <Box>
                        <Typography variant="body2" color="rgba(240,249,255,0.7)" fontWeight={600} mb={0.5}>
                          Monday — Friday
                        </Typography>
                        <Typography variant="body2" color="rgba(240,249,255,0.5)" mb={1.5}>
                          9:00 AM — 6:00 PM (IST)
                        </Typography>
                        <Typography variant="body2" color="rgba(240,249,255,0.7)" fontWeight={600} mb={0.5}>
                          Saturday — Sunday
                        </Typography>
                        <Typography variant="body2" color="rgba(240,249,255,0.5)">
                          Closed
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>

                <Paper sx={{
                  p: 3, bgcolor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)',
                  borderRadius: 3, textAlign: 'center',
                }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#10b981" mb={1}>
                    Average Response Time
                  </Typography>
                  <Typography variant="h4" fontWeight={900} color="#f0f9ff" mb={0.5}>
                    {'< 4 hours'}
                  </Typography>
                  <Typography variant="caption" color="rgba(240,249,255,0.4)">
                    During business hours
                  </Typography>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <LandingFooter />
    </Box>
  );
}
