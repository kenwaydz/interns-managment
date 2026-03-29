import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Users, CheckCircle, Clock } from 'lucide-react';

export const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({ interns: 0, pendingTasks: 0, completedTasks: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                let internRes, taskRes;
                if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
                     internRes = await api.get('interns/');
                     taskRes = await api.get('tasks/');
                } else {
                     taskRes = await api.get('tasks/');
                }
                
                const taskData = taskRes ? taskRes.data : [];
                setStats({
                    interns: internRes ? internRes.data.length : 0,
                    pendingTasks: taskData.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length,
                    completedTasks: taskData.filter(t => t.status === 'COMPLETED').length
                });
            } catch (err) {
                console.error("Failed to load stats", err);
            }
        };
        fetchStats();
    }, [user]);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Overview</h1>
            </div>

            <div className="dashboard-grid">
                {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                    <div className="card stat-card">
                        <div className="stat-icon">
                            <Users size={24} />
                        </div>
                        <div className="stat-content">
                            <h3>Total Interns</h3>
                            <p>{stats.interns}</p>
                        </div>
                    </div>
                )}
                
                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Active Tasks</h3>
                        <p>{stats.pendingTasks}</p>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: '#D1FAE5', color: '#059669' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Completed Tasks</h3>
                        <p>{stats.completedTasks}</p>
                    </div>
                </div>
            </div>
            
            <div className="card" style={{marginTop: '2rem'}}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Welcome to IAMS</h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    Here you can manage your daily operational tasks. Use the sidebar to navigate to specific sections.
                </p>
                {user.role === 'INTERN' && (
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Make sure to check your Tasks board for new assignments from your supervisor.
                    </p>
                )}
            </div>
        </div>
    );
};
