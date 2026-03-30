import { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem,
  Button, Chip, Autocomplete, Collapse, IconButton, Slider, Grid,
} from '@mui/material';
import { TuneOutlined, ExpandMore, ExpandLess, ClearAll } from '@mui/icons-material';
import api from '../../utils/api';

const EMPTY = {
  search: '', industry: '', country: '', domain: '', keyword: '',
  job_title: '', company: '', email_domain: '',
  employee_size: '', score_min: 0, score_max: 100,
  date_from: '', date_to: '', status: '', source: '',
};

const inputSx = {
  '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff', fontSize: 13 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
  '& .MuiInputLabel-root': { color: 'rgba(240,249,255,0.4)', fontSize: 13 },
  '& .MuiSelect-icon': { color: 'rgba(240,249,255,0.4)' },
};

export default function FilterPanel({ onFilter, resultCount }) {
  const [f, setF] = useState(EMPTY);
  const [opts, setOpts] = useState({ industries: [], countries: [], jobTitles: [], companies: [], employeeSizes: [], sources: [] });
  const [open, setOpen] = useState(true);

  useEffect(() => {
    api.get('/leads/filter-options').then(r => {
      const data = r.data;
      if (data.companies) {
        data.companies = data.companies.map(c => typeof c === 'object' && c !== null ? (c.company_name || c.company || JSON.stringify(c)) : c);
        data.companies = [...new Set(data.companies)]; // Ensure uniqueness after stringifying
      }
      setOpts(data);
    }).catch(() => { });
  }, []);

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  const handleApply = () => {
    const active = Object.fromEntries(
      Object.entries(f).filter(([k, v]) => {
        if (k === 'score_min' && v === 0) return false;
        if (k === 'score_max' && v === 100) return false;
        return v !== '' && v !== null && v !== undefined;
      })
    );
    onFilter(active);
  };

  const handleReset = () => { setF(EMPTY); onFilter({}); };

  // ── Debounced auto-apply for keyword search ────────────────
  const debounceRef = useRef(null);
  const handleSearchChange = (val) => {
    set('keyword', val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const active = Object.fromEntries(
        Object.entries({ ...f, keyword: val }).filter(([k, v]) => {
          if (k === 'score_min' && v === 0) return false;
          if (k === 'score_max' && v === 100) return false;
          return v !== '' && v !== null && v !== undefined;
        })
      );
      onFilter(active);
    }, 400);
  };

  const activeCount = Object.entries(f).filter(([k, v]) => {
    if (k === 'score_min' && v === 0) return false;
    if (k === 'score_max' && v === 100) return false;
    return v !== '';
  }).length;

  const STATUSES = ['new', 'contacted', 'qualified', 'disqualified', 'converted'];

  return (
    <Card sx={{ borderRadius: 2.5, mb: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.12)' }}>
      <CardContent sx={{ pb: open ? 2 : '12px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: open ? 2.5 : 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TuneOutlined sx={{ color: '#0ea5e9', fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={700} color="#f0f9ff">
              Advanced Filters
            </Typography>
            {activeCount > 0 && (
              <Chip label={`${activeCount} active`} size="small"
                sx={{ height: 20, fontSize: 10, bgcolor: 'rgba(14,165,233,0.2)', color: '#38bdf8' }} />
            )}
            {resultCount !== undefined && (
              <Typography variant="caption" color="rgba(240,249,255,0.35)">
                {resultCount.toLocaleString()} results
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => setOpen(v => !v)}
            sx={{ color: 'rgba(240,249,255,0.4)' }}>
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={open}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth label="Keyword Search" placeholder="Across title, company, industry..."
                value={f.keyword} onChange={e => handleSearchChange(e.target.value)}
                size="small" sx={inputSx}
                onKeyDown={e => e.key === 'Enter' && handleApply()} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete freeSolo options={opts.jobTitles || []} value={f.job_title}
                onInputChange={(_, v) => set('job_title', v)}
                renderInput={p => <TextField {...p} label="Job Title" size="small" sx={inputSx} />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete freeSolo options={opts.companies || []} value={f.company}
                onInputChange={(_, v) => set('company', v)}
                renderInput={p => <TextField {...p} label="Company Name" size="small" sx={inputSx} />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth label="Email Domain" placeholder="e.g. gmail.com"
                value={f.email_domain} onChange={e => set('email_domain', e.target.value)}
                size="small" sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete freeSolo options={opts.industries || []} value={f.industry}
                onInputChange={(_, v) => set('industry', v)}
                renderInput={p => <TextField {...p} label="Industry" size="small" sx={inputSx} />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete freeSolo options={opts.countries || []} value={f.country}
                onInputChange={(_, v) => set('country', v)}
                renderInput={p => <TextField {...p} label="Country" size="small" sx={inputSx} />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth label="Status"
                value={f.status} onChange={e => set('status', e.target.value)}
                size="small" sx={inputSx}>
                <MenuItem value="">All statuses</MenuItem>
                {STATUSES.map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete freeSolo options={opts.sources || []} value={f.source}
                onInputChange={(_, v) => set('source', v)}
                renderInput={p => <TextField {...p} label="Source" size="small" sx={inputSx} />} />
            </Grid>

            {/* Score range */}
            <Grid item xs={12} md={6}>
              <Box sx={{ px: 1 }}>
                <Typography variant="caption" color="rgba(240,249,255,0.4)" mb={1} display="block">
                  Lead Score Range: {f.score_min} — {f.score_max}
                </Typography>
                <Slider
                  value={[f.score_min, f.score_max]}
                  onChange={(_, v) => { set('score_min', v[0]); set('score_max', v[1]); }}
                  min={0} max={100} size="small"
                  sx={{
                    color: '#0ea5e9',
                    '& .MuiSlider-thumb': { bgcolor: '#0ea5e9' },
                    '& .MuiSlider-track': { bgcolor: '#0ea5e9' },
                    '& .MuiSlider-rail': { bgcolor: 'rgba(14,165,233,0.2)' },
                  }}
                />
              </Box>
            </Grid>

            {/* Date range */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth label="Added From" type="date" size="small"
                value={f.date_from} onChange={e => set('date_from', e.target.value)}
                InputLabelProps={{ shrink: true }} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth label="Added To" type="date" size="small"
                value={f.date_to} onChange={e => set('date_to', e.target.value)}
                InputLabelProps={{ shrink: true }} sx={inputSx} />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
            <Button variant="contained" onClick={handleApply} size="small"
              sx={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 700 }}>
              Apply Filters
            </Button>
            <Button variant="outlined" onClick={handleReset} size="small" startIcon={<ClearAll />}
              sx={{
                borderColor: 'rgba(14,165,233,0.3)', color: '#38bdf8',
                '&:hover': { borderColor: '#0ea5e9', bgcolor: 'rgba(14,165,233,0.08)' }
              }}>
              Reset
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
