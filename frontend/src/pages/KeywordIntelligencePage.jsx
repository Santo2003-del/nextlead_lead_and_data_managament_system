import { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Skeleton, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, InputAdornment,
  useMediaQuery,
} from '@mui/material';
import {
  Search, FileDownload, ArrowBack, TravelExplore, Tag, Delete, Visibility
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteKeyword = async () => {
    if (!detailKw) return;
    setDeleting(true);
    const tid = toast.loading(`Deleting all records for keyword "${detailKw}"...`);
    try {
      await api.delete(`/analytics/keywords/${encodeURIComponent(detailKw)}`);
      toast.success(`Successfully deleted keyword "${detailKw}"`, { id: tid });
      setDeleteConfirmOpen(false);
      setDetailKw(null);
      // Reload main dashboard
      const r = await api.get('/analytics/keywords');
      setData(r.data);
    } catch (err) {
      toast.error('Failed to delete keyword', { id: tid });
    } finally {
      setDeleting(false);
    }
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
            <Button variant="outlined" size="small" startIcon={<Delete />}
              onClick={() => setDeleteConfirmOpen(true)}
              sx={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444', mr: 1 }}>
              Delete Keyword
            </Button>
          )}
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
                  {['Imported Date', 'Imported By', 'Keyword', 'First Name', 'Last Name', 'Email', 'Job Title', 'Country', 'Company Name', 'LinkedIn', 'Industry', 'Source'].map(h => (
                    <TableCell key={h} sx={headSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {detailLoading
                  ? [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={13}><Skeleton sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} /></TableCell></TableRow>
                  ))
                  : detailLeads.map(row => (
                    <TableRow key={row.id} sx={{ '&:hover': { bgcolor: 'rgba(14,165,233,0.04)' } }}>
                      <TableCell sx={cellSx}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</TableCell>
                      <TableCell sx={cellSx}>{row.uploadedByName || '—'}</TableCell>
                      <TableCell sx={cellSx}>{row.keyword || '—'}</TableCell>
                      <TableCell sx={cellSx}>{row.first_name || '—'}</TableCell>
                      <TableCell sx={cellSx}>{row.last_name || '—'}</TableCell>
                      <TableCell sx={cellSx}>{row.email || '—'}</TableCell>
                      <TableCell sx={cellSx}>{row.job_title || '—'}</TableCell>
                      <TableCell sx={cellSx}>{row.country || '—'}</TableCell>
                      <TableCell sx={cellSx}><Typography variant="body2" fontWeight={600} color="#f0f9ff">{row.company_name || '—'}</Typography></TableCell>
                      <TableCell sx={cellSx}>{row.linkedin ? <a href={row.linkedin} style={{color: '#38bdf8'}} target="_blank" rel="noopener noreferrer">View</a> : '—'}</TableCell>
                      <TableCell sx={cellSx}>{row.industry || '—'}</TableCell>
                      <TableCell sx={cellSx}>{row.source || '—'}</TableCell>
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

        {/* Delete Confirm */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}
          PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(239,68,68,0.2)' } }}>
          <DialogTitle sx={{ color: '#fca5a5', fontWeight: 700 }}>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="rgba(240,249,255,0.7)">
              Are you sure you want to permanently delete ALL records associated with the keyword <strong>"{detailKw}"</strong>? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: 'rgba(240,249,255,0.5)' }}>Cancel</Button>
            <Button color="error" variant="contained" disabled={deleting} onClick={handleDeleteKeyword}>
              {deleting ? <CircularProgress size={18} color="inherit" /> : 'Yes, Delete All'}
            </Button>
          </DialogActions>
        </Dialog>
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

      {/* Keyword Table Layout */}
      {loading ? (
        <Card sx={{ borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.1)', overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Keyword', 'Total Records', 'Imported Date', 'Imported By', 'Actions'].map(h => (
                    <TableCell key={h} sx={headSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(8)].map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                     <TableCell colSpan={5}><Skeleton sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} height={40}/></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : paged.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', bgcolor: '#0d1f3c', borderRadius: 3, border: '1px solid rgba(14,165,233,0.1)' }}>
          <Typography color="rgba(240,249,255,0.4)">
            {search ? 'No keywords match your search' : 'No keyword data available'}
          </Typography>
        </Card>
      ) : (
        <Card sx={{ borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.1)', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {['Keyword', 'Total Records', 'Imported Date', 'Imported By', 'Actions'].map(h => (
                    <TableCell key={h} sx={headSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((kw, idx) => {
                  const i = page * rpp + idx; // Global index to check absolute #1 rank
                  const isTop = i === 0 && !search;
                  return (
                    <TableRow key={kw.keyword} hover sx={{ '&:hover': { bgcolor: 'rgba(14,165,233,0.04)' }, transition: 'all 0.2s', bgcolor: isTop ? 'rgba(139,92,246,0.05)' : 'transparent' }}>
                      <TableCell sx={cellSx}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={kw.keyword} size="small" icon={<Tag sx={{ fontSize: 13 }} />}
                              sx={{
                                bgcolor: isTop ? 'rgba(139,92,246,0.15)' : 'rgba(14,165,233,0.1)',
                                color: isTop ? '#c4b5fd' : '#38bdf8', fontWeight: 700, fontSize: 12, height: 26,
                                maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' }
                              }} />
                          {isTop && (
                             <Chip label="Top" size="small"
                               sx={{ bgcolor: 'rgba(236,72,153,0.15)', color: '#f472b6', fontSize: 10, height: 20, fontWeight: 800 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <Typography variant="body2" fontWeight={800} color="#f0f9ff">
                          {kw.totalLeads?.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={cellSx}>{kw.firstSeen ? new Date(kw.firstSeen).toLocaleDateString() : '—'}</TableCell>
                      <TableCell sx={cellSx}>{kw.topContributorName || '—'}</TableCell>
                      <TableCell sx={cellSx}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap' }}>
                          <Tooltip title="View Records">
                            <IconButton size="small" sx={{ color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 1.5, p: 0.75, '&:hover': { bgcolor: 'rgba(56,189,248,0.1)' } }} onClick={() => openDetail(kw.keyword)}>
                              <Visibility sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          {isAdmin && (
                            <>
                              <Tooltip title="Delete">
                                <IconButton size="small" sx={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 1.5, p: 0.75, '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }} onClick={(e) => { e.stopPropagation(); setDetailKw(kw.keyword); setDeleteConfirmOpen(true); }}>
                                  <Delete sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download CSV">
                                <IconButton size="small" disabled={exporting === kw.keyword} sx={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 1.5, p: 0.75, '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' } }} onClick={(e) => { e.stopPropagation(); handleExport(kw.keyword, 'csv'); }}>
                                  {exporting === kw.keyword ? <CircularProgress size={16} color="inherit" /> : <FileDownload sx={{ fontSize: 18 }} />}
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination component="div" count={filtered.length} page={page} rowsPerPage={rpp}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={e => { setRpp(+e.target.value); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              sx={{
                color: 'rgba(240,249,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.05)',
                '& .MuiIconButton-root': { color: 'rgba(240,249,255,0.4)', bgcolor: 'rgba(255,255,255,0.02)', mx: 0.5, borderRadius: 2 },
                '& .MuiSelect-icon': { color: 'rgba(240,249,255,0.4)' }
              }} />
        </Card>
      )}
    </Box>
  );
}
