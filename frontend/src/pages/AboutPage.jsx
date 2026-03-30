import { Box, Button, Container, Typography, Grid, Card, CardContent, Stack, Chip, Paper, Avatar, Divider } from '@mui/material';
import {
  BoltOutlined, LocationOn, Groups, Star, AutoAwesome, ArrowForward,
  Verified, EmojiEvents, TrendingUp, Public, Security, Speed,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

const values = [
  { icon: Speed, color: '#0ea5e9', title: 'Speed', desc: 'We believe fast iteration beats perfect planning. Our platform processes millions of records in seconds, not minutes.' },
  { icon: Verified, color: '#10b981', title: 'Accuracy', desc: '98.4% data accuracy is not a marketing number — it\'s a commitment. Every contact is validated and deduplicated.' },
  { icon: Security, color: '#ef4444', title: 'Security', desc: 'Enterprise-grade security from authentication to data isolation. Your data is protected at every layer.' },
  { icon: EmojiEvents, color: '#f59e0b', title: 'Excellence', desc: 'We don\'t ship "good enough." Every feature is iterated until it exceeds expectations.' },
  { icon: Public, color: '#8b5cf6', title: 'Global Reach', desc: 'Serving clients across 12+ countries with localized data and multi-timezone support.' },
  { icon: TrendingUp, color: '#06b6d4', title: 'Growth', desc: 'We grow when you grow. Our pricing scales with your success, never against it.' },
];

const milestones = [
  { year: '2022', title: 'Founded', desc: 'NexLead was born from a simple idea: B2B data should be fast, accurate, and accessible to every team.' },
  { year: '2023', title: 'Platform Launch', desc: 'V1.0 launched with bulk import, lead management, and Elasticsearch-powered search.' },
  { year: '2024', title: 'Enterprise Features', desc: 'Added RBAC, keyword intelligence, global insights, and professional export engine.' },
  { year: '2025', title: 'Scale & Growth', desc: '250+ clients across 12 countries. 42M+ records indexed. 99.99% uptime achieved.' },
  { year: '2026', title: 'V2.0 Released', desc: 'Complete platform overhaul with AI scoring, activity tracking, and data isolation per user workspace.' },
];

const team = [
  { name: 'Santosh K.', role: 'Founder & CEO', avatar: 'S', color: '#0ea5e9' },
  { name: 'Aditya M.', role: 'CTO', avatar: 'A', color: '#8b5cf6' },
  { name: 'Priya R.', role: 'Head of Product', avatar: 'P', color: '#10b981' },
  { name: 'Raj P.', role: 'Lead Engineer', avatar: 'R', color: '#f59e0b' },
  { name: 'Neha S.', role: 'Head of Sales', avatar: 'N', color: '#ef4444' },
  { name: 'Vikram D.', role: 'Data Scientist', avatar: 'V', color: '#06b6d4' },
];

export default function AboutPage() {
  const navigate = useNavigate();

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
            label="ABOUT US"
            sx={{ mb: 3, bgcolor: 'rgba(14,165,233,0.08)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(14,165,233,0.15)', letterSpacing: 1.5 }} />
          <Typography variant="h2" fontWeight={900} mb={2}
            sx={{ fontSize: { xs: '2rem', md: '3.5rem' }, letterSpacing: -2 }}>
            Powering B2B Growth{' '}
            <Box component="span" sx={{ background: 'linear-gradient(90deg,#0ea5e9,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Worldwide
            </Box>
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(240,249,255,0.45)', maxWidth: 700, mx: 'auto', fontWeight: 400, lineHeight: 1.7 }}>
            NexLead is a next-generation lead intelligence platform built for modern sales and marketing teams
            that demand precision, speed, and enterprise-grade security.
          </Typography>
        </Container>
      </Box>

      {/* Stats */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'rgba(14,165,233,0.02)', borderY: '1px solid rgba(255,255,255,0.03)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {[
              { value: '50,000+', label: 'Insights Published Annually', icon: AutoAwesome },
              { value: '250+', label: 'Clients Worldwide', icon: Groups },
              { value: '12+', label: 'Countries Served', icon: Public },
              { value: '350+', label: 'Projects Completed', icon: Star },
            ].map((stat, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Paper sx={{
                  p: 3.5, bgcolor: 'rgba(13,31,60,0.5)', backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3, textAlign: 'center',
                  transition: 'all 0.3s', '&:hover': { borderColor: 'rgba(14,165,233,0.2)', transform: 'translateY(-4px)' },
                }}>
                  <stat.icon sx={{ color: '#0ea5e9', fontSize: 32, mb: 1.5 }} />
                  <Typography variant="h3" fontWeight={900} color="#f0f9ff" mb={0.5} sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}>{stat.value}</Typography>
                  <Typography variant="caption" color="rgba(240,249,255,0.4)" fontWeight={500}>{stat.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Story */}
      <Box sx={{ py: { xs: 8, md: 14 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="overline" color="#0ea5e9" fontWeight={700} sx={{ letterSpacing: 2 }}>OUR STORY</Typography>
              <Typography variant="h3" fontWeight={900} color="#f0f9ff" mb={3}
                sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' }, lineHeight: 1.3 }}>
                Born from a Real Problem
              </Typography>
              <Typography variant="body1" color="rgba(240,249,255,0.55)" mb={3} lineHeight={1.8}>
                In 2022, our founding team was struggling with the same problem every B2B company faces:
                accessing high-quality lead data without spending thousands on existing tools that delivered
                inconsistent results.
              </Typography>
              <Typography variant="body1" color="rgba(240,249,255,0.55)" mb={3} lineHeight={1.8}>
                We built NexLead to be the platform we wished existed — one that combines blazing-fast search
                (powered by Elasticsearch), intelligent data processing, and enterprise-grade security in a
                single, beautiful interface.
              </Typography>
              <Typography variant="body1" color="rgba(240,249,255,0.55)" lineHeight={1.8}>
                Today, headquartered in <strong style={{ color: '#f0f9ff' }}>Pune, India</strong>, we serve
                250+ organizations across 12 countries, processing over 42 million business contacts with
                98.4% verified accuracy.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="overline" color="#0ea5e9" fontWeight={700} sx={{ letterSpacing: 2, mb: 2, display: 'block' }}>MILESTONES</Typography>
              <Stack spacing={0}>
                {milestones.map((m, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 3, pb: 3, position: 'relative' }}>
                    {i < milestones.length - 1 && (
                      <Box sx={{ position: 'absolute', left: 19, top: 36, bottom: 0, width: 2, bgcolor: 'rgba(14,165,233,0.15)' }} />
                    )}
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '50%', bgcolor: 'rgba(14,165,233,0.1)',
                      border: '2px solid rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, zIndex: 1,
                    }}>
                      <Typography variant="caption" fontWeight={900} color="#0ea5e9" sx={{ fontSize: 10 }}>{m.year}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff">{m.title}</Typography>
                      <Typography variant="body2" color="rgba(240,249,255,0.5)" lineHeight={1.6}>{m.desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Values */}
      <Box sx={{ py: { xs: 8, md: 14 }, bgcolor: 'rgba(14,165,233,0.015)', borderY: '1px solid rgba(255,255,255,0.03)' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography variant="h3" fontWeight={900} mb={2} sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}>Our Values</Typography>
            <Typography variant="body1" color="rgba(240,249,255,0.45)" sx={{ maxWidth: 600, mx: 'auto' }}>
              The principles that guide every decision we make and every feature we ship.
            </Typography>
          </Box>
          <Grid container spacing={3.5}>
            {values.map((v, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card sx={{
                  height: '100%', bgcolor: 'rgba(13,31,60,0.4)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3,
                  transition: 'all 0.3s', '&:hover': { borderColor: `${v.color}30`, transform: 'translateY(-4px)' },
                }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 2, bgcolor: `${v.color}12`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
                      border: `1px solid ${v.color}20`,
                    }}>
                      <v.icon sx={{ color: v.color, fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} color="#f0f9ff" mb={1}>{v.title}</Typography>
                    <Typography variant="body2" color="rgba(240,249,255,0.55)" lineHeight={1.7}>{v.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Team */}
      <Box sx={{ py: { xs: 8, md: 14 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography variant="h3" fontWeight={900} mb={2} sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}>Meet the Team</Typography>
            <Typography variant="body1" color="rgba(240,249,255,0.45)" sx={{ maxWidth: 600, mx: 'auto' }}>
              The people behind NexLead — engineers, designers, and data experts.
            </Typography>
          </Box>
          <Grid container spacing={3} justifyContent="center">
            {team.map((t, i) => (
              <Grid item xs={6} sm={4} md={2} key={i}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{
                    width: 72, height: 72, mx: 'auto', mb: 2,
                    bgcolor: `${t.color}18`, color: t.color,
                    fontSize: 28, fontWeight: 900, border: `2px solid ${t.color}30`,
                  }}>
                    {t.avatar}
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight={700} color="#f0f9ff">{t.name}</Typography>
                  <Typography variant="caption" color="rgba(240,249,255,0.4)">{t.role}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Office */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'rgba(14,165,233,0.015)', borderY: '1px solid rgba(255,255,255,0.03)' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <LocationOn sx={{ color: '#0ea5e9', fontSize: 40, mb: 2 }} />
          <Typography variant="h4" fontWeight={900} mb={2}>Our Headquarters</Typography>
          <Typography variant="body1" color="rgba(240,249,255,0.55)" mb={1}>
            Office No: 301, Ashwamedh Building
          </Typography>
          <Typography variant="body1" color="rgba(240,249,255,0.55)" mb={1}>
            Veerbhadra Nagar, Baner
          </Typography>
          <Typography variant="body1" color="rgba(240,249,255,0.55)" mb={4}>
            Pune, Maharashtra 411045, India
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/contact')} endIcon={<ArrowForward />}
            sx={{ borderColor: 'rgba(14,165,233,0.3)', color: '#0ea5e9', fontWeight: 700, borderRadius: 2, px: 4, py: 1.2 }}>
            Get in Touch
          </Button>
        </Container>
      </Box>

      <LandingFooter />
    </Box>
  );
}
