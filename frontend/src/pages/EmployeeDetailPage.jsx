import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  CircularProgress, Skeleton, TextField, Pagination, IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack, PeopleAlt, StorageOutlined, LabelOutlined,
  CalendarMonthOutlined, FilterAlt,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../utils/api';
import toast from 'react-hot-toast';

const cardSx = {
  borderRadius: 2.5, bgcolor: '#0d1f3c',
  border: '1px solid rgba(14,165,233,0.1)', height: '100%',
};
const cellSx = { borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#e2f4ff', py: 1.2, px: 2 };
const headSx = {
  ...cellSx, bgcolor: '#0a1628', color: 'rgba(240,249,255,0.4)', fontWeight: 700,
  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
};

const StatCard = ({ title, value, icon: Icon, color, loading }) => (
  <Card sx={{
    ...cardSx,
    transition: 'box-shadow 0.2s, transform 0.2s',
    '&:hover': { boxShadow: `0 0 20px ${color}18`, transform: 'translateY(-2px)' },
  }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: 2,
          bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon sx={{ color, fontSize: 24 }} />
        </Box>
        <Box>
          {loading
            ? <Skeleton width={60} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            : <Typography variant="h4" fontWeight={700} color="#f0f9ff">{value?.toLocaleString?.() ?? value}</Typography>
          }
          <Typography variant="body2" color="rgba(240,249,255,0.45)">{title}</Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const formatDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return '—'; }
};

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [stats, setStats] = useState(null);
  const [keywordStats, setKeywordStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leads table state
  const [leads, setLeads] = useState([]);
  const [leadsMeta, setLeadsMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [leadsLoading, setLeadsLoading] = useState(true);

  // Imports table state
  const [imports, setImports] = useState([]);
  const [importsMeta, setImportsMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [importsLoading, setImportsLoading] = useState(true);

  // Date filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Load employee profile
  useEffect(() => {
    setLoading(true);
    api.get(`/admin/employee/${id}`)
      .then(r => {
        setEmployee(r.data.employee);
        setStats(r.data.stats);
        setKeywordStats(r.data.keywordStats || []);
      })
      .catch(err => {
        toast.error('Failed to load employee details');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Load leads
  const loadLeads = useCallback((page = 1) => {
    setLeadsLoading(true);
    const params = { page, limit: 10 };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    api.get(`/admin/employee/${id}/leads`, { params })
      .then(r => {
        setLeads(r.data.data);
        setLeadsMeta({ total: r.data.total, page: r.data.page, pages: r.data.pages });
      })
      .catch(console.error)
      .finally(() => setLeadsLoading(false));
  }, [id, startDate, endDate]);

  // Load imports
  const loadImports = useCallback((page = 1) => {
    setImportsLoading(true);
    const params = { page, limit: 10 };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    api.get(`/admin/employee/${id}/imports`, { params })
      .then(r => {
        setImports(r.data.data);
        setImportsMeta({ total: r.data.total, page: r.data.page, pages: r.data.pages });
      })
      .catch(console.error)
      .finally(() => setImportsLoading(false));
  }, [id, startDate, endDate]);

  useEffect(() => { loadLeads(); }, [loadLeads]);
  useEffect(() => { loadImports(); }, [loadImports]);

  const applyFilter = () => { loadLeads(1); loadImports(1); };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const roleColor = (role) => {
    switch (role) {
      case 'admin': return { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'rgba(239,68,68,0.3)' };
      case 'manager': return { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: 'rgba(139,92,246,0.3)' };
      default: return { bg: 'rgba(14,165,233,0.15)', color: '#38bdf8', border: 'rgba(14,165,233,0.3)' };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: '#0ea5e9' }} />
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h6" color="rgba(240,249,255,0.5)">Employee not found</Typography>
        <Button onClick={() => nav('/team')} sx={{ mt: 2, color: '#38bdf8' }}>Back to Team</Button>
      </Box>
    );
  }

  const rc = roleColor(employee.role);
  const topKeywords = keywordStats.slice(0, 15);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => nav('/team')}
          sx={{ color: 'rgba(240,249,255,0.5)', bgcolor: 'rgba(255,255,255,0.04)', '&:hover': { bgcolor: 'rgba(14,165,233,0.1)' } }}>
          <ArrowBack />
        </IconButton>
        <Avatar sx={{ width: 52, height: 52, bgcolor: '#0369a1', fontSize: 20, fontWeight: 700 }}>
          {employee.name?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" fontWeight={800} color="#f0f9ff" sx={{ fontFamily: 'Georgia, serif' }}>
              {employee.name}
            </Typography>
            <Chip label={employee.role} size="small"
              sx={{ bgcolor: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, fontSize: 11, height: 22 }} />
            <Chip label={employee.is_active ? 'Active' : 'Inactive'} size="small"
              sx={{
                bgcolor: employee.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                color: employee.is_active ? '#10b981' : '#9ca3af', fontSize: 11, height: 22,
              }} />
          </Box>
          <Typography variant="body2" color="rgba(240,249,255,0.4)">{employee.email}</Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <StatCard title="Total Leads Added" value={stats?.totalLeads} icon={PeopleAlt} color="#0ea5e9" loading={!stats} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Total Data Imported" value={stats?.totalImports} icon={StorageOutlined} color="#8b5cf6" loading={!stats} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Total Keywords" value={stats?.totalKeywords} icon={LabelOutlined} color="#f59e0b" loading={!stats} />
        </Grid>
      </Grid>

      {/* Date Filter */}
      <Card sx={{ ...cardSx, mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FilterAlt sx={{ color: 'rgba(240,249,255,0.4)' }} />
            <Typography variant="subtitle2" color="rgba(240,249,255,0.5)" sx={{ mr: 1 }}>
              Date Range Filter
            </Typography>
            <TextField type="date" size="small" label="Start Date" value={startDate}
              onChange={e => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }}
              sx={{
                width: 170,
                '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff' },
                '& .MuiInputLabel-root': { color: 'rgba(240,249,255,0.4)' },
                '& .MuiSvgIcon-root': { color: 'rgba(240,249,255,0.4)' },
              }} />
            <TextField type="date" size="small" label="End Date" value={endDate}
              onChange={e => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }}
              sx={{
                width: 170,
                '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff' },
                '& .MuiInputLabel-root': { color: 'rgba(240,249,255,0.4)' },
                '& .MuiSvgIcon-root': { color: 'rgba(240,249,255,0.4)' },
              }} />
            <Button size="small" variant="contained" onClick={applyFilter}
              sx={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 600 }}>
              Apply
            </Button>
            {(startDate || endDate) && (
              <Button size="small" onClick={clearFilter} sx={{ color: 'rgba(240,249,255,0.5)' }}>
                Clear
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card sx={{ ...cardSx, mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff">
              Leads Added ({leadsMeta.total})
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Keyword', 'Lead Name', 'Email', 'Company', 'Date Added'].map(h => (
                    <TableCell key={h} sx={headSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {leadsLoading
                  ? [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((_, j) => (
                        <TableCell key={j} sx={cellSx}>
                          <Skeleton sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                  : leads.length === 0
                    ? <TableRow><TableCell colSpan={5} sx={{ ...cellSx, textAlign: 'center', color: 'rgba(240,249,255,0.3)' }}>
                      No leads found
                    </TableCell></TableRow>
                    : leads.map(l => (
                      <TableRow key={l.id} sx={{ '&:hover': { bgcolor: 'rgba(14,165,233,0.04)' } }}>
                        <TableCell sx={cellSx}>
                          <Chip label={l.keyword || '—'} size="small"
                            sx={{ bgcolor: 'rgba(14,165,233,0.1)', color: '#38bdf8', fontSize: 10, height: 20 }} />
                        </TableCell>
                        <TableCell sx={cellSx}>{l.leadName || '—'}</TableCell>
                        <TableCell sx={{ ...cellSx, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {l.email || '—'}
                        </TableCell>
                        <TableCell sx={cellSx}>{l.company || '—'}</TableCell>
                        <TableCell sx={cellSx}>{formatDate(l.dateAdded)}</TableCell>
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
          </TableContainer>
          {leadsMeta.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination count={leadsMeta.pages} page={leadsMeta.page}
                onChange={(_, p) => loadLeads(p)}
                sx={{
                  '& .MuiPaginationItem-root': { color: 'rgba(240,249,255,0.5)' },
                  '& .Mui-selected': { bgcolor: 'rgba(14,165,233,0.2) !important', color: '#38bdf8' },
                }} />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Imports Table */}
      <Card sx={{ ...cardSx, mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff">
              Import History ({importsMeta.total})
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['File Name', 'Source', 'Total Rows', 'Valid Rows', 'Date'].map(h => (
                    <TableCell key={h} sx={headSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {importsLoading
                  ? [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((_, j) => (
                        <TableCell key={j} sx={cellSx}>
                          <Skeleton sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                  : imports.length === 0
                    ? <TableRow><TableCell colSpan={5} sx={{ ...cellSx, textAlign: 'center', color: 'rgba(240,249,255,0.3)' }}>
                      No import records found
                    </TableCell></TableRow>
                    : imports.map(imp => (
                      <TableRow key={imp.id} sx={{ '&:hover': { bgcolor: 'rgba(14,165,233,0.04)' } }}>
                        <TableCell sx={{ ...cellSx, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {imp.keyword || '—'}
                        </TableCell>
                        <TableCell sx={cellSx}>
                          <Chip label={imp.source} size="small"
                            sx={{ bgcolor: 'rgba(139,92,246,0.1)', color: '#a78bfa', fontSize: 10, height: 20 }} />
                        </TableCell>
                        <TableCell sx={cellSx}>{imp.totalRows?.toLocaleString()}</TableCell>
                        <TableCell sx={cellSx}>
                          <Typography variant="body2" color="#10b981" fontWeight={600}>
                            {imp.validRows?.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell sx={cellSx}>{formatDate(imp.date)}</TableCell>
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
          </TableContainer>
          {importsMeta.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination count={importsMeta.pages} page={importsMeta.page}
                onChange={(_, p) => loadImports(p)}
                sx={{
                  '& .MuiPaginationItem-root': { color: 'rgba(240,249,255,0.5)' },
                  '& .Mui-selected': { bgcolor: 'rgba(14,165,233,0.2) !important', color: '#38bdf8' },
                }} />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Keyword Analytics */}
      <Card sx={cardSx}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} color="#f0f9ff" mb={2}>
            Keyword Analytics ({keywordStats.length} Keywords)
          </Typography>
          {topKeywords.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topKeywords} margin={{ left: -10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="keyword" tick={{ fill: 'rgba(240,249,255,0.4)', fontSize: 10 }}
                    angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill: 'rgba(240,249,255,0.4)', fontSize: 10 }} />
                  <RTooltip
                    contentStyle={{ background: '#0a1628', border: '1px solid rgba(14,165,233,0.2)', color: '#f0f9ff', borderRadius: 8 }}
                    cursor={{ fill: 'rgba(14,165,233,0.05)' }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
              {/* Keyword list */}
              <Box sx={{ mt: 3, maxHeight: 300, overflow: 'auto' }}>
                <Grid container spacing={1}>
                  {keywordStats.map((kw, i) => (
                    <Grid item xs={12} sm={6} md={4} key={i}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        px: 1.5, py: 0.8, borderRadius: 1.5,
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        '&:hover': { bgcolor: 'rgba(14,165,233,0.04)' },
                      }}>
                        <Typography variant="caption" color="rgba(240,249,255,0.6)" noWrap sx={{ flex: 1, mr: 1 }}>
                          {kw.keyword}
                        </Typography>
                        <Chip label={kw.count} size="small"
                          sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: 10, height: 18, minWidth: 30 }} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </>
          ) : (
            <Typography variant="body2" color="rgba(240,249,255,0.3)" textAlign="center" py={4}>
              No keyword data available for this employee.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
