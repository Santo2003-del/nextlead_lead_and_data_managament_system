import { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Skeleton, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, InputAdornment,
  useMediaQuery,
} from '@mui/material';
import {
  Search, FileDownload, ArrowBack, TravelExplore, Tag,
} from '@mui/icons-material';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const headSx = {
  bgcolor: '#0a1628', color: 'rgba(240,249,255,0.5)', fontWeight: 700,
  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
  borderBottom: '1px solid rgba(14,165,233,0.2)', whiteSpace: 'nowrap'
};
const cellSx = {
  borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#e2f4ff',
  py: 1.2, px: 1.5, fontSize: 13, whiteSpace: 'nowrap'
};

const StatCard = ({ title, value, color, loading }) => (
  <Card sx={{
    borderRadius: 2.5, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.1)',
    '&:hover': { boxShadow: `0 0 16px ${color}22` }, transition: 'box-shadow 0.2s'
  }}>
    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
      {loading
        ? <Skeleton width={80} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
        : <Typography variant="h4" fontWeight={700} color="#f0f9ff">{value}</Typography>
      }
      <Typography variant="body2" color="rgba(240,249,255,0.45)" mt={0.5}>{title}</Typography>
    </CardContent>
  </Card>
);

export default function KeywordIntelligencePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(25);

  // Detail view state
  const [detailKw, setDetailKw] = useState(null);
  const [detailLeads, setDetailLeads] = useState([]);
  const [detailTotal, setDetailTotal] = useState(0);
  const [detailPage, setDetailPage] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(null);

  const isMobile = useMediaQuery('(max-width:600px)');
  const { user, isManager } = useAuth(); // Import auth to get role
  const isAdmin = isManager || user?.role === 'super_admin';

  useEffect(() => {
    api.get('/analytics/keywords')
      .then(r => setData(r.data))
      .catch(e => toast.error('Failed to load keyword data'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = (data?.keywords || []).filter(k =>
    k.keyword?.toLowerCase().includes(search.toLowerCase())
  );

  const paged = filtered.slice(page * rpp, page * rpp + rpp);

  // Load detail leads for a keyword
  const openDetail = useCallback(async (keyword) => {
    setDetailKw(keyword);
    setDetailPage(0);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/analytics/keywords/${encodeURIComponent(keyword)}/leads?page=1&limit=50`);
      setDetailLeads(data.data);
      setDetailTotal(data.total);
    } catch { toast.error('Failed to load leads'); }
    finally { setDetailLoading(false); }
  }, []);

  const loadDetailPage = useCallback(async (pg) => {
    setDetailPage(pg);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/analytics/keywords/${encodeURIComponent(detailKw)}/leads?page=${pg + 1}&limit=50`);
      setDetailLeads(data.data);
      setDetailTotal(data.total);
    } catch { toast.error('Failed to load leads'); }
    finally { setDetailLoading(false); }
  }, [detailKw]);

  const handleExport = async (keyword, format = 'csv') => {
    setExporting(keyword);
    try {
      const response = await api.post(
        `/analytics/keywords/${encodeURIComponent(keyword)}/export`,
        { format },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `keyword_${keyword}_export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported "${keyword}" as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(null); }
  };

  // Detail view
  if (detailKw) {
    return (
      <Box sx={{ p: { xs: 1, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton onClick={() => setDetailKw(null)} sx={{ color: '#38bdf8' }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#f0f9ff">
              Keyword: <Chip label={detailKw} sx={{ bgcolor: 'rgba(14,165,233,0.15)', color: '#38bdf8', fontWeight: 700, height: 28, fontSize: 14 }} />
            </Typography>
            <Typography variant="body2" color="rgba(240,249,255,0.4)">
              {detailTotal} leads found
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          {isAdmin && (
            <Button variant="outlined" size="small" startIcon={<FileDownload />}
              onClick={() => handleExport(detailKw, 'csv')}
              disabled={exporting === detailKw}
              sx={{ borderColor: 'rgba(14,165,233,0.3)', color: '#38bdf8', mr: 1 }}>
              CSV
            </Button>
          )}
          {isAdmin && (
            <Button variant="outlined" size="small" startIcon={<FileDownload />}
              onClick={() => handleExport(detailKw, 'xlsx')}
              disabled={exporting === detailKw}
              sx={{ borderColor: 'rgba(139,92,246,0.3)', color: '#a78bfa' }}>
              Excel
            </Button>
          )}
        </Box>

        <Card sx={{ borderRadius: 2.5, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.1)' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Company', 'First Name', 'Last Name', 'Email', 'Job Title', 'Country', 'Score', 'Status', 'Added By'].map(h => (
                    <TableCell key={h} sx={headSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {detailLoading
                  ? [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={9}><Skeleton sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} /></TableCell></TableRow>
                  ))
                  : detailLeads.map(row => (
                    <TableRow key={row.id} sx={{ '&:hover': { bgcolor: 'rgba(14,165,233,0.04)' } }}>
                      <TableCell sx={cellSx}><Typography variant="body2" fontWeight={600} color="#f0f9ff">{row.company || '—'}</Typography></TableCell>
                      <TableCell sx={cellSx}>{row.first_name || '—'}</TableCell>
                      <TableCell sx={cellSx}>{row.last_name || '—'}</TableCell>
                      <TableCell sx={cellSx}>{row.email || '—'}</TableCell>
                      <TableCell sx={cellSx}><Typography variant="body2" color="#38bdf8">{row.job_title || '—'}</Typography></TableCell>
                      <TableCell sx={cellSx}>{row.country || '—'}</TableCell>
                      <TableCell sx={cellSx}>
                        <Chip label={row.lead_score || 0} size="small" sx={{
                          bgcolor: row.lead_score >= 80 ? 'rgba(16,185,129,0.12)' : row.lead_score >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                          color: row.lead_score >= 80 ? '#10b981' : row.lead_score >= 50 ? '#f59e0b' : '#ef4444',
                          fontWeight: 700, height: 20, fontSize: 11
                        }} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <Chip label={row.status} size="small" sx={{
                          bgcolor: 'rgba(14,165,233,0.1)', color: '#38bdf8', height: 18, fontSize: 10,
                          textTransform: 'capitalize'
                        }} />
                      </TableCell>
                      <TableCell sx={cellSx}>{row.added_by_name || 'System'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={detailTotal} page={detailPage} rowsPerPage={50}
            onPageChange={(_, p) => loadDetailPage(p)}
            rowsPerPageOptions={[50]}
            sx={{
              color: 'rgba(240,249,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)',
              '& .MuiIconButton-root': { color: 'rgba(240,249,255,0.4)' }
            }} />
        </Card>
      </Box>
    );
  }

  // Main keyword dashboard
  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="#f0f9ff"
          sx={{ fontFamily: 'Georgia, serif' }}>
          <TravelExplore sx={{ fontSize: 28, mr: 1, verticalAlign: 'text-bottom', color: '#0ea5e9' }} />
          Keyword Intelligence
        </Typography>
        <Typography variant="body2" color="rgba(240,249,255,0.4)">
          Deep analysis of lead generation by keyword — Admin & Manager access only
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={4}>
          <StatCard title="Total Keywords" value={data?.totalKeywords ?? '—'} color="#0ea5e9" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Top Keyword" value={data?.topKeyword ?? '—'} color="#8b5cf6" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Avg Leads / Keyword" value={data?.avgLeadsPerKeyword ?? '—'} color="#10b981" loading={loading} />
        </Grid>
      </Grid>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField fullWidth placeholder="Search keywords…" size="small" value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: 'rgba(240,249,255,0.3)' }} /></InputAdornment>
          }}
          sx={{
            maxWidth: 400,
            '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff', borderRadius: 2 },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(14,165,233,0.15)' },
          }} />
      </Box>

      {/* Keyword Cards Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(8)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`skel-${i}`}>
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.04)' }} />
            </Grid>
          ))}
        </Grid>
      ) : paged.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', bgcolor: '#0d1f3c', borderRadius: 3, border: '1px solid rgba(14,165,233,0.1)' }}>
          <Typography color="rgba(240,249,255,0.4)">
            {search ? 'No keywords match your search' : 'No keyword data available'}
          </Typography>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {paged.map((kw, idx) => {
              const i = page * rpp + idx; // Global index to check absolute #1 rank
              const isTop = i === 0 && !search; // Only highlight absolute top when not searching
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={kw.keyword}>
                  <Card sx={{
                    borderRadius: 3, bgcolor: '#0d1f3c',
                    border: isTop ? '1px solid #a78bfa' : '1px solid rgba(14,165,233,0.15)',
                    position: 'relative', overflow: 'hidden', cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: isTop ? '0 10px 25px rgba(139,92,246,0.2)' : '0 10px 25px rgba(14,165,233,0.15)',
                      borderColor: isTop ? '#c4b5fd' : '#38bdf8'
                    }
                  }} onClick={() => openDetail(kw.keyword)}>
                    {isTop && (
                      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }} />
                    )}
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          <Chip label={kw.keyword} size="small" icon={<Tag sx={{ fontSize: 13 }} />}
                            sx={{
                              bgcolor: isTop ? 'rgba(139,92,246,0.15)' : 'rgba(14,165,233,0.1)',
                              color: isTop ? '#c4b5fd' : '#38bdf8', fontWeight: 700, fontSize: 12, height: 26
                            }} />
                          {isTop && (
                            <Chip label="Top Keyword" size="small"
                              sx={{ bgcolor: 'rgba(236,72,153,0.15)', color: '#f472b6', fontSize: 10, height: 20, fontWeight: 800 }} />
                          )}
                        </Box>
                        {isAdmin && (
                          <Tooltip title="Export CSV">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleExport(kw.keyword, 'csv'); }}
                              disabled={exporting === kw.keyword}
                              sx={{ color: 'rgba(240,249,255,0.4)', '&:hover': { color: '#38bdf8', bgcolor: 'rgba(56,189,248,0.1)' } }}>
                              {exporting === kw.keyword ? <CircularProgress size={16} color="inherit" /> : <FileDownload sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 3 }}>
                        <Typography variant="h3" fontWeight={800} color="#f0f9ff" sx={{ lineHeight: 1 }}>
                          {kw.totalLeads?.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="rgba(240,249,255,0.4)" mb={0.5} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Records
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <Box>
                          <Typography variant="caption" color="rgba(240,249,255,0.4)" display="block" sx={{ mb: 0.2 }}>Last Activity</Typography>
                          <Typography variant="body2" color="#e2f4ff" fontWeight={500}>{kw.firstSeen ? new Date(kw.firstSeen).toLocaleDateString() : '—'}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" color="rgba(240,249,255,0.4)" display="block" sx={{ mb: 0.2 }}>Contributor</Typography>
                          <Typography variant="body2" color="#e2f4ff" fontWeight={500} sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>
                            {kw.topContributorName}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <TablePagination component="div" count={filtered.length} page={page} rowsPerPage={rpp}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={e => { setRpp(+e.target.value); setPage(0); }}
              rowsPerPageOptions={[12, 24, 48, 96]}
              sx={{
                color: 'rgba(240,249,255,0.5)', borderTop: 'none',
                '& .MuiIconButton-root': { color: 'rgba(240,249,255,0.4)', bgcolor: 'rgba(255,255,255,0.02)', mx: 0.5, borderRadius: 2 },
                '& .MuiSelect-icon': { color: 'rgba(240,249,255,0.4)' }
              }} />
          </Box>
        </>
      )}
    </Box>
  );
}
