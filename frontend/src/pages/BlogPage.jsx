import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Chip } from '@mui/material';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

const posts = [
  { title: 'The Future of AI-Driven Lead Scoring in 2026', category: 'Product', date: 'March 24, 2026', read: '5 min read', img: 'linear-gradient(135deg, #1e3a8a, #0ea5e9)' },
  { title: 'How to Build High-Converting B2B Lead Lists', category: 'Best Practices', date: 'March 20, 2026', read: '8 min read', img: 'linear-gradient(135deg, #4c1d95, #8b5cf6)' },
  { title: 'NexLead V2.0: Deep Dive into Our New Architecture', category: 'Engineering', date: 'March 15, 2026', read: '12 min read', img: 'linear-gradient(135deg, #064e3b, #10b981)' },
  { title: 'Elasticsearch Patterns for Sub-25ms Latency', category: 'Engineering', date: 'March 10, 2026', read: '10 min read', img: 'linear-gradient(135deg, #7c2d12, #f59e0b)' },
  { title: 'Mastering RBAC and Data Isolation in SaaS', category: 'Security', date: 'March 05, 2026', read: '6 min read', img: 'linear-gradient(135deg, #7f1d1d, #ef4444)' },
  { title: 'Maximizing ROI with NexLead Export Templates', category: 'Tips & Tricks', date: 'Feb 28, 2026', read: '4 min read', img: 'linear-gradient(135deg, #0f766e, #14b8a6)' },
];

export default function BlogPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#030712', color: '#f0f9ff' }}>
      <LandingNavbar />
      
      <Box sx={{ pt: { xs: 8, md: 14 }, pb: { xs: 6, md: 10 }, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={900} mb={2} sx={{ fontSize: { xs: '2rem', md: '3.5rem' }, letterSpacing: -2 }}>
            NexLead <Box component="span" sx={{ background: 'linear-gradient(90deg,#0ea5e9,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Blog</Box>
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(240,249,255,0.45)', fontWeight: 400, lineHeight: 1.7 }}>
            Insights, tutorials, engineering deep dives, and company updates.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {posts.map((post, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{
                height: '100%', bgcolor: 'rgba(13,31,60,0.4)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3, cursor: 'pointer',
                transition: 'all 0.3s', '&:hover': { borderColor: 'rgba(14,165,233,0.3)', transform: 'translateY(-6px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
              }}>
                <Box sx={{ height: 200, background: post.img }} />
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <Chip label={post.category} size="small" sx={{ bgcolor: 'rgba(14,165,233,0.1)', color: '#38bdf8', fontWeight: 700, fontSize: 10 }} />
                    <Typography variant="caption" color="rgba(240,249,255,0.4)">{post.read}</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={800} color="#f0f9ff" mb={2} lineHeight={1.4}>{post.title}</Typography>
                  <Typography variant="body2" color="rgba(240,249,255,0.4)">{post.date}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      
      <LandingFooter />
    </Box>
  );
}
