import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Switch, IconButton,
  CircularProgress, Avatar, LinearProgress, Tooltip,
} from '@mui/material';
import {
  PersonAdd, Visibility, EditOutlined, DeleteOutline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const cellSx = { borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#e2f4ff', py: 1.2, px: 2 };
const headSx = {
  ...cellSx, bgcolor: '#0a1628', color: 'rgba(240,249,255,0.4)', fontWeight: 700,
  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em'
};
const inputSx = {
  mb: 2,
  '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2f4ff' },
  '& .MuiInputLabel-root': { color: 'rgba(240,249,255,0.4)' },
};

export default function TeamPage() {
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setL] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [saving, setSav] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => {
    setL(true);
    api.get('/admin/employees')
      .then(r => setUsers(r.data.employees))
      .catch(() => {
        // Fallback to auth/users if admin endpoint isn't available
        api.get('/auth/users').then(r => setUsers(r.data.users)).catch(() => toast.error('Load failed'));
      })
      .finally(() => setL(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('All fields required');
    setSav(true);
    try {
      await api.post('/auth/users', form);
      toast.success('Employee created');
      setOpen(false); setForm({ name: '', email: '', password: '', role: 'employee' }); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create employee'); }
    finally { setSav(false); }
  };

  const toggle = async (u) => {
    try {
      await api.patch(`/auth/users/${u.id}`, { is_active: !u.is_active });
      toast.success(`${u.name} ${u.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch { toast.error('Update failed'); }
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setSav(true);
    try {
      await api.patch(`/auth/users/${editUser.id}`, { role: editUser.role, is_active: editUser.is_active });
      toast.success('Employee updated');
      setEditOpen(false); setEditUser(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Update failed'); }
    finally { setSav(false); }
  };

  const handleDelete = async (u) => {
    try {
      await api.delete(`/auth/users/${u.id}`);
      toast.success(`${u.name} deleted`);
      setDeleteConfirm(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  };

  const maxLeads = Math.max(...users.map(u => +u.totalLeads || +u.leads_count || 0), 1);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#f0f9ff" sx={{ fontFamily: 'Georgia, serif' }}>
            Team Overview
          </Typography>
          <Typography variant="body2" color="rgba(240,249,255,0.35)">
            Manage team members and monitor performance
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setOpen(true)}
          sx={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 700 }}>
          Add Employee
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2.5, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.1)' }}>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                {['Employee', 'Role', 'Status', 'Total Leads', 'Total Imported', 'Last Login', 'Actions'].map(h => (
                  <TableCell key={h} sx={headSx}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, borderBottom: 'none' }}>
                  <CircularProgress sx={{ color: '#0ea5e9' }} />
                </TableCell></TableRow>
                : users.map(u => (
                  <TableRow key={u.id} sx={{
                    '&:hover': { bgcolor: 'rgba(14,165,233,0.04)' },
                    transition: 'background-color 0.15s',
                  }}>
                    <TableCell sx={cellSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#0369a1', fontSize: 14, fontWeight: 700 }}>
                          {u.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} color="#f0f9ff" sx={{ whiteSpace: 'nowrap' }}>{u.name}</Typography>
                          <Typography variant="caption" color="rgba(240,249,255,0.35)" sx={{ whiteSpace: 'nowrap' }}>{u.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                      <Chip label={u.role} size="small"
                        sx={{
                          bgcolor: u.role === 'admin' ? 'rgba(239,68,68,0.15)' : 'rgba(14,165,233,0.15)',
                          color: u.role === 'admin' ? '#f87171' : '#38bdf8',
                          border: `1px solid ${u.role === 'admin' ? 'rgba(239,68,68,0.3)' : 'rgba(14,165,233,0.3)'}`,
                          fontSize: 10, height: 20
                        }} />
                    </TableCell>
                    <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                      <Chip label={u.is_active ? 'Active' : 'Inactive'} size="small"
                        sx={{
                          bgcolor: u.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                          color: u.is_active ? '#10b981' : '#9ca3af', fontSize: 10, height: 20
                        }} />
                    </TableCell>
                    <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" fontWeight={600} color="#0ea5e9">
                        {u.totalLeads ?? u.leads_count ?? 0}
                      </Typography>
                      <LinearProgress variant="determinate"
                        value={(+(u.totalLeads ?? u.leads_count) || 0) / maxLeads * 100}
                        sx={{
                          mt: 0.5, height: 2, borderRadius: 2,
                          bgcolor: 'rgba(14,165,233,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#0ea5e9' }
                        }} />
                    </TableCell>
                    <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" fontWeight={600} color="#8b5cf6">
                        {u.totalImports ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                      <Typography variant="caption" color="rgba(240,249,255,0.35)">
                        {u.last_login
                          ? formatDistanceToNow(new Date(u.last_login), { addSuffix: true })
                          : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => nav(`/employee/${u.id}`)}
                          sx={{ color: '#38bdf8', mr: 0.5 }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small"
                          onClick={() => { setEditUser({ ...u }); setEditOpen(true); }}
                          sx={{ color: '#f59e0b', mr: 0.5 }}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small"
                          onClick={() => setDeleteConfirm(u)}
                          sx={{ color: '#ef4444' }}>
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create Employee Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.2)' } }}>
        <DialogTitle sx={{ color: '#f0f9ff', fontWeight: 700 }}>Add New Employee</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField fullWidth label="Full Name *" size="small" sx={inputSx}
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextField fullWidth label="Email *" type="email" size="small" sx={inputSx}
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <TextField fullWidth label="Password *" type="password" size="small" sx={inputSx}
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <TextField fullWidth label="Role" select size="small" sx={inputSx}
              value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="marketing">Marketing</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'rgba(240,249,255,0.5)' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}
            sx={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Create Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.2)' } }}>
        <DialogTitle sx={{ color: '#f0f9ff', fontWeight: 700 }}>Edit Employee</DialogTitle>
        <DialogContent>
          {editUser && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="rgba(240,249,255,0.6)" mb={2}>
                {editUser.name} ({editUser.email})
              </Typography>
              <TextField fullWidth label="Role" select size="small" sx={inputSx}
                value={editUser.role} onChange={e => setEditUser(u => ({ ...u, role: e.target.value }))}>
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="rgba(240,249,255,0.6)">Active</Typography>
                <Switch size="small" checked={editUser.is_active}
                  onChange={() => setEditUser(u => ({ ...u, is_active: !u.is_active }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#0ea5e9' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#0ea5e9' }
                  }} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: 'rgba(240,249,255,0.5)' }}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}
            sx={{ background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0d1f3c', border: '1px solid rgba(239,68,68,0.2)' } }}>
        <DialogTitle sx={{ color: '#f87171', fontWeight: 700 }}>Delete Employee</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="rgba(240,249,255,0.6)">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ color: 'rgba(240,249,255,0.5)' }}>Cancel</Button>
          <Button variant="contained" onClick={() => handleDelete(deleteConfirm)}
            sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, fontWeight: 700 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
