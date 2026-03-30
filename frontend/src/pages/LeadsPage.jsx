import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Button, Card, Chip, IconButton, Typography, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Checkbox,
  LinearProgress, Menu, FormControlLabel, FormGroup,
} from '@mui/material';
import {
  Add, FileDownload, FileUpload, Edit, Delete, AutoAwesome,
  LinkedIn, OpenInNew, MoreVert, SelectAll, Search,
} from '@mui/icons-material';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import FilterPanel from '../components/leads/FilterPanel';
import LeadForm from '../components/leads/LeadForm';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

/* ─── Excel-style cell styling ─────────────────────────────────── */
const cellSx = {
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  borderRight: '1px solid rgba(255,255,255,0.03)',
  color: '#e2f4ff', py: 1, px: 1.5, fontSize: 12.5,
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  maxWidth: 200,
};
const headSx = {
  ...cellSx, bgcolor: '#0a1628', color: 'rgba(240,249,255,0.5)', fontWeight: 700, fontSize: 11,
  textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
  position: 'sticky', top: 0, zIndex: 2,
};

const ScoreChip = ({ score }) => {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const bg = score >= 80 ? 'rgba(16,185,129,0.12)' : score >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
  return (
    <Chip label={score} size="small"
      sx={{
        bgcolor: bg, color, fontWeight: 700, height: 20, fontSize: 11,
        border: `1px solid ${color}30`, minWidth: 38
      }} />
  );
};

const StatusChip = ({ status }) => {
  const map = {
    new: '#0ea5e9', contacted: '#8b5cf6', qualified: '#10b981',
    disqualified: '#ef4444', converted: '#f59e0b'
  };
  const c = map[status] || '#6b7280';
  return (
    <Chip label={status} size="small"
      sx={{
        bgcolor: `${c}15`, color: c, height: 18, fontSize: 10,
        border: `1px solid ${c}30`, textTransform: 'capitalize'
      }} />
  );
};

const availableExportCols = [
  'id', 'first_name', 'last_name', 'email', 'job_title', 'company', 'industry', 'country',
  'keyword', 'lead_score', 'status', 'source', 'linkedin', 'created_at'
];

