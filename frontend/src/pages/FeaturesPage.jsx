import { Box, Button, Container, Typography, Grid, Card, CardContent, Stack, Chip, Divider } from '@mui/material';
import {
  CloudUpload, FilterList, Insights, DataUsage, FileDownload, Security,
  Speed, AutoAwesome, BoltOutlined, CheckCircle, ArrowForward,
  Storage, Psychology, Timeline, Tune, Shield, IntegrationInstructions,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

const FeatureCard = ({ icon: Icon, title, desc, color = '#0ea5e9' }) => (
  <Grid item xs={12} sm={6} md={4}>
    <Card sx={{
      height: '100%', bgcolor: 'rgba(13,31,60,0.4)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(14,165,233,0.08)', borderRadius: 3,
      transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)', position: 'relative', overflow: 'hidden',
      '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderColor: `${color}40` },
      '&::before': {
        content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0, transition: 'opacity 0.3s',
      },
      '&:hover::before': { opacity: 1 },
    }}>
      <CardContent sx={{ p: 3.5, textAlign: 'center' }}>
        <Box sx={{
          display: 'inline-flex', p: 1.5, borderRadius: 2.5,
          bgcolor: `${color}12`, mb: 2, color, border: `1px solid ${color}20`,
        }}>
          <Icon fontSize="large" />
        </Box>
        <Typography variant="h6" fontWeight={800} gutterBottom color="#f0f9ff" sx={{ fontSize: '1.05rem' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="rgba(240,249,255,0.55)" lineHeight={1.7}>
          {desc}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

const DetailBlock = ({ icon: Icon, title, desc, points, color, reverse }) => (
  <Box sx={{ py: { xs: 6, md: 10 }, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
    <Grid container spacing={6} alignItems="center" direction={reverse ? 'row-reverse' : 'row'}>
      <Grid item xs={12} md={6}>
        <Box sx={{
          width: 80, height: 80, borderRadius: 3, bgcolor: `${color}10`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
          border: `1px solid ${color}25`,
        }}>
          <Icon sx={{ color, fontSize: 40 }} />
        </Box>
        <Typography variant="h4" fontWeight={900} color="#f0f9ff" mb={2} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
          {title}
        </Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.55)" mb={3} lineHeight={1.8}>
          {desc}
        </Typography>
        <Stack spacing={1.5}>
          {points.map((p, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <CheckCircle sx={{ fontSize: 18, color, mt: 0.3, flexShrink: 0 }} />
              <Typography variant="body2" color="rgba(240,249,255,0.7)" lineHeight={1.6}>{p}</Typography>
            </Box>
          ))}
        </Stack>
      </Grid>
      <Grid item xs={12} md={6}>
        <Box sx={{
          height: { xs: 250, md: 380 }, borderRadius: 3,
          bgcolor: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          background: `radial-gradient(circle at 50% 50%, ${color}08, transparent 70%)`,
        }}>
          <Stack alignItems="center" spacing={2} sx={{ opacity: 0.2 }}>
            <Icon sx={{ fontSize: 80, color: '#fff' }} />
            <Typography variant="h5" fontWeight={900} color="#fff">{title}</Typography>
          </Stack>
        </Box>
      </Grid>
    </Grid>
  </Box>
);

export default function FeaturesPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#030712', color: '#f0f9ff' }}>
      <LandingNavbar />

      {/* Hero */}
      <Box sx={{
        pt: { xs: 8, md: 14 }, pb: { xs: 6, md: 10 }, textAlign: 'center',
        position: 'relative', overflow: 'hidden',
        '&::before': {
          content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 600,
          background: 'radial-gradient(ellipse at 50% -10%, #1e3a8a 0%, transparent 65%)',
          opacity: 0.4, pointerEvents: 'none',
        },
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Chip icon={<BoltOutlined sx={{ color: '#0ea5e9 !important', fontSize: 14 }} />}
            label="PLATFORM FEATURES"
            sx={{ mb: 3, bgcolor: 'rgba(14,165,233,0.08)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(14,165,233,0.15)', letterSpacing: 1.5 }} />
          <Typography variant="h2" fontWeight={900} mb={2}
            sx={{ fontSize: { xs: '2rem', md: '3.5rem' }, letterSpacing: -2 }}>
            Everything You Need to{' '}
            <Box component="span" sx={{ background: 'linear-gradient(90deg,#0ea5e9,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dominate
            </Box>
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(240,249,255,0.45)', maxWidth: 700, mx: 'auto', fontWeight: 400, fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.7 }}>
            A modular, enterprise-grade platform built from the ground up for modern revenue teams.
            Every feature is designed to accelerate your pipeline.
          </Typography>
        </Container>
      </Box>

      {/* Feature Cards Grid */}
      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 } }}>
        <Grid container spacing={3.5}>
          <FeatureCard icon={CloudUpload} color="#3b82f6" title="Bulk Data Import"
            desc="Ingest massive CSV and Excel datasets with automated deduplication, cleaning, validation, and field normalization. Supports 50MB+ uploads." />
          <FeatureCard icon={FilterList} color="#10b981" title="Smart Lead Scoring"
            desc="AI-powered lead scoring that automatically rates prospects based on industry, company size, role seniority, and engagement signals." />
          <FeatureCard icon={Insights} color="#8b5cf6" title="Keyword Intelligence"
            desc="Track keyword performance across your pipeline. Understand which sources and search terms drive the highest-quality leads." />
          <FeatureCard icon={DataUsage} color="#f59e0b" title="Global Insights Dashboard"
            desc="Real-time analytics with KPI summary cards, activity tracking, performance metrics, and team leaderboards." />
          <FeatureCard icon={FileDownload} color="#0ea5e9" title="Professional Export System"
            desc="Background-processed exports with professional Excel formatting, color-coded scoring, autofit columns, and custom field mapping." />
          <FeatureCard icon={Security} color="#ef4444" title="Granular Role-Based Access"
            desc="5-tier RBAC system: Super Admin, Admin, Manager, Employee, Marketing. Complete data isolation per role." />
          <FeatureCard icon={Speed} color="#06b6d4" title="Elasticsearch-Powered Search"
            desc="Sub-25ms multi-match search across millions of records. Filter by industry, country, job title, company size, and more." />
          <FeatureCard icon={Storage} color="#a855f7" title="Data Staging Pipeline"
            desc="Scraped and imported data lands in a staging area for review before conversion to verified leads. Full audit trail." />
          <FeatureCard icon={Psychology} color="#ec4899" title="AI Enrichment Engine"
            desc="Automatically enrich lead profiles with company data, social profiles, revenue estimates, and technology stack information." />
          <FeatureCard icon={Timeline} color="#14b8a6" title="Activity Logging"
            desc="Track every action — imports, exports, edits, logins, and logouts. Tabbed views with pagination for complete audit visibility." />
          <FeatureCard icon={Tune} color="#f97316" title="Advanced Filtering"
            desc="Multi-dimensional filtering: industry, country, domain, email domain, job title, company, score range, date range, and keyword search." />
          <FeatureCard icon={IntegrationInstructions} color="#6366f1" title="API-Ready Architecture"
            desc="RESTful API with JWT authentication, rate limiting, and complete CRUD operations. Ready for third-party integrations." />
        </Grid>
      </Container>

      {/* Detailed Feature Breakdowns */}
      <Box sx={{ bgcolor: 'rgba(14,165,233,0.015)', borderY: '1px solid rgba(255,255,255,0.03)' }}>
        <Container maxWidth="lg">
          <DetailBlock icon={CloudUpload} color="#3b82f6" title="Intelligent Data Import"
            desc="Our import engine handles the heavy lifting. Upload CSV or Excel files up to 50MB and watch as NexLead automatically processes, validates, and deduplicates your data in seconds."
            points={[
              'Automatic field mapping from any CSV/Excel format',
              'Smart name splitting (full name → first + last)',
              'Email validation and domain extraction',
              'In-batch and cross-database deduplication',
              'Keyword assignment and source tracking',
              'Bulk operations with detailed error reporting',
            ]}
          />
          <DetailBlock icon={FilterList} color="#10b981" title="Lead Scoring & Qualification" reverse
            desc="Stop wasting time on cold leads. Our scoring engine analyzes multiple signals to surface the prospects most likely to convert, helping your team focus where it matters."
            points={[
              'Automatic scoring based on data completeness and quality',
              'Hot (80+), Warm (50-79), Cold (<50) classification',
              'Score-based filtering for targeted list building',
              'Visual score distribution across your pipeline',
              'Score trends over time in the insights dashboard',
              'Custom score weighting coming soon',
            ]}
          />
          <DetailBlock icon={Shield} color="#ef4444" title="Enterprise-Grade Security"
            desc="Security is not an afterthought — it's built into every layer of NexLead. From authentication to data isolation, every interaction is protected."
            points={[
              'JWT-based authentication with automatic token rotation',
              '5-tier role-based access control (RBAC)',
              'MongoDB NoSQL injection prevention',
              'Helmet.js security headers and HSTS',
              'Rate limiting on all endpoints (login-specific limits)',
              'Complete data isolation between employee workspaces',
              'Bcrypt password hashing with 12-round salt',
              'Production-safe error handling (no stack traces exposed)',
            ]}
          />
        </Container>
      </Box>

      {/* CTA */}
      <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={900} gutterBottom sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
            Ready to Experience the Full Platform?
          </Typography>
          <Typography variant="body1" color="rgba(255,255,255,0.45)" mb={5} sx={{ fontSize: '1.1rem' }}>
            Start your free trial today. No credit card required.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/login')} endIcon={<ArrowForward />}
            sx={{
              px: 6, py: 2, borderRadius: 2, background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
              fontSize: '1.1rem', fontWeight: 800, boxShadow: '0 15px 40px rgba(14,165,233,0.3)',
              '&:hover': { transform: 'scale(1.02)', boxShadow: '0 20px 50px rgba(14,165,233,0.4)' },
            }}>
            Start Free Trial
          </Button>
        </Container>
      </Box>

      <LandingFooter />
    </Box>
  );
}
