import { Box, Button, Container, Typography, Grid, Card, CardContent, Stack, Chip, Divider, Switch, Paper } from '@mui/material';
import { CheckCircle, ArrowForward, BoltOutlined, Close, Star } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

const plans = [
  {
    tier: 'BASIC', price: 49, annual: 39, color: '#10b981',
    desc: 'Perfect for small teams and startups getting started with lead intelligence.',
    features: [
      { text: 'Up to 5,000 leads', included: true },
      { text: '2 team members', included: true },
      { text: 'CSV/Excel import', included: true },
      { text: 'Basic lead scoring', included: true },
      { text: 'Email support', included: true },
      { text: 'Standard exports', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Keyword Intelligence', included: false },
      { text: 'Advanced filtering', included: false },
      { text: 'Team management', included: false },
      { text: 'API access', included: false },
      { text: 'Custom integrations', included: false },
    ],
  },
  {
    tier: 'PRO', price: 149, annual: 119, color: '#0ea5e9', highlighted: true,
    desc: 'For fast-growing teams that need advanced lead management and intelligence.',
    badge: 'MOST POPULAR',
    features: [
      { text: 'Up to 50,000 leads', included: true },
      { text: '10 team members', included: true },
      { text: 'CSV/Excel import', included: true },
      { text: 'Advanced lead scoring', included: true },
      { text: 'Priority support', included: true },
      { text: 'Styled Excel exports', included: true },
      { text: 'Global insights dashboard', included: true },
      { text: 'Keyword Intelligence', included: true },
      { text: 'Advanced filtering', included: true },
      { text: 'Team management', included: true },
      { text: 'API access', included: false },
      { text: 'Custom integrations', included: false },
    ],
  },
  {
    tier: 'ENTERPRISE', price: null, annual: null, color: '#8b5cf6',
    desc: 'For organizations with advanced needs, custom requirements, and large-scale operations.',
    features: [
      { text: 'Unlimited leads', included: true },
      { text: 'Unlimited team members', included: true },
      { text: 'All import formats', included: true },
      { text: 'Custom scoring models', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Custom export templates', included: true },
      { text: 'Full analytics suite', included: true },
      { text: 'Keyword Intelligence', included: true },
      { text: 'Advanced filtering', included: true },
      { text: 'Admin dashboard', included: true },
      { text: 'Full API access', included: true },
      { text: 'Custom integrations & SLA', included: true },
    ],
  },
];

const faqs = [
  { q: 'Can I switch plans later?', a: 'Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.' },
  { q: 'Is there a free trial?', a: 'Yes! All plans come with a 14-day free trial. No credit card required to get started.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, MasterCard, Amex), wire transfers for Enterprise plans, and PayPal.' },
  { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. Your data will be preserved for 30 days after cancellation.' },
  { q: 'Do you offer discounts for nonprofits?', a: 'Yes, we offer special pricing for verified nonprofits and educational institutions. Contact our sales team for details.' },
  { q: 'What happens when I hit my lead limit?', a: 'You\'ll receive a notification at 80% and 100%. You can upgrade your plan or purchase additional lead capacity as needed.' },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);

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
            label="PRICING"
            sx={{ mb: 3, bgcolor: 'rgba(14,165,233,0.08)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(14,165,233,0.15)', letterSpacing: 1.5 }} />
          <Typography variant="h2" fontWeight={900} mb={2}
            sx={{ fontSize: { xs: '2rem', md: '3.5rem' }, letterSpacing: -2 }}>
            Simple,{' '}
            <Box component="span" sx={{ background: 'linear-gradient(90deg,#0ea5e9,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Transparent
            </Box>{' '}Pricing
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(240,249,255,0.45)', maxWidth: 600, mx: 'auto', fontWeight: 400, lineHeight: 1.7, mb: 4 }}>
            Start free and scale as you grow. No hidden fees, no surprises. Cancel anytime.
          </Typography>

          {/* Toggle */}
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
            <Typography variant="body2" fontWeight={annual ? 400 : 700} color={annual ? 'rgba(240,249,255,0.4)' : '#f0f9ff'}>Monthly</Typography>
            <Switch checked={annual} onChange={e => setAnnual(e.target.checked)}
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0ea5e9' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#0ea5e9' } }} />
            <Typography variant="body2" fontWeight={annual ? 700 : 400} color={annual ? '#f0f9ff' : 'rgba(240,249,255,0.4)'}>
              Annual
            </Typography>
            {annual && <Chip label="SAVE 20%" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700, fontSize: 10 }} />}
          </Stack>
        </Container>
      </Box>

      {/* Pricing Cards */}
      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 14 } }}>
        <Grid container spacing={3.5} justifyContent="center">
          {plans.map((plan, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Card sx={{
                height: '100%', borderRadius: 3, position: 'relative', overflow: 'hidden',
                bgcolor: plan.highlighted ? 'rgba(14,165,233,0.06)' : 'rgba(13,31,60,0.4)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${plan.highlighted ? 'rgba(14,165,233,0.25)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: plan.highlighted ? '0 0 80px rgba(14,165,233,0.1)' : 'none',
                transition: 'all 0.35s',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: plan.highlighted ? '0 20px 60px rgba(14,165,233,0.2)' : '0 20px 50px rgba(0,0,0,0.4)' },
              }}>
                {plan.highlighted && (
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#0ea5e9,#6366f1)' }} />
                )}
                {plan.badge && (
                  <Chip icon={<Star sx={{ fontSize: 14, color: '#0ea5e9 !important' }} />} label={plan.badge} size="small"
                    sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(14,165,233,0.12)', color: '#38bdf8', fontWeight: 700, fontSize: 10 }} />
                )}
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="overline" fontWeight={700} color={plan.color} sx={{ letterSpacing: 2 }}>
                    {plan.tier}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 1.5, mb: 1 }}>
                    {plan.price ? (
                      <>
                        <Typography variant="h3" fontWeight={900} color="#f0f9ff">${annual ? plan.annual : plan.price}</Typography>
                        <Typography variant="body2" color="rgba(240,249,255,0.4)">/month</Typography>
                      </>
                    ) : (
                      <Typography variant="h3" fontWeight={900} color="#f0f9ff">Custom</Typography>
                    )}
                  </Box>
                  <Typography variant="body2" color="rgba(240,249,255,0.45)" mb={3} lineHeight={1.6}>{plan.desc}</Typography>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 3 }} />
                  <Stack spacing={1.5} mb={4}>
                    {plan.features.map((f, j) => (
                      <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {f.included
                          ? <CheckCircle sx={{ fontSize: 16, color: plan.color }} />
                          : <Close sx={{ fontSize: 16, color: 'rgba(240,249,255,0.15)' }} />
                        }
                        <Typography variant="body2" color={f.included ? 'rgba(240,249,255,0.7)' : 'rgba(240,249,255,0.25)'}>{f.text}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Button fullWidth variant={plan.highlighted ? 'contained' : 'outlined'} size="large"
                    onClick={() => navigate('/login')}
                    sx={{
                      borderRadius: 2, py: 1.3, fontWeight: 700,
                      ...(plan.highlighted
                        ? { background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', '&:hover': { background: '#0ea5e9' } }
                        : { borderColor: 'rgba(255,255,255,0.15)', color: '#f0f9ff', '&:hover': { borderColor: plan.color, color: plan.color } }
                      ),
                    }}>
                    {plan.price ? 'Start Free Trial' : 'Contact Sales'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* FAQ */}
      <Box sx={{ py: { xs: 8, md: 14 }, bgcolor: 'rgba(14,165,233,0.015)', borderY: '1px solid rgba(255,255,255,0.03)' }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={900} textAlign="center" mb={2}
            sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
            Frequently Asked Questions
          </Typography>
          <Typography variant="body1" color="rgba(240,249,255,0.45)" textAlign="center" mb={6}>
            Everything you need to know about our pricing and plans.
          </Typography>
          <Stack spacing={2.5}>
            {faqs.map((faq, i) => (
              <Paper key={i} sx={{
                p: 3, bgcolor: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 3,
              }}>
                <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff" mb={1}>{faq.q}</Typography>
                <Typography variant="body2" color="rgba(240,249,255,0.55)" lineHeight={1.7}>{faq.a}</Typography>
              </Paper>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* CTA */}
      <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={900} gutterBottom sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
            Still Have Questions?
          </Typography>
          <Typography variant="body1" color="rgba(255,255,255,0.45)" mb={5}>
            Talk to our sales team and find the perfect plan for your business.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="contained" size="large" onClick={() => navigate('/contact')} endIcon={<ArrowForward />}
              sx={{ px: 5, py: 1.8, borderRadius: 2, background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 800 }}>
              Contact Sales
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/login')}
              sx={{ px: 5, py: 1.8, borderRadius: 2, borderColor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 }}>
              Start Free Trial
            </Button>
          </Stack>
        </Container>
      </Box>

      <LandingFooter />
    </Box>
  );
}
