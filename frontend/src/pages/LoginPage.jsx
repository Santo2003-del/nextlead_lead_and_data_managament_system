import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress, Stack, Container,
} from '@mui/material';
import {
  Visibility, VisibilityOff, BoltOutlined,
  AdminPanelSettings, SupervisorAccount, PersonOutline,
  CampaignOutlined, ShieldOutlined, ArrowBack,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROLE_CARDS = [
  {
    label: 'Super Admin',
    icon: ShieldOutlined,
    desc: 'Complete system control, user management & all platform settings.',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.25)',
  },
  {
    label: 'Admin',
    icon: AdminPanelSettings,
    desc: 'Full platform management with team oversight capabilities.',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
  },
  {
    label: 'Manager',
    icon: SupervisorAccount,
    desc: 'Team leadership, data exports & analytics access.',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.25)',
  },
  {
    label: 'Employee',
    icon: PersonOutline,
    desc: 'Personal workspace with lead management tools.',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.25)',
  },
  {
    label: 'Marketing',
    icon: CampaignOutlined,
    desc: 'Campaign analytics, data imports & insights.',
    color: '#0ea5e9',
    glow: 'rgba(14,165,233,0.25)',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setL] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setL(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome to NexLead');
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setL(false); }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 0%, #0d1f3c 0%, #050d1a 50%, #030712 100%)',
      position: 'relative', overflow: 'hidden', px: 2, py: 4,
    }}>
      <style>
        {`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(14,165,233,0.3); }
          70% { box-shadow: 0 0 0 12px rgba(14,165,233,0); }
          100% { box-shadow: 0 0 0 0 rgba(14,165,233,0); }
        }
        @keyframes float-bg {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -20px) rotate(1deg); }
          66% { transform: translate(-15px, 15px) rotate(-1deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        `}
      </style>

      {/* Floating decorative orbs */}
      {[
        { top: '10%', left: '10%', size: 300, color: 'rgba(14,165,233,0.04)', dur: '18s' },
        { top: '60%', right: '5%', size: 250, color: 'rgba(139,92,246,0.04)', dur: '22s' },
        { bottom: '10%', left: '30%', size: 200, color: 'rgba(16,185,129,0.03)', dur: '20s' },
      ].map((orb, i) => (
        <Box key={i} sx={{
          position: 'absolute', ...orb,
          width: orb.size, height: orb.size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
          animation: `float-bg ${orb.dur} ease-in-out infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, zIndex: 1 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2.5,
          background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse-ring 3s infinite',
          boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
        }}>
          <BoltOutlined sx={{ color: '#fff', fontSize: 26 }} />
        </Box>
        <Typography variant="h4" fontWeight={900} color="#f0f9ff"
          sx={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.03em' }}>
          NexLead
        </Typography>
      </Box>
      <Typography variant="body2" color="rgba(240,249,255,0.4)" mb={4} textAlign="center" sx={{ zIndex: 1 }}>
        Enterprise Lead Intelligence Platform
      </Typography>

      <Container maxWidth="md" sx={{ zIndex: 1 }}>
        {/* Glassmorphism Login Flow */}
        {!selectedRole ? (
          /* ── Role Selection Grid ────────────────────────── */
          <Box>
            <Typography variant="h5" fontWeight={700} color="#f0f9ff" mb={1} textAlign="center">
              Select Your Access Role
            </Typography>
            <Typography variant="body2" color="rgba(240,249,255,0.4)" mb={4} textAlign="center">
              Choose your role to authenticate with the platform
            </Typography>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
              gap: 2.5,
              maxWidth: 780,
              mx: 'auto',
            }}>
              {ROLE_CARDS.map((role) => (
                <Card
                  key={role.label}
                  onClick={() => setSelectedRole(role)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-6px) scale(1.02)',
                      borderColor: `${role.color}60`,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      boxShadow: `0 20px 40px ${role.glow}, 0 0 60px ${role.glow}`,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0, left: 0, right: 0, height: '3px',
                      background: `linear-gradient(90deg, transparent, ${role.color}, transparent)`,
                      opacity: 0,
                      transition: 'opacity 0.3s',
                    },
                    '&:hover::before': { opacity: 1 },
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Box sx={{
                      width: 52, height: 52, borderRadius: 2.5,
                      bgcolor: `${role.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      mx: 'auto', mb: 2,
                      border: `1px solid ${role.color}25`,
                      transition: 'all 0.3s',
                    }}>
                      <role.icon sx={{ color: role.color, fontSize: 26 }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff" mb={0.5}>
                      {role.label}
                    </Typography>
                    <Typography variant="caption" color="rgba(240,249,255,0.45)" sx={{ lineHeight: 1.5, display: 'block' }}>
                      {role.desc}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      sx={{
                        mt: 2, borderColor: `${role.color}30`, color: role.color,
                        fontSize: 12, fontWeight: 700, borderRadius: 2, py: 0.6,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: `${role.color}12`,
                          borderColor: `${role.color}60`,
                        },
                      }}
                    >
                      Login as {role.label}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        ) : (
          /* ── Login Form ─────────────────────────────────── */
          <Box sx={{ maxWidth: 420, mx: 'auto' }}>
            <Card sx={{
              borderRadius: 3,
              bgcolor: 'rgba(15,25,45,0.85)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${selectedRole.color}30`,
              boxShadow: `0 0 80px ${selectedRole.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
            }}>
              <CardContent sx={{ p: 4 }}>
                {/* Back button */}
                <Button
                  startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
                  onClick={() => { setSelectedRole(null); setError(''); setForm({ email: '', password: '' }); }}
                  sx={{
                    color: 'rgba(240,249,255,0.5)', fontSize: 12, mb: 2, ml: -1,
                    textTransform: 'none', fontWeight: 500,
                    '&:hover': { color: '#f0f9ff', bgcolor: 'rgba(255,255,255,0.03)' },
                  }}
                >
                  Back to roles
                </Button>

                {/* Role identity */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{
                    width: 48, height: 48, borderRadius: 2.5,
                    bgcolor: `${selectedRole.color}18`,
                    border: `1px solid ${selectedRole.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <selectedRole.icon sx={{ color: selectedRole.color, fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="#f0f9ff">
                      {selectedRole.label} Login
                    </Typography>
                    <Typography variant="caption" color="rgba(240,249,255,0.4)">
                      {selectedRole.desc}
                    </Typography>
                  </Box>
                </Box>

                {error && <Alert severity="error" sx={{
                  mb: 2, bgcolor: 'rgba(239,68,68,0.08)', color: '#fca5a5',
                  border: '1px solid rgba(239,68,68,0.2)',
                  '& .MuiAlert-icon': { color: '#ef4444' },
                }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth label="Email Address" type="email" size="small"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required autoFocus sx={{ mb: 2.5 }}
                    InputProps={{
                      sx: {
                        bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                        '&:hover fieldset': { borderColor: `${selectedRole.color}40 !important` },
                        '&.Mui-focused fieldset': { borderColor: `${selectedRole.color} !important` },
                        '& input:-webkit-autofill': {
                          WebkitBoxShadow: '0 0 0 1000px rgba(15,25,45,0.85) inset !important',
                          WebkitTextFillColor: '#e2f4ff !important',
                          transition: 'background-color 5000s ease-in-out 0s',
                        }
                      }
                    }}
                    InputLabelProps={{ sx: { color: 'rgba(240,249,255,0.4)' } }}
                  />
                  <TextField
                    fullWidth label="Password" size="small"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required sx={{ mb: 3 }}
                    InputProps={{
                      sx: {
                        bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                        '&:hover fieldset': { borderColor: `${selectedRole.color}40 !important` },
                        '&.Mui-focused fieldset': { borderColor: `${selectedRole.color} !important` },
                        '& input:-webkit-autofill': {
                          WebkitBoxShadow: '0 0 0 1000px rgba(15,25,45,0.85) inset !important',
                          WebkitTextFillColor: '#e2f4ff !important',
                          transition: 'background-color 5000s ease-in-out 0s',
                        }
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPw(v => !v)} sx={{ color: 'rgba(240,249,255,0.4)' }}>
                            {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    InputLabelProps={{ sx: { color: 'rgba(240,249,255,0.4)' } }}
                  />
                  <Button
                    type="submit" fullWidth variant="contained" disabled={loading} size="large"
                    sx={{
                      background: `linear-gradient(135deg, ${selectedRole.color}, ${selectedRole.color}cc)`,
                      '&:hover': { 
                        background: `linear-gradient(135deg, ${selectedRole.color}dd, ${selectedRole.color})`,
                        boxShadow: `0 8px 24px ${selectedRole.glow}`,
                        transform: 'translateY(-1px)',
                      },
                      fontWeight: 700, py: 1.4, borderRadius: 2,
                      transition: 'all 0.3s ease',
                      textTransform: 'none', fontSize: 15,
                    }}
                  >
                    {loading ? <CircularProgress size={22} color="inherit" /> : `Sign In as ${selectedRole.label}`}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </Container>

      {/* Footer */}
      <Typography variant="caption" color="rgba(240,249,255,0.2)" mt={4} sx={{ zIndex: 1 }}>
        © {new Date().getFullYear()} NexLead Platform — Secure Enterprise Access
      </Typography>
    </Box>
  );
}
