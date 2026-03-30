import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Tooltip,
  Divider, Chip, Badge, useMediaQuery, useTheme, Menu, MenuItem,
} from '@mui/material';
import {
  Dashboard, PeopleAlt, TravelExplore, BarChart,
  Settings, Logout, MenuOpen, Menu as MenuIcon,
  BoltOutlined, Group, NotificationsNoneOutlined,
  CloudUploadOutlined, Insights, Close,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const DRAWER_W = 248;

const getNavItems = (role) => {
  const nav = [
    { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { label: 'Leads', path: '/leads', icon: <PeopleAlt /> },
    { label: 'Data Staging', path: '/scraper', icon: <TravelExplore /> },
    { label: 'Global Insights', path: '/insights', icon: <Insights /> },
  ];

  return nav;
};

const getAdminItems = (role) => {
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = isSuperAdmin || role === 'admin';
  const isManager = isAdmin || role === 'manager';

  const items = [];
  if (isAdmin) {
    items.push({ label: 'Keyword Intel', path: '/keywords', icon: <BarChart /> });
  }
  if (isAdmin) {
    items.push({ label: 'Team Overview', path: '/team', icon: <Group /> });
  }
  return items;
};

const RoleBadge = ({ role }) => (
  <Chip label={role} size="small"
    sx={{
      height: 18, fontSize: 10, textTransform: 'capitalize',
      bgcolor: role === 'admin' ? 'rgba(239,68,68,0.15)' : 'rgba(14,165,233,0.15)',
      color: role === 'admin' ? '#f87171' : '#38bdf8',
      border: `1px solid ${role === 'admin' ? 'rgba(239,68,68,0.3)' : 'rgba(14,165,233,0.3)'}`,
    }}
  />
);

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [collapsed, setC] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dw = collapsed ? 66 : DRAWER_W;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifAnchor, setNotifAnchor] = useState(null);

  useEffect(() => {
    let active = true;
    let lastChecked = new Date().toISOString();

    const fetchRecentLeads = async () => {
      try {
        const { data } = await api.get('/leads?limit=5&sort=created_at&order=desc');
        if (active && data?.data) {
          setNotifications(data.data.slice(0, 5));
        }
      } catch (err) {}
    };
    fetchRecentLeads();

    const intervalId = setInterval(async () => {
      try {
        const { data } = await api.get('/leads?limit=5&sort=created_at&order=desc');
        if (active && data?.data) {
           const newLeads = data.data.filter(l => new Date(l.created_at) > new Date(lastChecked));
           if (newLeads.length > 0) {
             setNotifications(prev => {
                const combined = [...newLeads, ...prev];
                const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                return unique.slice(0, 5); 
             });
             setUnreadCount(prev => prev + newLeads.length);
             lastChecked = new Date().toISOString();
           }
        }
      } catch (err) {}
    }, 60000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleNotifClick = () => {
    setUnreadCount(0);
    setNotifAnchor(null);
    nav('/insights');
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const min = Math.floor((new Date() - new Date(dateStr)) / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr/24)}d ago`;
  };

  const handleNavClick = (path) => {
    nav(path);
    if (isMobile) setMobileOpen(false);
  };

  const NavItem = ({ item }) => {
    const active = location.pathname.startsWith(item.path);
    return (
      <Tooltip title={collapsed && !isMobile ? item.label : ''} placement="right">
        <ListItemButton onClick={() => handleNavClick(item.path)} sx={{
          mx: 1, mb: 0.5, borderRadius: 2,
          bgcolor: active ? 'rgba(14,165,233,0.15)' : 'transparent',
          color: active ? '#38bdf8' : 'rgba(255,255,255,0.55)',
          '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 40 },
          '&:hover': { bgcolor: active ? 'rgba(14,165,233,0.18)' : 'rgba(255,255,255,0.06)', color: '#f0f9ff' },
          transition: 'all 0.15s',
          borderLeft: active ? '2px solid #0ea5e9' : '2px solid transparent',
        }}>
          <ListItemIcon>{item.icon}</ListItemIcon>
          {(!collapsed || isMobile) && (
            <ListItemText primary={item.label}
              primaryTypographyProps={{ fontSize: 13.5, fontWeight: active ? 600 : 400 }} />
          )}
        </ListItemButton>
      </Tooltip>
    );
  };

  const drawerContent = (
    <>
      {/* Logo */}
      <Box sx={{ px: 2, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
            background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BoltOutlined sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          {(!collapsed || isMobile) && (
            <Typography variant="h6" fontWeight={800} color="#f0f9ff"
              sx={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
              NexLead
            </Typography>
          )}
        </Box>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1 }} />

      <List dense sx={{ flex: 1, pt: 0.5 }}>
        {getNavItems(user?.role).map(i => <NavItem key={i.path} item={i} />)}

        {getAdminItems(user?.role).length > 0 && (
          <>
            {(!collapsed || isMobile) && (
              <Typography variant="caption" sx={{
                px: 2.5, py: 1.5, display: 'block', color: 'rgba(255,255,255,0.25)',
                textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10,
              }}>Admin</Typography>
            )}
            {getAdminItems(user?.role).map(i => <NavItem key={i.path} item={i} />)}
          </>
        )}
      </List>

      {/* User section */}
      {(!collapsed || isMobile) && (
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#0369a1', fontSize: 14, fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} color="#f0f9ff" noWrap>
                {user?.name}
              </Typography>
              <RoleBadge role={user?.role} />
            </Box>
            <Tooltip title="Sign out">
              <IconButton size="small" onClick={logout} sx={{ color: 'rgba(255,255,255,0.4)' }}>
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#060d1a' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Drawer variant="permanent" sx={{
          width: dw, flexShrink: 0, transition: 'width 0.2s',
          '& .MuiDrawer-paper': {
            width: dw, overflow: 'hidden', transition: 'width 0.2s',
            bgcolor: '#0a1628',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          },
        }}>
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_W, bgcolor: '#0a1628',
              borderRight: '1px solid rgba(255,255,255,0.06)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Topbar */}
        <AppBar position="sticky" elevation={0} sx={{
          bgcolor: 'rgba(6,13,26,0.9)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Toolbar variant="dense" sx={{ minHeight: 52 }}>
            <IconButton size="small"
              onClick={() => isMobile ? setMobileOpen(true) : setC(v => !v)}
              sx={{ color: 'rgba(255,255,255,0.5)', mr: 1 }}>
              {isMobile ? <MenuIcon /> : (collapsed ? <MenuIcon /> : <MenuOpen />)}
            </IconButton>
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Notifications">
              <IconButton 
                size="small" 
                onClick={(e) => setNotifAnchor(e.currentTarget)}
                sx={{ color: 'rgba(255,255,255,0.4)', mr: 1 }}
              >
                <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 9 } }}>
                  <NotificationsNoneOutlined fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={notifAnchor}
              open={Boolean(notifAnchor)}
              onClose={() => setNotifAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  mt: 1.5, width: 280, borderRadius: 2, bgcolor: '#0d1f3c',
                  border: '1px solid rgba(14,165,233,0.2)', color: '#f0f9ff',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                }
              }}
            >
              <Typography variant="subtitle2" sx={{ px: 2, py: 1.5, fontWeight: 700, color: '#f0f9ff' }}>
                Recent Leads Activity
              </Typography>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              {notifications.length === 0 ? (
                <MenuItem sx={{ py: 3, justifyContent: 'center', pointerEvents: 'none' }}>
                  <Typography variant="body2" color="rgba(255,255,255,0.4)">No recent leads.</Typography>
                </MenuItem>
              ) : (
                notifications.map(n => (
                  <MenuItem key={n.id} onClick={handleNotifClick} sx={{ 
                    whiteSpace: 'normal', py: 1.5, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    borderBottom: '1px solid rgba(255,255,255,0.04)', '&:hover': { bgcolor: 'rgba(14,165,233,0.1)' }
                  }}>
                    <Typography variant="body2" fontWeight={600} color="#38bdf8" mb={0.5}>
                      New lead added: {n.first_name || ''} {n.last_name || ''}
                    </Typography>
                    <Typography variant="caption" color="rgba(240,249,255,0.6)" display="block">
                      {n.company || n.domain || 'Unknown Company'}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 0.5 }}>
                      <Typography variant="caption" color="rgba(255,255,255,0.3)">
                        Added By: {n.createdByName || 'System'}
                      </Typography>
                      <Typography variant="caption" color="#10b981">
                        {timeAgo(n.created_at || n.createdAt)}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Menu>
            <Avatar sx={{ width: 30, height: 30, bgcolor: '#0369a1', fontSize: 12, fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
