import { useState, useEffect, useMemo } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Skeleton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, TextField, InputAdornment, TableSortLabel, TablePagination, Tooltip,
} from '@mui/material';
import {
  PeopleAlt, TrendingUp, CalendarToday, DateRange, Search
} from '@mui/icons-material';

import api from '../utils/api';
import { useAuth } from '../context/AuthContext';



const StatCard = ({ title, value, icon: Icon, color, loading }) => (
  <Card sx={{
    borderRadius: 2.5, height: '100%', bgcolor: '#0d1f3c',
    border: '1px solid rgba(14,165,233,0.1)',
    transition: 'box-shadow 0.2s',
    '&:hover': { boxShadow: `0 0 20px ${color}22` },
  }}>
    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2,
          bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon sx={{ color, fontSize: 22 }} />
        </Box>
      </Box>
      {loading
        ? <Skeleton width={80} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
        : <Typography variant="h4" fontWeight={700} color="#f0f9ff">{value?.toLocaleString?.() ?? value}</Typography>
      }
      <Typography variant="body2" color="rgba(240,249,255,0.45)" mt={0.5}>{title}</Typography>
    </CardContent>
  </Card>
);



const safeRender = (val, fallback = 'N/A') => {
  if (!val) return fallback;
  if (Array.isArray(val)) return val.length ? String(val[0]) : fallback;
  const str = String(val).trim();
  return str === '' || str.toLowerCase() === 'null' || str === '[]' ? fallback : str;
};

