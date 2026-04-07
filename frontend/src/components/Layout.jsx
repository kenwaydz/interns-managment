import { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Users, LayoutDashboard, CheckSquare, LogOut, FileText } from 'lucide-react';

import logo from '../assets/logo.png';

const SidebarItem = ({ to, icon, label }) => (
    <NavLink 
        to={to} 
        className={({isActive}) => isActive ? "nav-item active" : "nav-item"}
    >
        {icon}
        <span>{label}</span>
    </NavLink>
);

export const Layout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logo} alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} /> 
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Internes Manager</span>
                </div>
                <nav className="sidebar-nav flex-col">
                    <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    
                    {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
                        <SidebarItem to="/interns" icon={<Users size={20} />} label="Interns" />
                    )}
                    
                    <SidebarItem to="/tasks" icon={<CheckSquare size={20} />} label="Tasks" />
                    <SidebarItem to="/evaluations" icon={<FileText size={20} />} label="Evaluations" />
                </nav>
            </aside>
            <main className="main-content">
                <header className="top-navbar">
                    <div style={{fontWeight: 500, color: 'var(--text-muted)'}}>
                        Welcome, {user?.username} ({user?.role})
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        <LogOut size={16} /> Logout
                    </button>
                </header>
                <div className="page-container animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
