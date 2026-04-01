import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Autocomplete, Chip, CircularProgress,
  MenuItem, Box, Typography,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { COUNTRIES } from '../../utils/countries';

const EMPTY = {
  first_name: '', last_name: '', email: '', phone: '', linkedin: '', company: '', job_title: '',
  website: '', industry: '', country: '', city: '', client_description: '',
  keyword: '', source: '', status: 'new', custom_source: '',
};

const inputSx = {
  '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff', fontSize: 13 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
  '& .MuiInputLabel-root': { color: 'rgba(240,249,255,0.4)', fontSize: 13 },
};


const STATUSES = ['new', 'contacted', 'qualified', 'disqualified', 'converted'];

export default function LeadForm({ open, onClose, onSaved, lead }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setL] = useState(false);
  const [enriching, setE] = useState(false);
  const isEdit = !!lead?.id;

  useEffect(() => {
    let initial = EMPTY;
    if (lead) {
      initial = { ...EMPTY, ...lead };
      
      // Handle legacy leads that only have full name
      if (initial.name && !initial.first_name && !initial.last_name) {
        const parts = initial.name.split(' ');
        initial.first_name = parts[0] || '';
        initial.last_name = parts.slice(1).join(' ') || '';
      }

      if (typeof initial.company === 'object' && initial.company !== null) {
        initial.company = initial.company.company_name || initial.company.company || JSON.stringify(initial.company);
      }
      
      const predefinedSources = ['', 'Apify', 'Apollo', 'LinkedIn', 'Manual', 'Import', 'Web Scrape', 'Referral', 'Other'];
      if (initial.source && !predefinedSources.includes(initial.source)) {
        initial.custom_source = initial.source;
        initial.source = 'Other';
      }
    }
    setForm(initial);
  }, [lead, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.first_name?.trim()) return toast.error('First Name is required');
    if (!form.email?.trim()) return toast.error('Email is required');
    if (!form.company?.trim()) return toast.error('Company Name is required');
    if (!form.job_title?.trim()) return toast.error('Job Title is required');
    if (!form.country?.trim()) return toast.error('Country is required');
    if (!form.keyword?.trim()) return toast.error('Keyword is required');
    setL(true);

    const payload = { ...form };
    if (payload.source === 'Other' && payload.custom_source?.trim()) {
      payload.source = payload.custom_source.trim();
    }
    delete payload.custom_source;

    try {
      if (isEdit) {
        const { data } = await api.put(`/leads/${lead.id}`, payload);
        toast.success('Lead updated');
        onSaved(data.lead);
      } else {
        const { data } = await api.post('/leads', payload);
        toast.success('Lead added — enrichment queued');
        onSaved(data.lead);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setL(false); }
  };

  const handleEnrich = async () => {
    if (!isEdit) return;
    setE(true);
    try {
      await api.post(`/leads/${lead.id}/enrich`);
      toast.success('Enrichment queued');
    } catch { toast.error('Enrich failed'); }
    finally { setE(false); }
  };

  const F = (key, label, extra = {}) => (
    <TextField fullWidth label={label} value={form[key] || ''}
      onChange={e => set(key, e.target.value)} size="small" sx={inputSx} {...extra} />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.2)' } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700} color="#f0f9ff">
            {isEdit ? 'Edit Lead' : 'Add New Lead'}
          </Typography>
          {isEdit && (
            <Button size="small" startIcon={enriching ? <CircularProgress size={14} /> : null}
              onClick={handleEnrich} disabled={enriching}
              sx={{
                color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)',
                '&:hover': { bgcolor: 'rgba(245,158,11,0.1)' }
              }}
              variant="outlined">
              Re-Enrich
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {/* Company section */}
          <Grid item xs={12}>
            <Typography variant="caption" color="rgba(14,165,233,0.8)"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Company
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>{F('company', 'Company *')}</Grid>
          <Grid item xs={12} sm={6}>{F('job_title', 'Job Title *', { placeholder: 'e.g. CEO' })}</Grid>
          <Grid item xs={12} sm={6}>{F('website', 'Website URL')}</Grid>
          <Grid item xs={12} sm={6}>{F('industry', 'Industry')}</Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={COUNTRIES}
              value={form.country || ''}
              onChange={(_, val) => set('country', val || '')}
              renderInput={(p) => <TextField {...p} label="Country *" size="small" sx={inputSx} />}
            />
          </Grid>

          {/* Contact section */}
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="caption" color="rgba(14,165,233,0.8)"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Contact Person
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>{F('first_name', 'First Name *')}</Grid>
          <Grid item xs={12} sm={6}>{F('last_name', 'Last Name')}</Grid>
          <Grid item xs={12} sm={6}>{F('email', 'Email *', { type: 'email' })}</Grid>
          <Grid item xs={12} sm={6}>{F('phone', 'Phone')}</Grid>
          <Grid item xs={12} sm={6}>{F('linkedin', 'LinkedIn URL')}</Grid>

          {/* Intelligence */}
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="caption" color="rgba(14,165,233,0.8)"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Intelligence
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            {F('keyword', 'Keyword *')}
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Status" select value={form.status || 'new'}
              onChange={e => set('status', e.target.value)} size="small" sx={inputSx}>
              {STATUSES.map(s => (
                <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Source" select value={form.source || ''}
              onChange={e => set('source', e.target.value)} size="small" sx={inputSx}>
              {['', 'Apify', 'Apollo', 'LinkedIn', 'Manual', 'Import', 'Web Scrape', 'Referral', 'Other']
                .map(s => <MenuItem key={s} value={s}>{s || 'Select source'}</MenuItem>)}
            </TextField>
            {form.source === 'Other' && (
              <Box mt={1}>
                {F('custom_source', 'Enter custom source')}
              </Box>
            )}
          </Grid>
          <Grid item xs={12}>
            {F('client_description', 'Client Description', { multiline: true, rows: 2 })}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Button onClick={onClose} disabled={loading}
          sx={{ color: 'rgba(240,249,255,0.5)' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}
          sx={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 700, minWidth: 120 }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : (isEdit ? 'Save Changes' : 'Add Lead')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
