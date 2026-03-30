import { useState, useEffect, useMemo } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip, Button,
  List, ListItem, ListItemAvatar, ListItemText, Skeleton, LinearProgress,
  Tabs, Tab, TablePagination,
} from '@mui/material';
import {
  PeopleAlt, TrendingUp, AutoAwesome, Group,
  AddCircleOutline, EditOutlined, DeleteOutline, FileDownload,
  LoginOutlined, CloudUploadOutlined, MyLocation,
  StorageOutlined, CalendarMonthOutlined,
} from '@mui/icons-material';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Area, AreaChart,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

const StatCard = ({ title, value, sub, icon: Icon, color, loading, trend }) => (
  <Card sx={{
    borderRadius: 2.5, height: '100%',
    bgcolor: '#0d1f3c',
    border: '1px solid rgba(14,165,233,0.1)',
    transition: 'box-shadow 0.2s, transform 0.2s',
    '&:hover': { boxShadow: '0 0 20px rgba(14,165,233,0.1)', transform: 'translateY(-2px)' },
  }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2,
          bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon sx={{ color, fontSize: 22 }} />
        </Box>
        {trend !== undefined && (
          <Chip label={`+${trend}%`} size="small"
            sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 11 }} />
        )}
      </Box>
      {loading
        ? <Skeleton width={80} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
        : <Typography variant="h4" fontWeight={700} color="#f0f9ff">{value?.toLocaleString?.() ?? value}</Typography>
      }
      <Typography variant="body2" color="rgba(240,249,255,0.45)" mt={0.5}>{title}</Typography>
      {sub && <Typography variant="caption" color="rgba(240,249,255,0.3)">{sub}</Typography>}
    </CardContent>
  </Card>
);

const ACTION_ICON = {
  create: <AddCircleOutline fontSize="small" />, update: <EditOutlined fontSize="small" />,
  delete: <DeleteOutline fontSize="small" />, export: <FileDownload fontSize="small" />,
  login: <LoginOutlined fontSize="small" />, logout: <LoginOutlined sx={{ transform: 'rotate(180deg)' }} fontSize="small" />, 
  import: <CloudUploadOutlined fontSize="small" />,
};
const ACTION_COLOR = {
  create: '#10b981', update: '#f59e0b', delete: '#ef4444',
  export: '#0ea5e9', login: '#8b5cf6', logout: '#f43f5e', import: '#3b82f6',
};

const chartCardSx = {
  borderRadius: 2.5, bgcolor: '#0d1f3c',
  border: '1px solid rgba(14,165,233,0.1)', height: '100%',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: '#0a1628', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 1.5, px: 1.5, py: 1 }}>
      <Typography variant="caption" color="rgba(240,249,255,0.6)">{label}</Typography>
      {payload.map((p, i) => (
        <Typography key={i} variant="body2" fontWeight={700} color={p.color || '#0ea5e9'}>
          {p.name}: {p.value?.toLocaleString()}
        </Typography>
      ))}
    </Box>
  );
};

