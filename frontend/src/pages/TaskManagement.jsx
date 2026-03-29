import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export const TaskManagement = () => {
    const { user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [interns, setInterns] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', intern: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('tasks/');
                setTasks(res.data);
                
                if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
                    const internsRes = await api.get('interns/');
                    setInterns(internsRes.data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [user.role]);

    const updateStatus = async (taskId, newStatus) => {
        try {
            await api.patch(`tasks/${taskId}/`, { status: newStatus });
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('tasks/', newTask);
            setTasks([res.data, ...tasks]);
            setShowModal(false);
            setNewTask({ title: '', description: '', intern: '' });
        } catch (err) {
            console.error("Error creating task", err.response?.data || err);
            const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            alert(`API Error: ${msg}`);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            await api.delete(`tasks/${taskId}/`);
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (err) {
            console.error(err);
            alert("Error deleting task");
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            PENDING: 'badge badge-pending',
            IN_PROGRESS: 'badge badge-progress',
            COMPLETED: 'badge badge-completed'
        };
        return <span className={styles[status]}>{status.replace('_', ' ')}</span>;
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Task Board</h1>
                {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Task</button>
                )}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100}}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Create New Task</h2>
                        <form onSubmit={handleCreateTask}>
                            <div className="input-group">
                                <label>Title</label>
                                <input className="input-field" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                            </div>
                            <div className="input-group">
                                <label>Description</label>
                                <textarea className="input-field" rows="3" required value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                            </div>
                            <div className="input-group">
                                <label>Assign to Intern</label>
                                <select className="input-field" required value={newTask.intern} onChange={e => setNewTask({...newTask, intern: e.target.value})}>
                                    <option value="">Select an intern...</option>
                                    {interns.map(i => (
                                        <option key={i.id} value={i.id}>{i.user.first_name} {i.user.last_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-between" style={{marginTop: '1.5rem'}}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="dashboard-grid animate-fade-in">
                {tasks.map(task => (
                    <div key={task.id} className="card" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        <div>
                            <div className="flex justify-between items-center" style={{marginBottom: '0.5rem'}}>
                                <h3 style={{fontWeight: 600, fontSize: '1.125rem'}}>{task.title}</h3>
                                <StatusBadge status={task.status} />
                            </div>
                            <p style={{color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem'}}>{task.description}</p>
                            <div style={{fontSize: '0.875rem', fontWeight: 500}}>
                                Assignee: {task.intern_details?.user?.first_name || 'Intern'} {task.intern_details?.user?.last_name || ''}
                            </div>
                        </div>
                        
                        {user.role === 'INTERN' && task.status !== 'COMPLETED' && (
                            <div className="flex gap-2" style={{marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)'}}>
                                {task.status === 'PENDING' && (
                                    <button onClick={() => updateStatus(task.id, 'IN_PROGRESS')} className="btn btn-primary" style={{flex: 1, fontSize: '0.875rem'}}>
                                        Start Task
                                    </button>
                                )}
                                {task.status === 'IN_PROGRESS' && (
                                    <button onClick={() => updateStatus(task.id, 'COMPLETED')} className="btn" style={{flex: 1, fontSize: '0.875rem', background: 'var(--secondary)', color: 'white'}}>
                                        Mark Completed
                                    </button>
                                )}
                            </div>
                        )}
                        {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                            <div className="flex justify-between items-center" style={{marginTop: 'auto', paddingTop: '1rem'}}>
                                <button className="btn" style={{padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: '#fee2e2', color: '#b91c1c'}} onClick={() => handleDeleteTask(task.id)}>
                                    Delete
                                </button>
                                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right'}}>
                                    Assigned by: {task.supervisor_details?.user?.first_name || 'Supervisor'}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {tasks.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    No tasks found.
                </div>
            )}
        </div>
    );
};
