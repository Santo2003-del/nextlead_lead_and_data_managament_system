import { Box, Button, Container, Typography, Grid, Card, CardContent, Stack, Chip, Divider, Avatar } from '@mui/material';
import {
  TrendingUp, Campaign, Business, CheckCircle, ArrowForward, BoltOutlined,
  Groups, Analytics, PersonSearch, Hub, Layers, RocketLaunch,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

const solutions = [
  {
    icon: TrendingUp, color: '#10b981', title: 'For Sales Teams',
    hero: 'Close More Deals, Faster',
    heroDesc: 'Equip your sales team with precision-targeted leads and real-time pipeline analytics. Spend less time prospecting and more time closing.',
    features: [
      { title: 'Smart Prospecting', desc: 'Import and score thousands of prospects in minutes. AI-driven scoring surfaces the most qualified leads automatically.' },
      { title: 'Advanced Filtering', desc: 'Filter leads by industry, country, company size, job title, revenue, and 15+ other dimensions to build hyper-targeted lists.' },
      { title: 'One-Click Export', desc: 'Export professional, styled Excel reports with color-coded scoring, ready to share with your team or load into your CRM.' },
      { title: 'Performance Dashboards', desc: 'Track team performance with real-time metrics — leads added today, this week, this month, and all-time leaderboards.' },
      { title: 'Pipeline Visibility', desc: 'Hot, warm, and cold lead distribution charts give instant pipeline health visibility to managers and reps alike.' },
      { title: 'Activity Tracking', desc: 'Complete audit trail of every import, export, edit, and interaction for compliance and performance review.' },
    ],
    stats: [
      { value: '3x', label: 'Faster Prospecting' },
      { value: '67%', label: 'More Qualified Leads' },
      { value: '2.5x', label: 'Pipeline Growth' },
    ],
  },
  {
    icon: Campaign, color: '#8b5cf6', title: 'For Marketing Teams',
    hero: 'Data-Driven Campaigns That Convert',
    heroDesc: 'Build segmented contact lists, analyze keyword performance, and monitor campaign ROI with verified B2B contact data.',
    features: [
      { title: 'Audience Segmentation', desc: 'Build targeted contact lists for ABM campaigns by filtering on industry, geography, company size, and technology stack.' },
      { title: 'Keyword Intelligence', desc: 'Track which keywords and sources drive the highest-quality leads. Optimize your content and ad spend with data.' },
      { title: 'Global Insights', desc: 'Monitor lead generation KPIs in real-time: today, this week, this month — broken down by user, source, and keyword.' },
      { title: 'Data Quality Engine', desc: 'Automatic deduplication, email validation, and field normalization ensure your marketing database is always clean.' },
      { title: 'Source Attribution', desc: 'Track where every lead comes from — import source, scraper keyword, or manual entry — for accurate marketing attribution.' },
      { title: 'Branded Exports', desc: 'Export styled reports with your formatting and deliver professional data packages to stakeholders.' },
    ],
    stats: [
      { value: '45%', label: 'Better Targeting' },
      { value: '98.4%', label: 'Data Accuracy' },
      { value: '5x', label: 'Faster List Building' },
    ],
  },
  {
    icon: Business, color: '#0ea5e9', title: 'For Agencies',
    hero: 'Scale Client Services Effortlessly',
    heroDesc: 'Multi-user access with role-based permissions, isolated workspaces, and bulk data processing for agency-scale operations.',
    features: [
      { title: 'Multi-User Workspaces', desc: 'Role-based access control with isolated data views. Each team member sees only their own data unless given admin access.' },
      { title: 'White-Label Data Delivery', desc: 'Professional export formatting with auto-fit columns, color-coded scores, and clean layouts for client deliverables.' },
      { title: 'Bulk Data Processing', desc: 'Import, process, and manage datasets with millions of records. Background processing ensures zero downtime.' },
      { title: 'Team Management', desc: 'Admin dashboard for monitoring employee activity, lead contribution, import history, and real-time engagement.' },
      { title: 'Client Data Isolation', desc: 'Strict role-based data isolation ensures client data never leaks between team members or departments.' },
      { title: 'Scalable Architecture', desc: 'MongoDB + Elasticsearch backend handles millions of records without performance degradation. Built to scale.' },
    ],
    stats: [
      { value: '10x', label: 'Operational Efficiency' },
      { value: '250+', label: 'Agencies Trust Us' },
      { value: '99.99%', label: 'Uptime SLA' },
    ],
  },
];

export default function SolutionsPage() {
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
            label="SOLUTIONS"
            sx={{ mb: 3, bgcolor: 'rgba(14,165,233,0.08)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(14,165,233,0.15)', letterSpacing: 1.5 }} />
          <Typography variant="h2" fontWeight={900} mb={2}
            sx={{ fontSize: { xs: '2rem', md: '3.5rem' }, letterSpacing: -2 }}>
            Built For{' '}
            <Box component="span" sx={{ background: 'linear-gradient(90deg,#0ea5e9,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Every Team
            </Box>
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(240,249,255,0.45)', maxWidth: 700, mx: 'auto', fontWeight: 400, lineHeight: 1.7 }}>
            Whether you're closing deals, running campaigns, or managing clients — NexLead adapts to your specific workflow and scales with your growth.
          </Typography>
        </Container>
      </Box>

      {/* Solution Sections */}
      {solutions.map((sol, idx) => (
        <Box key={idx} sx={{
          py: { xs: 8, md: 14 },
          bgcolor: idx % 2 === 1 ? 'rgba(14,165,233,0.015)' : 'transparent',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <Container maxWidth="lg">
            {/* Section Header */}
            <Grid container spacing={6} alignItems="center" sx={{ mb: 6 }}>
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: 2.5, bgcolor: `${sol.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${sol.color}25`,
                  }}>
                    <sol.icon sx={{ color: sol.color, fontSize: 30 }} />
                  </Box>
                  <Chip label={sol.title.toUpperCase()} sx={{
                    bgcolor: `${sol.color}12`, color: sol.color, fontWeight: 700,
                    border: `1px solid ${sol.color}25`, letterSpacing: 1,
                  }} />
                </Box>
                <Typography variant="h3" fontWeight={900} color="#f0f9ff" mb={2}
                  sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, lineHeight: 1.2 }}>
                  {sol.hero}
                </Typography>
                <Typography variant="body1" color="rgba(240,249,255,0.55)" lineHeight={1.8} sx={{ fontSize: '1.05rem' }}>
                  {sol.heroDesc}
                </Typography>
              </Grid>
              <Grid item xs={12} md={5}>
                <Grid container spacing={2}>
                  {sol.stats.map((stat, i) => (
                    <Grid item xs={4} key={i}>
                      <Box sx={{
                        textAlign: 'center', p: 2, borderRadius: 2.5,
                        bgcolor: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <Typography variant="h4" fontWeight={900} color={sol.color}>{stat.value}</Typography>
                        <Typography variant="caption" color="rgba(240,249,255,0.4)">{stat.label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>

            {/* Feature Cards */}
            <Grid container spacing={3}>
              {sol.features.map((feat, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card sx={{
                    height: '100%', bgcolor: 'rgba(13,31,60,0.4)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3,
                    transition: 'all 0.3s',
                    '&:hover': { borderColor: `${sol.color}30`, transform: 'translateY(-4px)' },
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff" mb={1.5}>{feat.title}</Typography>
                      <Typography variant="body2" color="rgba(240,249,255,0.55)" lineHeight={1.7}>{feat.desc}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      ))}

      {/* CTA */}
      <Box sx={{
        py: { xs: 8, md: 12 }, textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(99,102,241,0.06))',
        borderY: '1px solid rgba(14,165,233,0.1)',
      }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={900} gutterBottom sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
            Find Your Perfect Solution
          </Typography>
          <Typography variant="body1" color="rgba(255,255,255,0.45)" mb={5} sx={{ fontSize: '1.1rem' }}>
            Start free. Scale as you grow. Upgrade when you're ready.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="contained" size="large" onClick={() => navigate('/login')} endIcon={<ArrowForward />}
              sx={{
                px: 5, py: 1.8, borderRadius: 2, background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)',
                fontWeight: 800, '&:hover': { transform: 'translateY(-2px)' },
              }}>
              Get Started Free
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/pricing')}
              sx={{
                px: 5, py: 1.8, borderRadius: 2, borderColor: 'rgba(255,255,255,0.15)', color: '#fff',
                fontWeight: 600, '&:hover': { borderColor: '#0ea5e9', color: '#0ea5e9' },
              }}>
              View Pricing
            </Button>
          </Stack>
        </Container>
      </Box>

      <LandingFooter />
    </Box>
  );
}
