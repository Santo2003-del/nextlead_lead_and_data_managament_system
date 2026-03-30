import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Chip, Grid,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, LinearProgress, IconButton, Tooltip,
  Stack, InputAdornment, Checkbox, FormControlLabel, FormGroup,
} from '@mui/material';
import {
  CloudUpload, Download, Search, PersonAdd,
  Business, AlternateEmail, Refresh, Delete, Edit,
  FilePresent, FileDownload, FilterList
} from '@mui/icons-material';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STAGING_STATUS_COLOR = {
  raw: '#38bdf8', converted: '#10b981', exported: '#f59e0b'
};

const availableExportCols = [
  'keyword', 'first_name', 'last_name', 'email', 'company_name', 'job_title', 'country'
];

export default function ScraperPage() {
  const [data, setData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ keyword: '', job_title: '', company_name: '', country: '', email_domain: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selection, setSelection] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [expOpen, setExpO] = useState(false);
  const [expFormat, setExpFmt] = useState('csv');
  const [expCols, setExpCols] = useState(availableExportCols);
  const fileInputRef = useRef(null);
  const { isManager, user } = useAuth();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const isLimitedRole = user?.role && ['employee', 'marketing'].includes(user.role.toLowerCase());
  const isSuperAdmin = user?.role && ['superadmin', 'super_admin'].includes(user.role.toLowerCase());
  const canExport = isManager;
  const canEditDelete = isManager;

  const loadData = () => {
    setDataLoading(true);
    // Convert DataGrid 0-based page to API 1-based page
    const apiFilters = { ...filters };
    if (apiFilters.keyword) {
      // split comma separated
      apiFilters.keyword = apiFilters.keyword.split(',').map(s => s.trim()).filter(Boolean);
    }

    api.get('/scrape/data', {
      params: { page: page + 1, limit: pageSize, search, ...apiFilters }
    })
      .then(r => {
        setData(r.data.data);
        setTotal(r.data.total);
      })
      .catch(e => toast.error('Failed to load data'))
      .finally(() => setDataLoading(false));
  };

  const loadHistory = () => {
    setHistoryLoading(true);
    api.get('/imports')
      .then(r => setHistory(r.data.data))
      .catch(() => toast.error('Failed to load import history'))
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => { loadData(); }, [page, pageSize, search, filters]);
  useEffect(() => { loadHistory(); }, []);

  const handleImportSubmit = async () => {
    if (!importFile) return toast.error('Please select a file');
    const ext = importFile.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx'].includes(ext)) {
      return toast.error('Only CSV and XLSX files are supported');
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);

    const tid = toast.loading('Uploading and processing dataset...');
    try {
      await api.post('/leads/import', formData);
      toast.success('Dataset imported successfully into Staging!', { id: tid });
      loadData();
      setImportOpen(false);
      setImportFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed', { id: tid });
    } finally {
      setImporting(false);
    }
  };

  const handleEditClick = (row) => {
    setEditData({ ...row });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/staging/${editData.id}`, editData);
      toast.success('Record updated');
      loadData();
      setEditOpen(false);
    } catch (err) {
      toast.error('Failed to update record');
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteId(row.id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/staging/${deleteId}`);
      toast.success('Record deleted');
      loadData();
      setDeleteOpen(false);
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  const handleDeleteAllConfirm = async () => {
    const tid = toast.loading('Clearing all staging data...');
    try {
      const res = await api.delete('/scrape/data/all');
      toast.success(res.data.message || 'All records successfully clear', { id: tid });
      loadData();
      setDeleteAllOpen(false);
      setSelection([]);
    } catch (err) {
      toast.error('Failed to clear database', { id: tid });
    }
  };

  const handleConvertToLeads = async () => {
    if (!selection.length) return;
    const loadId = toast.loading('Converting to leads...');
    try {
      await api.post('/scrape/data/convert', { ids: selection });
      toast.success('Success! Leads added to your list.', { id: loadId });
      loadData();
      setSelection([]);
    } catch (err) { toast.error('Conversion failed', { id: loadId }); }
  };

  const handleExport = async () => {
    const format = expFormat;
    const tid = toast.loading(`Preparing ${format.toUpperCase()} export...`);
    try {
      const qs = new URLSearchParams({ format });
      if (search) qs.append('search', search);

      const apiFilters = { ...filters };
      if (apiFilters.keyword) {
        qs.append('keyword', apiFilters.keyword);
      }
      Object.keys(apiFilters).forEach(k => {
        if (apiFilters[k] && k !== 'keyword') qs.append(k, apiFilters[k]);
      });

      qs.append('selected_columns', expCols.join(','));

      const res = await api.get(`/staging/export?${qs.toString()}`, { responseType: 'blob' });

      const downloadUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `staging_data_${new Date().getTime()}.${format === 'xlsx' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Export downloaded!', { id: tid });
      setExpO(false);
    } catch (err) {
      let msg = 'Export failed';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          msg = JSON.parse(text).error || msg;
        } catch (e) { }
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      }
      toast.error(msg, { id: tid });
    }
  };

  const columns = useMemo(() => {
    // Phase 7 & 8: cell padding, text-overflow, and minWidths inside columns
    const renderCellExcel = (p) => (
      <Tooltip title={p.value || ''} placement="top" arrow>
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', width: '100%' }}>
          {p.value || '—'}
        </Typography>
      </Tooltip>
    );

    const base = [
      {
        field: 'importedAt', headerName: 'Imported Date', width: 130, renderCell: (p) => (
          <Typography variant="body2" sx={{ color: 'rgba(240,249,255,0.7)', whiteSpace: 'nowrap' }}>
            {p.value ? new Date(p.value).toLocaleDateString('en-GB').replace(/\//g, '-') : '—'}
          </Typography>
        )
      },
      { field: 'uploadedByName', headerName: 'Imported By', width: 130, renderCell: renderCellExcel },
      {
        field: 'keyword', headerName: 'Keyword', width: 130, renderCell: (p) => (
          <Tooltip title={p.value || ''} placement="top" arrow>
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <Chip label={p.value || 'N/A'} size="small" sx={{ bgcolor: 'rgba(14,165,233,0.1)', color: '#38bdf8', maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} />
            </Box>
          </Tooltip>
        )
      },
      { field: 'first_name', headerName: 'First Name', width: 130, renderCell: renderCellExcel },
      { field: 'last_name', headerName: 'Last Name', width: 130, renderCell: renderCellExcel },
      {
        field: 'email', headerName: 'Email', minWidth: 220, renderCell: (p) => (
          <Tooltip title={p.value || ''} placement="top" arrow>
            <Typography variant="body2" sx={{ color: p.value ? '#38bdf8' : 'rgba(240,249,255,0.2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', width: '100%' }}>
              {p.value || 'No Email Found'}
            </Typography>
          </Tooltip>
        )
      },
      {
        field: 'company_name', headerName: 'Company Name', minWidth: 200, flex: 1, renderCell: (p) => {
          const val = typeof p.value === 'object' && p.value !== null
            ? (p.value.company_name || p.value.company || JSON.stringify(p.value))
            : p.value;
          return (
            <Tooltip title={val || ''} placement="top" arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', overflow: 'hidden' }}>
                <Business fontSize="inherit" sx={{ opacity: 0.5, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {val || '—'}
                </Typography>
              </Box>
            </Tooltip>
          );
        }
      },
      // Phase 5: Add company_phone base column
      { field: 'company_phone', headerName: 'Company Phone', width: 150, renderCell: renderCellExcel },
      { field: 'job_title', headerName: 'Job Title', minWidth: 200, flex: 1, renderCell: renderCellExcel },
      { field: 'country', headerName: 'Country', width: 120, renderCell: renderCellExcel },
    ];

    // Phase 6: Dynamic columns from rawData
    const dynamicKeys = new Set();
    const knownKeys = ['first_name', 'last_name', 'email', 'company_name', 'company_phone', 'job_title', 'country', 'keyword', 'contact_number', 'metadata'];
    
    data.forEach(row => {
      if (row.rawData) {
        Object.keys(row.rawData).forEach(k => {
          if (!knownKeys.includes(k) && row.rawData[k]) {
            dynamicKeys.add(k);
          }
        });
      }
    });

    const dynamicCols = Array.from(dynamicKeys).map(k => ({
      field: `raw_${k}`,
      headerName: String(k).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      width: 150,
      valueGetter: (p) => p.row.rawData ? p.row.rawData[k] : '',
      renderCell: renderCellExcel
    }));

    const endCols = [
      {
        field: 'source', headerName: 'Source', width: 120, renderCell: (p) => (
          <Tooltip title={p.value || 'Unknown'} placement="top" arrow>
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <Chip label={p.value || 'Unknown'} size="small" sx={{ bgcolor: 'rgba(14,165,233,0.1)', color: '#38bdf8', maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} />
            </Box>
          </Tooltip>
        )
      },
      {
        field: 'status', headerName: 'Status', width: 120, renderCell: (p) => (
          <Tooltip title={p.value || ''} placement="top" arrow>
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <Chip label={p.value} size="small"
                sx={{ bgcolor: `${STAGING_STATUS_COLOR[p.value] || '#94a3b8'}15`, color: STAGING_STATUS_COLOR[p.value] || '#94a3b8', fontWeight: 700, maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} />
            </Box>
          </Tooltip>
        )
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 120,
        renderCell: (p) => {
          if (!canEditDelete) return null;
          return (
            <Stack direction="row" spacing={1}>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => handleEditClick(p.row)}>
                  <Edit fontSize="small" sx={{ color: '#38bdf8' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => handleDeleteClick(p.row)}>
                  <Delete fontSize="small" sx={{ color: '#ef4444' }} />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        }
      }
    ];

    return [...base, ...dynamicCols, ...endCols];
  }, [data, canEditDelete]);

  function CustomToolbar() {
    return (
      <GridToolbarContainer sx={{ p: 2, gap: 2, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" size="small" startIcon={<PersonAdd />}
            disabled={!selection.length} onClick={handleConvertToLeads}
            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
            Add Selected to CRM ({selection.length})
          </Button>
          {canExport && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<FileDownload />}
                onClick={() => { setExpFmt('xlsx'); setExpO(true); }} sx={{ color: '#f59e0b', borderColor: '#f59e0b', '&:hover': { borderColor: '#d97706' } }}>
                Excel
              </Button>
              <Button variant="outlined" size="small" startIcon={<FileDownload />}
                onClick={() => { setExpFmt('csv'); setExpO(true); }} sx={{ color: '#94a3b8', borderColor: '#475569' }}>
                CSV
              </Button>
            </Box>
          )}
          {isSuperAdmin && (
             <Button variant="outlined" size="small" startIcon={<Delete />}
                onClick={() => setDeleteAllOpen(true)}
                sx={{ ml: 'auto', color: '#ef4444', borderColor: 'rgba(239,68,68,0.5)', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444' } }}>
                Clear All Data
             </Button>
          )}
        </Stack>
      </GridToolbarContainer>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#f0f9ff" sx={{ fontFamily: 'Georgia, serif' }}>
            Data Staging & Management
          </Typography>
          <Typography variant="body2" color="rgba(240,249,255,0.35)">
            Review, filter, and normalize your datasets before committing to CRM
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setImportOpen(true)}
            sx={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 700, px: 3 }}>
            Import Dataset
          </Button>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.1)', overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(14,165,233,0.02)' }}>
          <TextField
            placeholder="Search keyword, email, company or title..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: 350,
              '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.03)', color: '#f0f9ff', borderRadius: 2 },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(14,165,233,0.2)' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(240,249,255,0.3)' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Refresh Data">
                    <IconButton size="small" onClick={loadData} sx={{ color: 'rgba(240,249,255,0.2)' }}><Refresh fontSize="small" /></IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }}
          />
          <Button variant="outlined" startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ color: showFilters ? '#38bdf8' : 'rgba(240,249,255,0.5)', borderColor: 'rgba(14,165,233,0.3)', bgcolor: showFilters ? 'rgba(14,165,233,0.1)' : 'transparent' }}>
            Filters
          </Button>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" color="rgba(240,249,255,0.3)">
            {total} records
          </Typography>
        </Box>

        {showFilters && (
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', bgcolor: '#0b162c' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <TextField fullWidth size="small" placeholder="Keywords (comma separated)"
                  value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })}
                  sx={{ '& .MuiInputBase-root': { color: '#f0f9ff', fontSize: 13 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }} />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <TextField fullWidth size="small" placeholder="Job Title"
                  value={filters.job_title} onChange={e => setFilters({ ...filters, job_title: e.target.value })}
                  sx={{ '& .MuiInputBase-root': { color: '#f0f9ff', fontSize: 13 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }} />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <TextField fullWidth size="small" placeholder="Company"
                  value={filters.company_name} onChange={e => setFilters({ ...filters, company_name: e.target.value })}
                  sx={{ '& .MuiInputBase-root': { color: '#f0f9ff', fontSize: 13 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }} />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <TextField fullWidth size="small" placeholder="Country"
                  value={filters.country} onChange={e => setFilters({ ...filters, country: e.target.value })}
                  sx={{ '& .MuiInputBase-root': { color: '#f0f9ff', fontSize: 13 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }} />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <TextField fullWidth size="small" placeholder="Email Domain (e.g. gmail.com)"
                  value={filters.email_domain} onChange={e => setFilters({ ...filters, email_domain: e.target.value })}
                  sx={{ '& .MuiInputBase-root': { color: '#f0f9ff', fontSize: 13 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
              <Button size="small" onClick={() => setFilters({ keyword: '', job_title: '', company_name: '', country: '', email_domain: '' })}
                sx={{ color: 'rgba(240,249,255,0.4)' }}>Clear Filters</Button>
            </Box>
          </Box>
        )}
        <Box sx={{ height: 650, width: '100%' }}>
          <DataGrid
            rows={data}
            columns={columns}
            paginationMode="server"
            rowCount={total}
            loading={dataLoading}
            checkboxSelection
            onRowSelectionModelChange={(newSelection) => setSelection(newSelection)}
            rowSelectionModel={selection}
            onPaginationModelChange={(m) => {
              setPage(m.page);
              setPageSize(m.pageSize);
            }}
            paginationModel={{ page, pageSize }}
            pageSizeOptions={[10, 25, 50, 100]}
            slots={{ toolbar: CustomToolbar }}
            getRowHeight={() => 'auto'}
            sx={{
              border: 'none',
              color: '#f0f9ff',
              '& .MuiDataGrid-cell': { 
                borderBottom: '1px solid rgba(255,255,255,0.04)', 
                color: 'rgba(240,249,255,0.7)',
                paddingY: 1,
                alignItems: 'center',
                display: 'flex'
              },
              '& .MuiDataGrid-columnHeader': { bgcolor: 'rgba(14,165,233,0.05)', color: '#fff', borderBottom: '1px solid rgba(14,165,233,0.2)' },
              '& .MuiDataGrid-footerContainer': { borderTop: '1px solid rgba(255,255,255,0.04)', bgcolor: 'rgba(14,165,233,0.01)' },
              '& .MuiTablePagination-root': { color: 'rgba(240,249,255,0.5)' },
              '& .MuiCheckbox-root': { color: 'rgba(14,165,233,0.3)' },
              '& .MuiDataGrid-row:hover': { bgcolor: 'rgba(14,165,233,0.03)' },
              '& .MuiDataGrid-virtualScroller': { bgcolor: '#0d1f3c' }
            }}
          />
        </Box>
      </Card>

      {/* Import History Table - All authenticated users (backend scopes data) */}
      {/* Import History Table - All authenticated users (backend scopes data) */}
      <Box sx={{ mt: 5 }}>
          <Typography variant="h5" fontWeight={700} color="#f0f9ff" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Refresh sx={{ color: '#38bdf8' }} /> Import History & Duplication Tracking
          </Typography>
          <Card sx={{ borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.1)' }}>
            <Box sx={{ height: 350, width: '100%' }}>
              <DataGrid
                rows={history}
                loading={historyLoading}
                columns={[
                  { field: 'file_name', headerName: 'File Name', width: 250 },
                  { field: 'uploaded_by_name', headerName: 'Uploaded By', width: 150 },
                  { field: 'total_rows', headerName: 'Total Rows', width: 120 },
                  { field: 'valid_rows', headerName: 'Valid Rows', width: 120 },
                  { field: 'created_at', headerName: 'Import Date', width: 200, renderCell: (p) => formatDistanceToNow(new Date(p.value), { addSuffix: true }) },
                ]}
                sx={{
                  border: 'none',
                  color: '#f0f9ff',
                  '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(240,249,255,0.7)' },
                  '& .MuiDataGrid-columnHeader': { bgcolor: 'rgba(14,165,233,0.05)', color: '#fff', borderBottom: '1px solid rgba(14,165,233,0.2)' },
                  '& .MuiDataGrid-virtualScroller': { bgcolor: '#0d1f3c' }
                }}
              />
            </Box>
          </Card>
        </Box>

      <Dialog open={expOpen} onClose={() => setExpO(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.2)' } }}>
        <DialogTitle sx={{ color: '#f0f9ff', fontWeight: 700 }}>Export Data</DialogTitle>
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
          <Button variant="contained" onClick={handleExport}
            sx={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 700 }}>
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.2)' } }}>
        <DialogTitle sx={{ color: '#f0f9ff', fontWeight: 700 }}>Import Dataset</DialogTitle>
        <DialogContent>
          <Button variant="outlined" component="label" fullWidth sx={{ color: '#38bdf8', borderColor: 'rgba(14,165,233,0.3)', mt: 2 }}>
            {importFile ? importFile.name : 'Select File (CSV/XLSX)'}
            <input type="file" hidden accept=".csv,.xlsx" onChange={e => setImportFile(e.target.files?.[0])} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)} sx={{ color: 'rgba(240,249,255,0.5)' }}>Cancel</Button>
          <Button variant="contained" onClick={handleImportSubmit} disabled={importing}
            startIcon={importing ? <CircularProgress size={18} color="inherit" /> : <CloudUpload />}
            sx={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 700 }}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.2)' } }}>
        <DialogTitle sx={{ color: '#f0f9ff', fontWeight: 700 }}>Edit Record</DialogTitle>
        <DialogContent>
          {editData && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField fullWidth label="First Name" value={editData.first_name || ''}
                  onChange={e => setEditData({ ...editData, first_name: e.target.value })}
                  size="small"
                  sx={{ '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff' }, '& .MuiInputLabel-root': { color: 'rgba(240,249,255,0.4)' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Last Name" value={editData.last_name || ''}
                  onChange={e => setEditData({ ...editData, last_name: e.target.value })}
                  size="small"
                  sx={{ '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff' }, '& .MuiInputLabel-root': { color: 'rgba(240,249,255,0.4)' } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Email" value={editData.email || ''}
                  onChange={e => setEditData({ ...editData, email: e.target.value })}
                  size="small"
                  sx={{ '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff' }, '& .MuiInputLabel-root': { color: 'rgba(240,249,255,0.4)' } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Company Name" value={editData.company_name || ''}
                  onChange={e => setEditData({ ...editData, company_name: e.target.value })}
                  size="small"
                  sx={{ '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff' }, '& .MuiInputLabel-root': { color: 'rgba(240,249,255,0.4)' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Job Title" value={editData.job_title || ''}
                  onChange={e => setEditData({ ...editData, job_title: e.target.value })}
                  size="small"
                  sx={{ '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff' }, '& .MuiInputLabel-root': { color: 'rgba(240,249,255,0.4)' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Country" value={editData.country || ''}
                  onChange={e => setEditData({ ...editData, country: e.target.value })}
                  size="small"
                  sx={{ '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff' }, '& .MuiInputLabel-root': { color: 'rgba(240,249,255,0.4)' } }} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} sx={{ color: 'rgba(240,249,255,0.5)' }}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}
            sx={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 700 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(239,68,68,0.3)' } }}>
        <DialogTitle sx={{ color: '#fca5a5', fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="rgba(240,249,255,0.7)">
            Are you sure you want to delete this record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} sx={{ color: 'rgba(240,249,255,0.5)' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} sx={{ fontWeight: 700 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Dialog */}
      <Dialog open={deleteAllOpen} onClose={() => setDeleteAllOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(239,68,68,0.3)' } }}>
        <DialogTitle sx={{ color: '#fca5a5', fontWeight: 700 }}>Clear All Database Records</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="var(--toastify-color-error)" fontWeight={600} mb={1}>
            Warning: This action is irreversible.
          </Typography>
          <Typography variant="body2" color="rgba(240,249,255,0.7)">
            You are about to permanently delete EVERY UN-CONVERTED STAGING RECORD in the database for all users. Do you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllOpen(false)} sx={{ color: 'rgba(240,249,255,0.5)' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteAllConfirm} sx={{ fontWeight: 700 }}>
            Yes, Clear All Data
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
