import { Box, Button, Container, Typography, Grid, Card, CardContent, Stack, Chip, Divider, IconButton } from '@mui/material';
import {
  BoltOutlined, CheckCircle, ArrowForward,
  CloudUpload, FilterList, Insights, DataUsage, FileDownload, Security,
  TrendingUp, Campaign, Business, KeyboardArrowDown,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#030712', color: '#f0f9ff' }}>
      <style>{`
        @keyframes float { 0%{transform:translateY(0)} 50%{transform:translateY(-18px)} 100%{transform:translateY(0)} }
        @keyframes pulse-glow { 0%{box-shadow:0 0 20px rgba(14,165,233,0.1)} 50%{box-shadow:0 0 40px rgba(14,165,233,0.3)} 100%{box-shadow:0 0 20px rgba(14,165,233,0.1)} }
      `}</style>

      <LandingNavbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <Box sx={{
        position: 'relative',
        '&::before': {
          content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 900,
          background: 'radial-gradient(ellipse at 50% -10%, #1e3a8a 0%, transparent 65%)',
          opacity: 0.5, pointerEvents: 'none',
        },
      }}>
        <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 18 }, pb: { xs: 8, md: 14 }, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Chip icon={<BoltOutlined sx={{ color: '#0ea5e9 !important', fontSize: 16 }} />}
            label="V2.0 — ENTERPRISE-GRADE LEAD PLATFORM"
            sx={{ mb: 4, bgcolor: 'rgba(14,165,233,0.08)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(14,165,233,0.15)', letterSpacing: 1.5, px: 1 }} />
          <Typography variant="h1" sx={{
            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '5rem' }, fontWeight: 900,
            letterSpacing: -3, lineHeight: 1, mb: 3,
            background: 'linear-gradient(180deg, #ffffff 30%, rgba(255,255,255,0.45) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            The Future of{' '}
            <Box component="span" sx={{ background: 'linear-gradient(90deg,#0ea5e9,#38bdf8,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Lead Intelligence
            </Box>
          </Typography>
          <Typography variant="h6" sx={{
            color: 'rgba(240,249,255,0.45)', maxWidth: 750, mx: 'auto', mb: 6,
            fontWeight: 400, fontSize: { xs: '1rem', md: '1.2rem' }, lineHeight: 1.7,
          }}>
            Import, enrich, filter, and export high-quality leads with AI-driven insights.
            Built for high-velocity sales teams that demand precision and scale.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" mb={6}>
            <Button variant="contained" size="large" onClick={() => navigate('/login')} endIcon={<ArrowForward />}
              sx={{
                px: 5, py: 2, borderRadius: 2, background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)',
                fontSize: '1.1rem', fontWeight: 800, boxShadow: '0 10px 35px rgba(14,165,233,0.35)',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 15px 45px rgba(14,165,233,0.45)' },
              }}>
              Get Started Free
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/login')}
              sx={{
                px: 5, py: 2, borderRadius: 2, borderColor: 'rgba(255,255,255,0.12)', color: '#fff',
                fontSize: '1.05rem', fontWeight: 600, backdropFilter: 'blur(10px)',
                '&:hover': { borderColor: 'rgba(255,255,255,0.35)', bgcolor: 'rgba(255,255,255,0.03)' },
              }}>
              Login
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ── STATS ─────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'rgba(14,165,233,0.02)', borderY: '1px solid rgba(255,255,255,0.03)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 6 }}>
            {[
              { label: 'Records Indexed', value: '42M+', sub: 'Real-time B2B data' },
              { label: 'Search Latency', value: '<25ms', sub: 'Elasticsearch 8.0' },
              { label: 'Data Accuracy', value: '98.4%', sub: 'Verified contacts' },
              { label: 'API Uptime', value: '99.99%', sub: 'High availability' },
            ].map((s, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Typography variant="h3" fontWeight={900} color="#0ea5e9" gutterBottom sx={{ fontSize: { xs: '1.8rem', md: '2.8rem' } }}>{s.value}</Typography>
                <Typography variant="subtitle2" fontWeight={700} color="#f0f9ff" mb={0.5}>{s.label}</Typography>
                <Typography variant="caption" color="rgba(240,249,255,0.3)">{s.sub}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── FEATURE HIGHLIGHTS ────────────────────────────── */}
      <Box sx={{ py: { xs: 10, md: 18 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Chip icon={<BoltOutlined sx={{ color: '#0ea5e9 !important', fontSize: 14 }} />}
              label="PLATFORM"
              sx={{ mb: 3, bgcolor: 'rgba(14,165,233,0.08)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(14,165,233,0.15)', letterSpacing: 1.2 }} />
            <Typography variant="h2" fontWeight={900} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' }, letterSpacing: -1 }}>
              Enterprise-Grade Power
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(240,249,255,0.45)', maxWidth: 700, mx: 'auto', fontWeight: 400, lineHeight: 1.6 }}>
              Modular architecture built for the modern revenue stack. Every tool you need to dominate your pipeline.
            </Typography>
          </Box>
          <Grid container spacing={3.5}>
            {[
              { icon: CloudUpload, title: 'Data Import & Deduplication', desc: 'Ingest massive CSV and Excel datasets with automated deduplication, cleaning, and normalization.', color: '#3b82f6' },
              { icon: FilterList, title: 'Lead Management', desc: 'Score, qualify, and prioritize leads with intelligent filtering. Focus on high-intent prospects.', color: '#10b981' },
              { icon: Insights, title: 'Keyword Intelligence', desc: 'Track keyword performance across your pipeline. Understand which sources drive quality leads.', color: '#8b5cf6' },
              { icon: DataUsage, title: 'Global Insights Dashboard', desc: 'Real-time analytics with KPI cards, activity tracking, and performance metrics across your team.', color: '#f59e0b' },
              { icon: FileDownload, title: 'Smart Export System', desc: 'Background-processed exports with professional Excel formatting and color-coded scoring.', color: '#0ea5e9' },
              { icon: Security, title: 'Granular RBAC', desc: 'Role-based access for Super Admin, Admin, Manager, Employee, and Marketing. Data isolation guaranteed.', color: '#ef4444' },
            ].map((f, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card sx={{
                  height: '100%', bgcolor: 'rgba(13,31,60,0.4)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(14,165,233,0.08)', borderRadius: 3,
                  transition: 'all 0.35s', position: 'relative', overflow: 'hidden',
                  '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderColor: `${f.color}40` },
                }}>
                  <CardContent sx={{ p: 3.5, textAlign: 'center' }}>
                    <Box sx={{
                      display: 'inline-flex', p: 1.5, borderRadius: 2.5,
                      bgcolor: `${f.color}12`, mb: 2, color: f.color, border: `1px solid ${f.color}20`,
                    }}>
                      <f.icon fontSize="large" />
                    </Box>
                    <Typography variant="h6" fontWeight={800} gutterBottom color="#f0f9ff" sx={{ fontSize: '1.05rem' }}>{f.title}</Typography>
                    <Typography variant="body2" color="rgba(240,249,255,0.55)" lineHeight={1.7}>{f.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box textAlign="center" mt={6}>
            <Button variant="outlined" onClick={() => navigate('/features')} endIcon={<ArrowForward />}
              sx={{ borderColor: 'rgba(14,165,233,0.3)', color: '#0ea5e9', fontWeight: 700, borderRadius: 2, px: 4, py: 1.2 }}>
              View All Features
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── SOLUTIONS PREVIEW ─────────────────────────────── */}
      <Box sx={{ py: { xs: 10, md: 18 }, bgcolor: 'rgba(14,165,233,0.015)', borderY: '1px solid rgba(255,255,255,0.03)' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Chip label="SOLUTIONS" sx={{ mb: 3, bgcolor: 'rgba(14,165,233,0.08)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(14,165,233,0.15)', letterSpacing: 1.2 }} />
            <Typography variant="h2" fontWeight={900} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
              Built For Every Team
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(240,249,255,0.45)', maxWidth: 700, mx: 'auto', fontWeight: 400, lineHeight: 1.6 }}>
              Whether you're closing deals, running campaigns, or managing clients — NexLead adapts to your workflow.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {[
              { icon: TrendingUp, color: '#10b981', title: 'Sales Teams', desc: 'Accelerate your pipeline with precision-targeted lead intelligence and real-time scoring.',
                points: ['Import and score thousands of prospects in minutes', 'Filter by industry, country, company size', 'Export targeted lists instantly', 'Track team performance dashboards'] },
              { icon: Campaign, color: '#8b5cf6', title: 'Marketing Teams', desc: 'Drive campaigns with verified, enriched B2B contact data and keyword analytics.',
                points: ['Build segmented contact lists for ABM campaigns', 'Analyze keyword performance and lead sources', 'Monitor campaign ROI with global insights', 'Clean and deduplicate data automatically'] },
              { icon: Business, color: '#0ea5e9', title: 'Agencies', desc: 'Scale your client services with enterprise-grade data infrastructure and team isolation.',
                points: ['Multi-user access with role-based permissions', 'White-label data delivery with styled exports', 'Isolated workspaces per team member', 'Bulk import and process client data'] },
            ].map((sol, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Card sx={{
                  height: '100%', borderRadius: 3, bgcolor: 'rgba(13,31,60,0.5)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.35s',
                  '&:hover': { borderColor: `${sol.color}30`, transform: 'translateY(-4px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' },
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{
                      width: 52, height: 52, borderRadius: 2.5, bgcolor: `${sol.color}12`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5,
                      border: `1px solid ${sol.color}20`,
                    }}>
                      <sol.icon sx={{ color: sol.color, fontSize: 26 }} />
                    </Box>
                    <Typography variant="h5" fontWeight={800} color="#f0f9ff" mb={1}>{sol.title}</Typography>
                    <Typography variant="body2" color="rgba(240,249,255,0.5)" mb={3}>{sol.desc}</Typography>
                    <Stack spacing={1.5}>
                      {sol.points.map((p, j) => (
                        <Box key={j} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                          <CheckCircle sx={{ fontSize: 16, color: sol.color, mt: 0.3, flexShrink: 0 }} />
                          <Typography variant="body2" color="rgba(240,249,255,0.7)" lineHeight={1.5}>{p}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box textAlign="center" mt={6}>
            <Button variant="outlined" onClick={() => navigate('/solutions')} endIcon={<ArrowForward />}
              sx={{ borderColor: 'rgba(14,165,233,0.3)', color: '#0ea5e9', fontWeight: 700, borderRadius: 2, px: 4, py: 1.2 }}>
              Explore All Solutions
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── PRICING PREVIEW ───────────────────────────────── */}
      <Box sx={{ py: { xs: 10, md: 18 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography variant="h2" fontWeight={900} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
              Simple, Transparent Pricing
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(240,249,255,0.45)', fontWeight: 400 }}>
              Start free and scale as you grow.
            </Typography>
          </Box>
          <Grid container spacing={3.5} justifyContent="center">
            {[
              { tier: 'BASIC', price: '$49', desc: 'Small teams', color: '#10b981', features: ['5,000 leads', '2 members', 'CSV import', 'Email support'] },
              { tier: 'PRO', price: '$149', desc: 'Growing teams', color: '#0ea5e9', highlighted: true, features: ['50,000 leads', '10 members', 'Advanced filtering', 'Keyword intelligence', 'Priority support'] },
              { tier: 'ENTERPRISE', price: 'Custom', desc: 'Large orgs', color: '#8b5cf6', features: ['Unlimited leads', 'Unlimited members', 'API access', 'Dedicated manager', 'SLA guarantee'] },
            ].map((p, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Card sx={{
                  height: '100%', borderRadius: 3, position: 'relative', overflow: 'hidden',
                  bgcolor: p.highlighted ? 'rgba(14,165,233,0.06)' : 'rgba(13,31,60,0.4)', backdropFilter: 'blur(16px)',
                  border: `1px solid ${p.highlighted ? 'rgba(14,165,233,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.35s', '&:hover': { transform: 'translateY(-6px)' },
                }}>
                  {p.highlighted && <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#0ea5e9,#6366f1)' }} />}
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="overline" fontWeight={700} color={p.color} sx={{ letterSpacing: 2 }}>{p.tier}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 1, mb: 1 }}>
                      <Typography variant="h3" fontWeight={900} color="#f0f9ff">{p.price}</Typography>
                      {p.price !== 'Custom' && <Typography variant="body2" color="rgba(240,249,255,0.4)">/mo</Typography>}
                    </Box>
                    <Typography variant="body2" color="rgba(240,249,255,0.45)" mb={3}>{p.desc}</Typography>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 3 }} />
                    <Stack spacing={1.2} mb={3}>
                      {p.features.map((f, j) => (
                        <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 15, color: p.color }} />
                          <Typography variant="body2" color="rgba(240,249,255,0.7)">{f}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Button fullWidth variant={p.highlighted ? 'contained' : 'outlined'} onClick={() => navigate('/pricing')}
                      sx={{
                        borderRadius: 2, py: 1.2, fontWeight: 700,
                        ...(p.highlighted
                          ? { background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)' }
                          : { borderColor: 'rgba(255,255,255,0.15)', color: '#f0f9ff' }
                        ),
                      }}>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── CTA BANNER ────────────────────────────────────── */}
      <Box sx={{
        py: { xs: 8, md: 12 }, textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(99,102,241,0.06))',
        borderY: '1px solid rgba(14,165,233,0.1)',
      }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={900} gutterBottom sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
            Ready to Scale Your Pipeline?
          </Typography>
          <Typography variant="body1" color="rgba(255,255,255,0.45)" mb={5} sx={{ fontSize: '1.15rem' }}>
            Join 250+ high-growth companies using NexLead to dominate their markets.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="contained" size="large" onClick={() => navigate('/login')} endIcon={<ArrowForward />}
              sx={{
                px: 7, py: 2.2, borderRadius: 2, background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
                fontSize: '1.15rem', fontWeight: 900, boxShadow: '0 15px 40px rgba(14,165,233,0.3)',
                '&:hover': { transform: 'scale(1.02)', boxShadow: '0 20px 50px rgba(14,165,233,0.4)' },
              }}>
              Start Free Trial
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/contact')}
              sx={{ px: 5, py: 2, borderRadius: 2, borderColor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 }}>
              Contact Sales
            </Button>
          </Stack>
        </Container>
      </Box>

      <LandingFooter />
    </Box>
  );
}