export default function DashboardPage() {
  const { user, isAdmin, isManager } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [loading, setL] = useState(true);
  const [dashLoading, setDL] = useState(true);

  // New states for paginated tabbed activity
  const [actTab, setActTab] = useState(0);
  const [actPage, setActPage] = useState(0);
  const [actRpp, setActRpp] = useState(10);
  const [actData, setActData] = useState([]);
  const [actTotal, setActTotal] = useState(0);
  const [actLoading, setActL] = useState(true);
  const actTypes = ['', 'logins', 'logouts'];

  const isLimitedRole = ['employee', 'marketing'].includes(user?.role);

  useEffect(() => {
    let mounted = true;
    const loadData = () => {
      api.get('/leads/stats').then(r => { if (mounted) setStats(r.data); }).catch(console.error);
      api.get('/analytics/dashboard').then(r => { if (mounted) setDashData(r.data); }).catch(console.error).finally(() => { if (mounted && dashLoading) setDL(false); setL(false); });
    };

    loadData();
    const interval = setInterval(loadData, 10000); // Poll every 10s seamlessly
    return () => { mounted = false; clearInterval(interval); };
  }, [dashLoading]);

  // Separate effect for Activity to support pagination and tabs
  useEffect(() => {
    let mounted = true;
    const loadAct = async () => {
      setActL(true);
      try {
        const action = actTypes[actTab];
        const res = await api.get('/leads/activity', { 
          params: { page: actPage + 1, limit: actRpp, action } 
        });
        if (mounted) {
          setActData(res.data.logs || []);
          setActTotal(res.data.total || 0);
        }
      } catch (e) {
        console.error('Activity load error:', e);
      } finally {
        if (mounted) setActL(false);
      }
    };
    loadAct();
    const intv = setInterval(loadAct, 15000);
    return () => { mounted = false; clearInterval(intv); };
  }, [actTab, actPage, actRpp]);

  const scoreData = useMemo(() => {
    if (!stats?.byScore) return [];
    return [
      { name: 'Hot (80+)', value: parseInt(stats.byScore.hot || 0), color: '#10b981' },
      { name: 'Warm (50-79)', value: parseInt(stats.byScore.warm || 0), color: '#f59e0b' },
      { name: 'Cold (<50)', value: parseInt(stats.byScore.cold || 0), color: '#ef4444' },
    ];
  }, [stats]);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="#f0f9ff"
          sx={{ fontFamily: 'Georgia, serif' }}>
          {user?.role === 'super_admin' ? 'Super Admin Dashboard' : isAdmin ? 'Intelligence Dashboard' : `Welcome, ${user?.name}`}
        </Typography>
        <Typography variant="body2" color="rgba(240,249,255,0.4)">
          {user?.role === 'super_admin' ? 'Complete system overview and master platform control' : isAdmin ? 'Real-time view of your lead pipeline & team performance' : 'Your personal productivity and pipeline activity'}
        </Typography>
      </Box>

      {/* Quick Actions (Role-Based) */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" color="rgba(240,249,255,0.4)" mb={1.5} sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {(isManager || isLimitedRole) && (
            <Grid item xs={6} sm={3}>
              <Button fullWidth variant="outlined" startIcon={<CloudUploadOutlined />} onClick={() => nav('/scraper')}
                sx={{ borderColor: 'rgba(14,165,233,0.2)', color: '#38bdf8', bgcolor: 'rgba(14,165,233,0.05)', py: 1.5 }}>
                Import Leads
              </Button>
            </Grid>
          )}
          <Grid item xs={6} sm={3}>
            <Button fullWidth variant="outlined" startIcon={<PeopleAlt />} onClick={() => nav('/leads')}
              sx={{ borderColor: 'rgba(14,165,233,0.2)', color: '#38bdf8', bgcolor: 'rgba(14,165,233,0.05)', py: 1.5 }}>
              Lead Explorer
            </Button>
          </Grid>
          {isAdmin && (
            <Grid item xs={6} sm={3}>
              <Button fullWidth variant="outlined" startIcon={<Group />} onClick={() => nav('/team')}
                sx={{ borderColor: 'rgba(139,92,246,0.2)', color: '#a78bfa', bgcolor: 'rgba(139,92,246,0.05)', py: 1.5 }}>
                Manage Team
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Data Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isLimitedRole ? 'My Leads' : 'Total Leads'}
            value={dashLoading ? '—' : dashData?.totalLeads}
            sub={isLimitedRole ? 'Your records' : 'All-time records'}
            icon={PeopleAlt} color="#0ea5e9" loading={dashLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isLimitedRole ? 'My Imports' : 'Total Imported Data'}
            value={dashLoading ? '—' : dashData?.totalImports}
            sub="Import batches"
            icon={StorageOutlined} color="#8b5cf6" loading={dashLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isLimitedRole ? 'My Leads This Month' : 'Leads This Month'}
            value={dashLoading ? '—' : dashData?.leadsThisMonth}
            sub="Current month"
            icon={CalendarMonthOutlined} color="#10b981" loading={dashLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isLimitedRole ? 'My Imports This Month' : 'Imports This Month'}
            value={dashLoading ? '—' : dashData?.importsThisMonth}
            sub="Current month"
            icon={CloudUploadOutlined} color="#f59e0b" loading={dashLoading}
          />
        </Grid>
      </Grid>

      {/* Monthly Leads & Imports Graphs */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card sx={chartCardSx}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff" mb={2}>
                Monthly Leads
              </Typography>
              {dashLoading
                ? <Skeleton variant="rectangular" height={240} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={dashData?.monthlyLeads || []} margin={{ left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="label" tick={{ fill: 'rgba(240,249,255,0.4)', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'rgba(240,249,255,0.4)', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2}
                        fill="url(#leadGrad)" name="Leads" dot={{ r: 3, fill: '#0ea5e9' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={chartCardSx}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff" mb={2}>
                Monthly Imports
              </Typography>
              {dashLoading
                ? <Skeleton variant="rectangular" height={240} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={dashData?.monthlyImports || []} margin={{ left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="label" tick={{ fill: 'rgba(240,249,255,0.4)', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'rgba(240,249,255,0.4)', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Imports" />
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Existing charts row */}
      <Grid container spacing={3} mb={3}>
        {/* Industry chart */}
        <Grid item xs={12} md={isAdmin ? 4 : 6}>
          <Card sx={chartCardSx}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff" mb={3}>
                {isLimitedRole ? 'My Industry Focus' : 'Market Focus (Industry)'}
              </Typography>
              {loading
                ? <Skeleton variant="rectangular" height={220} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats?.topIndustries || []} margin={{ left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="industry" tick={{ fill: 'rgba(240,249,255,0.4)', fontSize: 10 }}
                        angle={-35} textAnchor="end" />
                      <YAxis tick={{ fill: 'rgba(240,249,255,0.4)', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="cnt" fill="#0ea5e9" radius={[3, 3, 0, 0]} name="Leads" />
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>
        </Grid>

        {/* Score distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={chartCardSx}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff" mb={2}>
                Lead Health (Scores)
              </Typography>
              {loading
                ? <Skeleton variant="rectangular" height={220} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                : (
                  <Box>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={scoreData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                          dataKey="value" paddingAngle={3}>
                          {scoreData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ bgcolor: '#0a1628', border: '1px solid rgba(14,165,233,0.2)', color: '#f0f9ff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    {scoreData.map(s => (
                      <Box key={s.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                          <Typography variant="caption" color="rgba(240,249,255,0.6)">{s.name}</Typography>
                        </Box>
                        <Typography variant="caption" fontWeight={700} color="#f0f9ff">{s.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                )
              }
            </CardContent>
          </Card>
        </Grid>

        {/* Top employees (Admin only) */}
        {isAdmin && (
          <Grid item xs={12} md={4}>
            <Card sx={chartCardSx}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff" mb={2}>
                  Top Performers
                </Typography>
                {loading
                  ? [...Array(4)].map((_, i) => <Skeleton key={i} height={44} sx={{ bgcolor: 'rgba(255,255,255,0.04)', mb: 0.5 }} />)
                  : (stats?.topEmployees || []).map((emp, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#0369a1', fontSize: 12, fontWeight: 700 }}>
                        {emp.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                          <Typography variant="body2" fontWeight={500} color="#f0f9ff">{emp.name}</Typography>
                          <Typography variant="caption" color="#0ea5e9" fontWeight={700}>
                            {emp.leads_added} leads
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate"
                          value={Math.min(100, (emp.leads_added / (stats.topEmployees[0]?.leads_added || 1)) * 100)}
                          sx={{
                            height: 3, borderRadius: 2,
                            bgcolor: 'rgba(14,165,233,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#0ea5e9' }
                          }} />
                      </Box>
                    </Box>
                  ))
                }
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Recent activity */}
      <Card sx={{ borderRadius: 2.5, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.1)' }}>
        <CardContent sx={{ pb: '0 !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff">
              {isAdmin ? 'System-wide Activity' : 'My Recent Activity'}
            </Typography>
            <Tabs value={actTab} onChange={(e, v) => { setActTab(v); setActPage(0); }} 
              sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32, py: 0.5, px: 2, color: 'rgba(240,249,255,0.5)', fontSize: 13, textTransform: 'capitalize' }, '& .Mui-selected': { color: '#0ea5e9 !important', fontWeight: 700 } }}>
              <Tab label="All" />
              <Tab label="Logins" />
              <Tab label="Logouts" />
            </Tabs>
          </Box>
          <List dense disablePadding>
            {actLoading
              ? [...Array(5)].map((_, i) => <Skeleton key={i} height={44} sx={{ bgcolor: 'rgba(255,255,255,0.04)', mb: 0.5 }} />)
              : actData.map((a, i) => (
                <ListItem key={i} disablePadding sx={{ py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar sx={{ width: 30, height: 30, bgcolor: `${ACTION_COLOR[a.action] || '#94a3b8'}18` }}>
                      <Box sx={{ color: ACTION_COLOR[a.action] || '#94a3b8', display: 'flex' }}>
                        {ACTION_ICON[a.action] || <AutoAwesome fontSize="small" />}
                      </Box>
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={500} color="#f0f9ff">
                          {a.user_name || 'System'}
                        </Typography>
                        <Chip label={a.action} size="small"
                          sx={{
                            height: 17, fontSize: 10,
                            bgcolor: `${ACTION_COLOR[a.action] || '#94a3b8'}18`,
                            color: ACTION_COLOR[a.action] || '#94a3b8'
                          }} />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="rgba(240,249,255,0.35)">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            }
            {!actLoading && actData?.length === 0 && (
              <Typography variant="body2" color="rgba(240,249,255,0.3)" p={4} textAlign="center">
                No activity found for this view.
              </Typography>
            )}
          </List>
          
          <TablePagination
            component="div"
            count={actTotal}
            page={actPage}
            onPageChange={(e, newPage) => setActPage(newPage)}
            rowsPerPage={actRpp}
            onRowsPerPageChange={(e) => { setActRpp(parseInt(e.target.value, 10)); setActPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              color: 'rgba(240,249,255,0.5)',
              borderTop: 'none',
              '& .MuiTablePagination-toolbar': { minHeight: 40, px: 0 },
              '& .MuiIconButton-root': { color: 'rgba(240,249,255,0.5)' },
              '& .MuiTablePagination-selectIcon': { color: 'rgba(240,249,255,0.5)' }
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