export default function GlobalInsightsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Performance Table State
  const [perfData, setPerfData] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [perfSearch, setPerfSearch] = useState('');
  const [perfSortBy, setPerfSortBy] = useState('date');
  const [perfSortOrder, setPerfSortOrder] = useState('desc');
  const [perfLoading, setPerfLoading] = useState(true);
  const [perfPage, setPerfPage] = useState(0);
  const [perfRowsPerPage, setPerfRowsPerPage] = useState(50);

  useEffect(() => {
    api.get('/analytics/global')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPerfLoading(true);
    // Fetch all user data globally grouped by the backend natively without pagination
    api.get('/analytics/performance')
      .then(r => setPerfData(r.data.data || []))
      .catch(console.error)
      .finally(() => setPerfLoading(false));
  }, []);

  const handleSort = (field) => {
    const isAsc = perfSortBy === field && perfSortOrder === 'asc';
    setPerfSortOrder(isAsc ? 'desc' : 'asc');
    setPerfSortBy(field);
  };

  const combinedTabs = useMemo(() => {
    if (loading || perfLoading) return [];
    
    // Create the "All Users" tab aggregate
    const allUsersTab = {
      userId: 'all',
      userName: 'All Users',
      totalLeads: data?.totalLeads || 0,
      leadsToday: data?.leadsToday || 0,
      leadsThisWeek: data?.leadsThisWeek || 0,
      leadsThisMonth: data?.leadsThisMonth || 0,
      rawActivity: [],
      leadsByKeyword: data?.leadsByKeyword || []
    };
    
    let allActivity = [];
    perfData.forEach(p => {
      if (p.rawActivity) {
        allActivity = allActivity.concat(p.rawActivity);
      }
    });
    // Sort allActivity by date desc
    allActivity.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    allUsersTab.rawActivity = allActivity;

    const userTabs = perfData.map(userObj => {
      // Calculate pieData for this specific user
      const kwCount = {};
      (userObj.rawActivity || []).forEach(act => {
        const kw = act.keyword || 'Unknown';
        kwCount[kw] = (kwCount[kw] || 0) + 1;
      });
      const leadsByKeyword = Object.entries(kwCount)
           .map(([k, v]) => ({ keyword: k, count: v }))
           .sort((a,b) => b.count - a.count);

      return {
        ...userObj,
        leadsByKeyword
      };
    });

    return [allUsersTab, ...userTabs];
  }, [data, perfData, loading, perfLoading]);

  const activeUser = combinedTabs[activeTab];
  let activeActivity = activeUser ? (activeUser.rawActivity || []) : [];

  if (perfSearch) {
    const s = perfSearch.toLowerCase();
    activeActivity = activeActivity.filter(k => 
      (k.keyword || '').toLowerCase().includes(s) ||
      (k.source || '').toLowerCase().includes(s)
    );
  }

  activeActivity = [...activeActivity].sort((a, b) => {
    let valA = a[perfSortBy];
    let valB = b[perfSortBy];
    if (perfSortBy === 'date') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
    }
    if (valA < valB) return perfSortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return perfSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedActivity = activeActivity.slice(perfPage * perfRowsPerPage, perfPage * perfRowsPerPage + perfRowsPerPage);



  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="#f0f9ff"
          sx={{ fontFamily: '"DM Sans", Georgia, serif' }}>
          Global Insights
        </Typography>
        <Typography variant="body2" color="rgba(240,249,255,0.4)">
          Real-time platform-wide lead generation analytics
        </Typography>
      </Box>

      {/* Global Summary Cards */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Leads" value={data?.totalLeads || 0} icon={PeopleAlt} color="#0ea5e9" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Added Today" value={data?.leadsToday || 0} icon={CalendarToday} color="#10b981" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="This Week" value={data?.leadsThisWeek || 0} icon={DateRange} color="#f59e0b" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="This Month" value={data?.leadsThisMonth || 0} icon={TrendingUp} color="#8b5cf6" loading={loading} />
        </Grid>
      </Grid>

      {/* User Leaderboard — always visible */}
      <Card sx={{ borderRadius: 2.5, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.1)', mb: 4 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff" mb={2}>
            User Leaderboard
          </Typography>
          <TableContainer sx={{ maxHeight: 350 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['#', 'User Name', 'Lead Count'].map(h => (
                    <TableCell key={h} sx={{
                      bgcolor: '#0a1628', color: 'rgba(240,249,255,0.5)', fontWeight: 700,
                      fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                      borderBottom: '1px solid rgba(14,165,233,0.2)', whiteSpace: 'nowrap'
                    }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading
                  ? [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={3}><Skeleton sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} /></TableCell>
                    </TableRow>
                  ))
                  : (data?.leadsByUser || []).map((u, i) => (
                    <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(14,165,233,0.04)' } }}>
                      <TableCell sx={{ color: '#0ea5e9', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {i + 1}
                      </TableCell>
                      <TableCell sx={{ color: '#e2f4ff', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{u.name}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <Chip label={u.count} size="small" sx={{
                          bgcolor: 'rgba(14,165,233,0.12)', color: '#38bdf8', fontWeight: 700,
                          height: 22, fontSize: 12
                        }} />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Lead Performance Breakdown — full section in one card */}
      <Card sx={{ borderRadius: 2.5, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.1)' }}>
        <CardContent>
          {/* Section Header + Search */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight={700} color="#f0f9ff">
              Lead Performance Breakdown
            </Typography>
            <TextField
              size="small"
              placeholder="Search keyword..."
              value={perfSearch}
              onChange={(e) => setPerfSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'rgba(240,249,255,0.3)', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: { xs: '100%', sm: 250 },
                '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.03)', color: '#f0f9ff', borderRadius: 2 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(14,165,233,0.15)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(14,165,233,0.3)' }
              }}
            />
          </Box>

          {/* User Tabs */}
          {!perfLoading && combinedTabs.length > 0 && (
            <Tabs 
              value={activeTab} 
              onChange={(e, val) => { setActiveTab(val); setPerfPage(0); }} 
              variant="scrollable" 
              scrollButtons="auto"
              sx={{ 
                mb: 3,
                borderBottom: '1px solid rgba(14,165,233,0.1)',
                '& .MuiTab-root': { color: 'rgba(240,249,255,0.5)', fontWeight: 600, minWidth: 120, textTransform: 'none', fontSize: 13 },
                '& .Mui-selected': { color: '#0ea5e9 !important' },
                '& .MuiTabs-indicator': { backgroundColor: '#0ea5e9', height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 }
              }}
            >
              {combinedTabs.map((userObj, idx) => (
                <Tab key={userObj.userId || idx} label={userObj.userName} />
              ))}
            </Tabs>
          )}

          {/* Per-user Stat Cards */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} sm={3}>
              <StatCard title="Leads Today" value={activeUser?.leadsToday || 0} icon={CalendarToday} color="#10b981" loading={perfLoading} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard title="This Week" value={activeUser?.leadsThisWeek || 0} icon={DateRange} color="#f59e0b" loading={perfLoading} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard title="This Month" value={activeUser?.leadsThisMonth || 0} icon={TrendingUp} color="#8b5cf6" loading={perfLoading} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard title="Total Leads" value={activeUser?.totalLeads || 0} icon={PeopleAlt} color="#0ea5e9" loading={perfLoading} />
            </Grid>
          </Grid>

          {/* Activity Table */}
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {[
                    { id: 'date', label: 'Date' },
                    { id: 'keyword', label: 'Keyword' },
                    { id: 'source', label: 'Source' },
                    { id: 'importedBy', label: 'Imported By' }
                  ].map((h) => (
                    <TableCell key={h.id} sx={{
                      bgcolor: '#0a1628', color: 'rgba(240,249,255,0.5)', fontWeight: 700,
                      fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                      borderBottom: '1px solid rgba(14,165,233,0.2)', whiteSpace: 'nowrap'
                    }}>
                      <TableSortLabel
                        active={perfSortBy === h.id}
                        direction={perfSortBy === h.id ? perfSortOrder : 'asc'}
                        onClick={() => handleSort(h.id)}
                        sx={{
                          color: 'inherit !important',
                          '& .MuiTableSortLabel-icon': { color: 'rgba(14,165,233,0.7) !important' }
                        }}
                      >
                        {h.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {perfLoading ? (
                  [...Array(10)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}><Skeleton sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} /></TableCell>
                    </TableRow>
                  ))
                ) : !activeUser || activeActivity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 6, color: 'rgba(240,249,255,0.3)', borderBottom: 'none' }}>
                      No lead activity available
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedActivity.map((row, i) => (
                    <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(14,165,233,0.04)' } }}>
                      <TableCell sx={{ color: '#e2f4ff', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>
                        {row.date ? new Date(row.date).toLocaleDateString('en-GB').replace(/\//g, '-') : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                        <Tooltip title={safeRender(row.keyword, 'N/A')} placement="top" arrow>
                          <Typography variant="body2" color="#38bdf8" noWrap>{safeRender(row.keyword, 'N/A')}</Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                        <Tooltip title={safeRender(row.source, 'Imported')} placement="top" arrow>
                          <Typography variant="body2" color="rgba(240,249,255,0.7)" noWrap>{safeRender(row.source, 'Imported')}</Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                        <Tooltip title={safeRender(row.importedBy, 'N/A')} placement="top" arrow>
                          <Typography variant="body2" color="rgba(240,249,255,0.7)" noWrap>{safeRender(row.importedBy, 'N/A')}</Typography>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={activeActivity.length}
            page={perfPage}
            onPageChange={(_, newPage) => setPerfPage(newPage)}
            rowsPerPage={perfRowsPerPage}
            onRowsPerPageChange={(e) => {
              setPerfRowsPerPage(parseInt(e.target.value, 10));
              setPerfPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100, 250]}
            sx={{
              color: 'rgba(240,249,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.05)',
              '& .MuiIconButton-root': { color: 'rgba(240,249,255,0.4)' },
              '& .MuiSelect-icon': { color: 'rgba(240,249,255,0.4)' },
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