export default function LeadsPage() {
  const { isManager, user } = useAuth();
  const isAdmin = isManager; // Backward compatibility for some logic if needed
  const isLimitedRole = ['employee', 'marketing'].includes(user?.role);
  const canExport = isManager;
  const canEditDelete = isManager;
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(50);
  const [filters, setFilters] = useState({});
  const [loading, setL] = useState(false);
  const [selected, setSel] = useState([]);
  const [formOpen, setFO] = useState(false);
  const [editLead, setEL] = useState(null);
  const [delId, setDelId] = useState(null);
  const [expOpen, setExpO] = useState(false);
  const [impOpen, setImpO] = useState(false);
  const [impFile, setImpF] = useState(null);
  const [impLoading, setImpL] = useState(false);
  const [impError, setImpError] = useState('');
  const [exporting, setExping] = useState(false);
  const [expFormat, setExpFmt] = useState('csv');
  const [expCols, setExpCols] = useState(availableExportCols);
  const [anchorEl, setAE] = useState(null);

  const load = useCallback(async () => {
    setL(true);
    try {
      const p = new URLSearchParams({ page: page + 1, limit: rpp, ...filters });
      const { data } = await api.get(`/leads?${p}`);
      setRows(data.data);
      setTotal(data.total);
      setSel([]);
    } catch { toast.error('Failed to load leads'); }
    finally { setL(false); }
  }, [page, rpp, filters]);

  useEffect(() => { load(); }, [load]);

  const handleFilter = (f) => { setFilters(f); setPage(0); };

  const handleExport = async () => {
    if (exporting) return;
    setExping(true);
    try {
      const { data } = await api.post('/leads/export', { filters, format: expFormat, selected_columns: expCols, name: `Export_${Date.now()}` });
      toast.success('Export queued! Downloading when ready…');

      const poll = setInterval(async () => {
        try {
          const s = await api.get(`/leads/exports/${data.exportId}`);
          if (s.data.export.status === 'ready') {
            clearInterval(poll);
            window.open(`/api/leads/exports/${data.exportId}/download`, '_blank');
            setExpO(false);
            setExping(false);
          } else if (s.data.export.status === 'failed') {
            clearInterval(poll);
            toast.error('Export failed');
            setExping(false);
          }
        } catch (err) {
          if (err.response?.status !== 429) {
            clearInterval(poll);
            setExping(false);
          }
        }
      }, 5000);
    } catch {
      toast.error('Export failed');
      setExping(false);
    }
  };

  /* ── Client-side import column validation ────────────────────── */
  const IMPORT_REQUIRED_COLS = [
    { name: 'keyword', aliases: ['keyword'] },
    { name: 'first_name', aliases: ['firstname', 'first_name'] },
    { name: 'last_name', aliases: ['lastname', 'last_name'] },
    { name: 'email', aliases: ['email'] },
    { name: 'company_name or company_website', aliases: ['company', 'companyname', 'company_name', 'domain', 'website', 'company_website'] },
    { name: 'job_title', aliases: ['job_title', 'jobtitle'] },
  ];

  const handleImport = async () => {
    if (!impFile) return;
    setImpError('');
    setImpL(true);
    try {
      // ── Pre-upload header validation ───────────────────────────
      const fileExt = impFile.name.split('.').pop().toLowerCase();
      let fileHeaders = [];

      if (fileExt === 'csv') {
        const text = await impFile.text();
        const firstLine = text.split(/\r?\n/)[0];
        fileHeaders = firstLine.split(',').map(h => h.trim().replace(/["']/g, '').toLowerCase().replace(/[\s_]/g, ''));
      } else if (fileExt === 'xlsx') {
        const buf = await impFile.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array', sheetRows: 1 });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (rows.length > 0) {
          fileHeaders = rows[0].map(h => String(h).toLowerCase().replace(/[\s_]/g, ''));
        }
      }

      if (fileHeaders.length > 0) {
        const missing = [];
        for (const check of IMPORT_REQUIRED_COLS) {
          const norm = check.aliases.map(a => a.replace(/[\s_]/g, ''));
          if (!norm.some(a => fileHeaders.includes(a))) missing.push(check.name);
        }
        if (missing.length > 0) {
          setImpError(`Required columns missing: ${missing.join(', ')}`);
          setImpL(false);
          return;
        }
      }

      const fd = new FormData();
      fd.append('file', impFile);
      const { data } = await api.post('/leads/import', fd);
      toast.success(data.message);
      setImpO(false); setImpF(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Import failed'); }
    finally { setImpL(false); }
  };

  const handleDelete = async () => {
    try {
      if (delId === 'bulk' && selected.length > 0) {
        await api.post('/leads/bulk-delete', { ids: selected });
        toast.success(`Deleted ${selected.length} leads`);
      } else {
        await api.delete(`/leads/${delId}`);
        toast.success('Lead deleted');
      }
      setDelId(null); setSel([]); load();
    } catch { toast.error('Delete failed'); }
  };

  const toggleSelect = (id) => setSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const allSelected = rows.length > 0 && rows.every(r => selected.includes(r.id));
  const toggleAll = () => setSel(allSelected ? [] : rows.map(r => r.id));

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#f0f9ff"
            sx={{ fontFamily: 'Georgia, serif' }}>
            Leads Intelligence
          </Typography>
          <Typography variant="body2" color="rgba(240,249,255,0.35)">
            {total.toLocaleString()} total records
            {selected.length > 0 && ` · ${selected.length} selected`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {selected.length > 0 && isManager && (
            <Button variant="outlined" color="error" size="small"
              onClick={() => setDelId('bulk')}
              sx={{ borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }}>
              Delete ({selected.length})
            </Button>
          )}
          <Button variant="outlined" size="small" startIcon={<FileUpload />}
            onClick={() => setImpO(true)}
            sx={{
              borderColor: 'rgba(14,165,233,0.3)', color: '#38bdf8',
              '&:hover': { bgcolor: 'rgba(14,165,233,0.08)' }
            }}>
            Import File
          </Button>
          {canExport && (
            <Button variant="outlined" size="small" startIcon={<FileDownload />}
              onClick={() => setExpO(true)}
              sx={{
                borderColor: 'rgba(14,165,233,0.3)', color: '#38bdf8',
                '&:hover': { bgcolor: 'rgba(14,165,233,0.08)' }
              }}>
              Export
            </Button>
          )}
          <Button variant="contained" size="small" startIcon={<Add />}
            onClick={() => { setEL(null); setFO(true); }}
            sx={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 700 }}>
            Add Lead
          </Button>
        </Box>
      </Box>

      <FilterPanel onFilter={handleFilter} resultCount={total} />

      <Card sx={{ borderRadius: 2.5, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.1)', overflow: 'hidden' }}>
        {loading && <LinearProgress sx={{ bgcolor: 'rgba(14,165,233,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#0ea5e9' } }} />}

        {/* ── Excel-style scrollable table ───────────────────────── */}
        <TableContainer sx={{ maxHeight: 'calc(100vh - 380px)', overflowX: 'auto' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 1400 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ ...headSx, maxWidth: 48 }}>
                  <Checkbox size="small" checked={allSelected} onChange={toggleAll}
                    sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#0ea5e9' } }} />
                </TableCell>
                {['Added Date', 'Added By', 'Keyword / Owner', 'Company', 'Company Desc', 'First Name', 'Last Name', 'Email', 'Job Title', 'Country', 'Source', 'Score', 'Status'].map(h => (
                  <TableCell key={h} sx={headSx}>{h}</TableCell>
                ))}
                {canEditDelete && <TableCell sx={{ ...headSx, maxWidth: 80 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEditDelete ? 15 : 14} align="center"
                    sx={{ py: 8, color: 'rgba(240,249,255,0.3)', borderBottom: 'none', whiteSpace: 'normal' }}>
                    No leads found. Try adjusting your filters or add your first lead.
                  </TableCell>
                </TableRow>
              ) : rows.map(row => (
                <TableRow key={row.id}
                  selected={selected.includes(row.id)}
                  sx={{
                    transition: 'background 0.15s',
                    '&:hover': { bgcolor: 'rgba(14,165,233,0.06)' },
                    '&.Mui-selected': { bgcolor: 'rgba(14,165,233,0.1)' }
                  }}>
                  <TableCell padding="checkbox" sx={{ ...cellSx, maxWidth: 48 }}>
                    <Checkbox size="small" checked={selected.includes(row.id)} onChange={() => toggleSelect(row.id)}
                      sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#0ea5e9' } }} />
                  </TableCell>

                  {/* ── Added Date ──────────────────────────────── */}
                  <TableCell sx={{ ...cellSx, maxWidth: 120 }}>
                    <Typography variant="body2" color="rgba(240,249,255,0.7)">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB').replace(/\//g, '-') : '—'}
                    </Typography>
                  </TableCell>

                  {/* ── Added By ────────────────────────────────── */}
                  <TableCell sx={{ ...cellSx, maxWidth: 130 }}>
                    <Typography variant="body2" color="#7dd3fc" fontWeight={500} noWrap>
                      {row.createdByName || '—'}
                    </Typography>
                  </TableCell>

                  {/* ── Keyword / Owner — 3 lines ────────────────── */}
                  <TableCell sx={{ ...cellSx, maxWidth: 220, whiteSpace: 'normal', minWidth: 180 }}>
                    <Tooltip title={`Keyword: ${row.keyword || '—'}\nImported By: ${row.keywordCreatedByName || '—'}\nAdded By: ${row.createdByName || '—'}`} placement="top" arrow>
                      <Box>
                        {row.keyword ? (
                          <Chip label={row.keyword} size="small" sx={{
                            bgcolor: 'rgba(14,165,233,0.1)', color: '#38bdf8', height: 20, fontSize: 10, fontWeight: 700,
                            maxWidth: 180, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' }
                          }} />
                        ) : (
                          <Typography variant="caption" color="rgba(255,255,255,0.2)">—</Typography>
                        )}
                        <Typography variant="caption" display="block" color="rgba(240,249,255,0.45)" mt={0.3} sx={{ fontSize: 10, lineHeight: 1.3 }}>
                          Imported By: <Box component="span" color="#7dd3fc">{row.keywordCreatedByName || '—'}</Box>
                        </Typography>
                        <Typography variant="caption" display="block" color="rgba(240,249,255,0.45)" sx={{ fontSize: 10, lineHeight: 1.3 }}>
                          Added By: <Box component="span" color="#7dd3fc">{row.createdByName || '—'}</Box>
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>

                  {/* ── Company ──────────────────────────────────── */}
                  <TableCell sx={{ ...cellSx, maxWidth: 180 }}>
                    <Tooltip title={`${typeof row.company === 'object' && row.company !== null ? (row.company.company_name || row.company.company || '') : row.company || '—'}${row.domain ? '\n' + row.domain : ''}`} placement="top" arrow>
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="#f0f9ff" noWrap>
                          {typeof row.company === 'object' && row.company !== null
                            ? (row.company.company_name || row.company.company || JSON.stringify(row.company))
                            : row.company || '—'}
                        </Typography>
                        {row.domain && (
                          <Box component="a" href={row.domain.startsWith('http') ? row.domain : `https://${row.domain}`} target="_blank" rel="noopener"
                            sx={{
                              display: 'flex', alignItems: 'center', gap: 0.3, color: '#0ea5e9',
                              fontSize: 10, textDecoration: 'none', '&:hover': { textDecoration: 'underline' }
                            }}>
                            {row.domain} <OpenInNew sx={{ fontSize: 9 }} />
                          </Box>
                        )}
                      </Box>
                    </Tooltip>
                  </TableCell>

                  {/* ── Company Desc ─────────────────────────────── */}
                  <TableCell sx={{ ...cellSx, maxWidth: 200 }}>
                    <Tooltip title={row.company_desc || 'No description available'} placement="top" arrow>
                      <Typography variant="body2" color="rgba(240,249,255,0.6)" noWrap>
                        {row.company_desc || '—'}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  {/* ── First Name ──────────────────────────────── */}
                  <TableCell sx={{ ...cellSx, maxWidth: 130 }}>
                    <Tooltip title={row.first_name || '—'} placement="top" arrow>
                      <Typography variant="body2" noWrap>{row.first_name || '—'}</Typography>
                    </Tooltip>
                  </TableCell>

                  {/* ── Last Name ───────────────────────────────── */}
                  <TableCell sx={{ ...cellSx, maxWidth: 130 }}>
                    <Tooltip title={row.last_name || '—'} placement="top" arrow>
                      <Typography variant="body2" noWrap>{row.last_name || '—'}</Typography>
                    </Tooltip>
                  </TableCell>

                  {/* ── Email ───────────────────────────────────── */}
                  <TableCell sx={{ ...cellSx, maxWidth: 220 }}>
                    <Tooltip title={row.email || '—'} placement="top" arrow>
                      <Typography variant="body2" color="#e2f4ff" noWrap>{row.email || '—'}</Typography>
                    </Tooltip>
                  </TableCell>

                  {/* ── Job Title ───────────────────────────────── */}
                  <TableCell sx={{ ...cellSx, maxWidth: 180 }}>
                    <Tooltip title={row.job_title || '—'} placement="top" arrow>
                      <Typography variant="body2" color="#38bdf8" fontWeight={500} noWrap>{row.job_title || '—'}</Typography>
                    </Tooltip>
                  </TableCell>

                  {/* ── Country ─────────────────────────────────── */}
                  <TableCell sx={{ ...cellSx, maxWidth: 120 }}>
                    <Tooltip title={row.country || '—'} placement="top" arrow>
                      <Typography variant="body2" noWrap>{row.country || '—'}</Typography>
                    </Tooltip>
                  </TableCell>

                  {/* ── Source ──────────────────────────────────── */}
                  <TableCell sx={{ ...cellSx, maxWidth: 120 }}>
                    <Tooltip title={row.source || 'Unknown'} placement="top" arrow>
                      <Box sx={{ width: '100%', overflow: 'hidden' }}>
                        <Chip label={row.source || 'Unknown'} size="small" sx={{ bgcolor: 'rgba(14,165,233,0.1)', color: '#38bdf8', maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} />
                      </Box>
                    </Tooltip>
                  </TableCell>



                  {/* ── Score ───────────────────────────────────── */}
                  <TableCell sx={{ ...cellSx, maxWidth: 70 }}>
                    {row.lead_score > 0
                      ? <ScoreChip score={row.lead_score} />
                      : <Typography variant="caption" color="rgba(255,255,255,0.2)">—</Typography>
                    }
                  </TableCell>

                  {/* ── Status ──────────────────────────────────── */}
                  <TableCell sx={{ ...cellSx, maxWidth: 100 }}><StatusChip status={row.status} /></TableCell>

                  {/* ── Actions ─────────────────────────────────── */}
                  {canEditDelete && (
                    <TableCell sx={{ ...cellSx, maxWidth: 80 }}>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => { setEL(row); setFO(true); }}
                            sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#38bdf8' } }}>
                            <Edit sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => setDelId(row.id)}
                            sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#ef4444' } }}>
                            <Delete sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div" count={total} page={page} rowsPerPage={rpp}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setRpp(+e.target.value); setPage(0); }}
          rowsPerPageOptions={[25, 50, 100, 200]}
          sx={{
            color: 'rgba(240,249,255,0.5)',
            '& .MuiIconButton-root': { color: 'rgba(240,249,255,0.4)' },
            '& .MuiSelect-icon': { color: 'rgba(240,249,255,0.4)' },
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}
        />
      </Card>

      {/* Lead Form */}
      <LeadForm open={formOpen} onClose={() => setFO(false)} onSaved={load} lead={editLead} />

      {/* Delete confirm */}
      <Dialog open={!!delId} onClose={() => setDelId(null)}
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(239,68,68,0.2)' } }}>
        <DialogTitle sx={{ color: '#f0f9ff', fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography color="rgba(240,249,255,0.6)">
            {selected.length > 1
              ? `Delete ${selected.length} selected leads? This cannot be undone.`
              : 'Delete this lead? This cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelId(null)} sx={{ color: 'rgba(240,249,255,0.5)' }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Export dialog */}
      <Dialog open={expOpen} onClose={() => setExpO(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.2)' } }}>
        <DialogTitle sx={{ color: '#f0f9ff', fontWeight: 700 }}>Export Leads</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="rgba(240,249,255,0.5)" mb={2}>
            Select the fields you want to export. Export will include all current filter results.
          </Typography>
          <TextField fullWidth label="Format" select value={expFormat}
            onChange={e => setExpFmt(e.target.value)} size="small"
            sx={{
              mb: 3,
              '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff' },
              '& .MuiInputLabel-root': { color: 'rgba(240,249,255,0.4)' }
            }}>
            <MenuItem value="csv">CSV</MenuItem>
            <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
          </TextField>
          <Typography variant="subtitle2" color="#f0f9ff" mb={1}>Select Columns</Typography>
          <Box sx={{ maxHeight: 200, overflowY: 'auto', p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
            <FormGroup>
              {availableExportCols.map(c => (
                <FormControlLabel
                  key={c}
                  control={
                    <Checkbox size="small" checked={expCols.includes(c)}
                      onChange={(e) => {
                        if (e.target.checked) setExpCols([...expCols, c]);
                        else setExpCols(expCols.filter(x => x !== c));
                      }}
                      sx={{ color: 'rgba(240,249,255,0.3)', '&.Mui-checked': { color: '#0ea5e9' } }}
                    />
                  }
                  label={<Typography variant="body2" color="rgba(240,249,255,0.7)">{c.replace(/_/g, ' ').toUpperCase()}</Typography>}
                />
              ))}
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpO(false)} sx={{ color: 'rgba(240,249,255,0.5)' }}>Cancel</Button>
          <Button variant="contained" onClick={handleExport} disabled={exporting}
            sx={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 700 }}>
            {exporting ? <CircularProgress size={18} color="inherit" /> : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={impOpen} onClose={() => setImpO(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.2)' } }}>
        <DialogTitle sx={{ color: '#f0f9ff', fontWeight: 700 }}>Import Data</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="rgba(240,249,255,0.5)" mb={1}>
            Upload a CSV or Excel file. Required columns: <strong style={{color:'#38bdf8'}}>keyword, first_name, last_name, email, company_name, job_title</strong>.
            Extra columns are accepted and stored as metadata.
          </Typography>
          {impError && (
            <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)',
              '& .MuiAlert-icon': { color: '#ef4444' } }}>
              {impError}
            </Alert>
          )}

          <Box sx={{ border: '2px dashed rgba(14,165,233,0.3)', borderRadius: 2, p: 3, textAlign: 'center' }}>
            <input type="file" accept=".csv,.xlsx"
              onChange={e => { setImpF(e.target.files[0]); setImpError(''); }}
              style={{ display: 'block', width: '100%', color: '#38bdf8', cursor: 'pointer' }} />
            {impFile && (
              <Typography variant="caption" color="#10b981" mt={1} display="block">
                ✓ {impFile.name} ({(impFile.size / 1024).toFixed(1)} KB)
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImpO(false)} sx={{ color: 'rgba(240,249,255,0.5)' }}>Cancel</Button>
          <Button variant="contained" disabled={!impFile || impLoading} onClick={handleImport}
            sx={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 700 }}>
            {impLoading ? <CircularProgress size={18} color="inherit" /> : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
