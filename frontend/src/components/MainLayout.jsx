// src/components/MainLayout.jsx
import { useState } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'; // Um bom ícone para transferência
import PeopleIcon from '@mui/icons-material/People'; // Ícone para Clientes
import PaymentIcon from '@mui/icons-material/Payment'; //Icone de forma pagamentos
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'; // Ícone para Vendas
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // Ícone para Cargos
import GroupIcon from '@mui/icons-material/Group'; //icone para utilizadores- usuarios


const drawerWidth = 240;

function MainLayout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { logout } = useAuth();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawerItems = (
        <div>
            <Toolbar />
            <Divider />
            <List>
                {/* --- NOVO ITEM DE MENU DashBoard --- */}
                <ListItem disablePadding component={NavLink} to="/" style={{color: 'inherit'}}>
                    <ListItemButton>
                        <ListItemIcon><DashboardIcon /></ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                </ListItem>
                {/* --- NOVO ITEM DE MENU Entrada de Peixes --- */}
                <ListItem disablePadding component={NavLink} to="/entradas" style={{color: 'inherit'}}>
                    <ListItemButton>
                        <ListItemIcon><AddShoppingCartIcon /></ListItemIcon>
                        <ListItemText primary="Entrada de Peixes" />
                    </ListItemButton>
                </ListItem>
                {/* --- NOVO ITEM DE MENU transferencia --- */}
                <ListItem disablePadding component={NavLink} to="/manejos/transferencia" style={{color: 'inherit'}}>
                    <ListItemButton>
                        <ListItemIcon><CompareArrowsIcon /></ListItemIcon>
                        <ListItemText primary="Transferência" />
                    </ListItemButton>
                </ListItem>
                {/* --- NOVO ITEM DE MENU Clientes --- */}
                <ListItem disablePadding component={NavLink} to="/clientes" style={{color: 'inherit'}}>
                    <ListItemButton>
                        <ListItemIcon><PeopleIcon /></ListItemIcon>
                        <ListItemText primary="Clientes" />
                    </ListItemButton>
                </ListItem>
                {/* --- NOVO ITEM DE MENU VENDAS --- */}
                <ListItem disablePadding component={NavLink} to="/vendas" style={{color: 'inherit'}}>
                    <ListItemButton>
                        <ListItemIcon><PointOfSaleIcon /></ListItemIcon>
                        <ListItemText primary="Vendas" />
                    </ListItemButton>
                </ListItem>
                {/* --- NOVO ITEM DE MENU Pagamentos --- */}
                <ListItem disablePadding component={NavLink} to="/formas-pagamento" style={{color: 'inherit'}}>
                    <ListItemButton>
                        <ListItemIcon><PaymentIcon /></ListItemIcon>
                        <ListItemText primary="Forma de Pagamentos" />
                    </ListItemButton>
                </ListItem>
                {/* --- NOVO ITEM DE MENU utilizadores - usuarios --- */}
                <ListItem disablePadding component={NavLink} to="/usuarios" style={{color: 'inherit'}}>
                    <ListItemButton>
                        <ListItemIcon><GroupIcon /></ListItemIcon>
                        <ListItemText primary="Utilizadores" />
                    </ListItemButton>
                </ListItem>
                {/* --- NOVO ITEM DE MENU Cargos e Permissoes --- */}
                <ListItem disablePadding component={NavLink} to="/cargos" style={{color: 'inherit'}}>
                    <ListItemButton>
                        <ListItemIcon><AdminPanelSettingsIcon /></ListItemIcon>
                        <ListItemText primary="Cargos e Permissões" />
                    </ListItemButton>
                </ListItem>
            </List>
            <Divider />
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Piscis Control
                    </Typography>
                    <Button color="inherit" onClick={logout}>Sair</Button>
                </Toolbar>
            </AppBar>
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
                >
                    {drawerItems}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
                    open
                >
                    {drawerItems}
                </Drawer>
            </Box>
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}

export default MainLayout;