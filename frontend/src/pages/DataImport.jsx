import { useState } from 'react';
import {
  Box, Typography, Card, Button, Paper, CircularProgress,
  List, ListItem, ListItemIcon, ListItemText, Divider,
  Alert, LinearProgress, Stack, Grid,
} from '@mui/material';
import {
  CloudUpload, FilePresent, CheckCircle, ErrorOutline,
  InfoOutlined, InsertDriveFile, History, BoltOutlined,
} from '@mui/icons-material';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function DataImport() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (['csv', 'xlsx'].includes(ext)) setFile(f);
    else toast.error('Only CSV and XLSX files are supported');
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const { data } = await api.post('/leads/import', fd);
      setResult(data);
      toast.success('Import completed successfully');
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="#f0f9ff" gutterBottom
          sx={{ fontFamily: 'Georgia, serif' }}>
          Data Import Center
        </Typography>
        <Typography variant="body1" color="rgba(240,249,255,0.5)">
          Seamlessly upload your lead datasets. We'll handle duplicate removal, 
          invalid data cleaning, and normalization automatically.
        </Typography>
      </Box>

      <Card sx={{ 
        p: 4, bgcolor: '#0d1f3c', borderRadius: 3, 
        border: '1px solid rgba(14,165,233,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)'
      }}>
        {!result ? (
          <>
            <Box
              onDragEnter={handleDrag} onDragLeave={handleDrag}
              onDragOver={handleDrag} onDrop={handleDrop}
              sx={{
                border: '2px dashed',
                borderColor: dragActive ? '#0ea5e9' : 'rgba(14,165,233,0.3)',
                borderRadius: 2, p: 6, textAlign: 'center', mb: 3,
                bgcolor: dragActive ? 'rgba(14,165,233,0.08)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input id="file-input" type="file" hidden accept=".csv,.xlsx" 
                onChange={(e) => handleFile(e.target.files[0])} />
              
              <CloudUpload sx={{ fontSize: 60, color: '#38bdf8', mb: 2, opacity: 0.8 }} />
              <Typography variant="h6" color="#f0f9ff" gutterBottom>
                {file ? file.name : 'Click or Drag file to upload'}
              </Typography>
              <Typography variant="body2" color="rgba(240,249,255,0.4)">
                Supports CSV and Microsoft Excel (.xlsx) files up to 50MB
              </Typography>
            </Box>

            {file && (
              <Stack direction="row" spacing={2} sx={{ mb: 3, p: 1.5, bgcolor: 'rgba(16,185,129,0.08)', borderRadius: 2, border: '1px solid rgba(16,185,129,0.2)' }}>
                <InsertDriveFile sx={{ color: '#10b981' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="#f0f9ff" fontWeight={600}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="rgba(240,249,255,0.4)">
                    {(file.size / 1024).toFixed(1)} KB · Ready to import
                  </Typography>
                </Box>
                <Button size="small" onClick={() => setFile(null)} sx={{ color: 'rgba(240,249,255,0.4)' }}>Remove</Button>
              </Stack>
            )}

            <Button
              fullWidth variant="contained" size="large"
              disabled={!file || loading} onClick={handleImport}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <BoltOutlined />}
              sx={{ 
                py: 1.5, background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)',
                fontWeight: 700, fontSize: 16, borderRadius: 2
              }}
            >
              {loading ? 'Processing Dataset...' : 'Start Import'}
            </Button>
          </>
        ) : (
          <Box sx={{ py: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
              <Typography variant="h5" color="#f0f9ff" fontWeight={800} gutterBottom>
                Import Successful
              </Typography>
              <Typography variant="body2" color="rgba(240,249,255,0.5)">
                Your data has been uploaded to the **Staging Area**. 
                You can now review, filter, and convert these records into Leads.
              </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 4 }}>
              {[
                { label: 'Total Records', value: result.total || result.inserted, color: '#0ea5e9' },
                { label: 'Status', value: 'Ready', color: '#10b981' },
                { label: 'Staged In', value: 'Scraper', color: '#f59e0b' },
                { label: 'Errors', value: result.errors || 0, color: '#ef4444' },
              ].map((stat, i) => (
                <Grid item xs={6} sm={3} key={i}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography variant="h6" color={stat.color} fontWeight={800}>{stat.value}</Typography>
                    <Typography variant="caption" color="rgba(240,249,255,0.3)">{stat.label}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Stack direction="row" spacing={2}>
              <Button
                fullWidth variant="contained" size="large"
                onClick={() => window.location.href = '/scraper'}
                sx={{ background: 'linear-gradient(135deg,#10b981,#059669)', fontWeight: 700 }}
              >
                Go to Staging Area
              </Button>
              <Button
                fullWidth variant="outlined" size="large"
                onClick={() => setResult(null)}
                sx={{ borderColor: 'rgba(14,165,233,0.3)', color: '#38bdf8' }}
              >
                Upload Another
              </Button>
            </Stack>
          </Box>
        )}
      </Card>

      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" color="#f0f9ff" fontWeight={700} gutterBottom sx={{ display:'flex', alignItems:'center', gap:1 }}>
          <InfoOutlined sx={{ fontSize: 18, color: '#38bdf8' }} /> Data Guidelines
        </Typography>
        <Typography variant="body2" color="rgba(240,249,255,0.3)">
          For best results, ensure your file includes columns such as <code>first_name</code>, <code>last_name</code>, 
          <code>email</code>, <code>company</code>, and <code>job_title</code>. Our system will attempt to auto-map 
          these fields. Any extra columns will be preserved as lead metadata.
        </Typography>
      </Box>
    </Box>
  );
}

