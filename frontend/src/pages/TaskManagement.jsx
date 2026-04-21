import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { MessageSquare, Send } from 'lucide-react';

export const TaskManagement = () => {
    const { user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [interns, setInterns] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', intern: '' });
    const [taskReports, setTaskReports] = useState({});
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState({});
    const [expandedComments, setExpandedComments] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('tasks/');
                setTasks(res.data);
                
                if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
                    const internsRes = await api.get('interns/');
                    setInterns(internsRes.data);
                }

                const commentsRes = await api.get('task-comments/');
                const commentsMap = {};
                commentsRes.data.forEach(c => {
                    if (!commentsMap[c.task]) commentsMap[c.task] = [];
                    commentsMap[c.task].push(c);
                });
                setComments(commentsMap);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [user.role]);

    const updateStatus = async (taskId, newStatus, reportText = "") => {
        try {
            const payload = { status: newStatus };
            if (reportText) {
                payload.report = reportText;
            }
            const res = await api.patch(`tasks/${taskId}/`, payload);
            setTasks(tasks.map(t => t.id === taskId ? res.data : t));
        } catch (err) {
            console.error(err);
        }
    };
    
    const handleReportChange = (taskId, text) => {
        setTaskReports({ ...taskReports, [taskId]: text });
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

    const handleAddComment = async (taskId) => {
        const text = newComment[taskId];
        if (!text || text.trim() === '') return;

        try {
            const res = await api.post('task-comments/', { task: taskId, content: text });
            const updatedComments = { ...comments };
            if (!updatedComments[taskId]) updatedComments[taskId] = [];
            updatedComments[taskId].push(res.data);
            setComments(updatedComments);
            setNewComment({ ...newComment, [taskId]: '' });
        } catch (err) {
            console.error(err);
            alert("Failed to post comment");
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
                    <div key={task.id} className="card" style={{display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem'}}>
                        <div>
                            <div className="flex justify-between items-center" style={{marginBottom: '0.5rem'}}>
                                <h3 style={{fontWeight: 600, fontSize: '1.125rem'}}>{task.title}</h3>
                                <StatusBadge status={task.status} />
                            </div>
                            <p style={{color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem'}}>{task.description}</p>
                            
                            {task.report && (
                                <div style={{marginBottom: '1rem', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)'}}>
                                    <h4 style={{fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.25rem'}}>Intern's Report</h4>
                                    <p style={{fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'var(--text-color)'}}>{task.report}</p>
                                </div>
                            )}

                            <div style={{fontSize: '0.875rem', fontWeight: 500}}>
                                Assignee: {task.intern_details?.user?.first_name || 'Intern'} {task.intern_details?.user?.last_name || ''}
                            </div>
                        </div>
                        
                        {user.role === 'INTERN' && task.status !== 'COMPLETED' && (
                            <div className="flex gap-2" style={{borderTop: '1px solid var(--border)', paddingTop: '0.5rem'}}>
                                {task.status === 'PENDING' && (
                                    <button onClick={() => updateStatus(task.id, 'IN_PROGRESS')} className="btn btn-primary" style={{flex: 1, fontSize: '0.875rem'}}>
                                        Start Task
                                    </button>
                                )}
                                {task.status === 'IN_PROGRESS' && (
                                    <div className="flex gap-2 flex-col" style={{flex: 1}}>
                                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Optional: Task Completion Report</div>
                                        <textarea 
                                            rows="3"
                                            className="input-field"
                                            placeholder="Describe what you accomplished..."
                                            value={taskReports[task.id] || ''}
                                            onChange={e => handleReportChange(task.id, e.target.value)} 
                                            style={{fontSize: '0.875rem', resize: 'vertical'}} 
                                        />
                                        <button onClick={() => updateStatus(task.id, 'COMPLETED', taskReports[task.id])} className="btn" style={{fontSize: '0.875rem', background: 'var(--secondary)', color: 'white', marginTop: '0.5rem'}}>
                                            Mark Completed
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Comments Section */}
                        <div className="mt-auto border-t pt-3" style={{borderColor: 'var(--border)'}}>
                            <button 
                                className="flex items-center gap-2 text-sm text-blue-600 font-medium w-full text-left" 
                                onClick={() => setExpandedComments({...expandedComments, [task.id]: !expandedComments[task.id]})}
                            >
                                <MessageSquare size={16} />
                                {comments[task.id]?.length || 0} {comments[task.id]?.length === 1 ? 'Comment' : 'Comments'}
                            </button>

                            {expandedComments[task.id] && (
                                <div className="mt-3 flex flex-col gap-3">
                                    <div className="max-h-40 overflow-y-auto pr-1 flex flex-col gap-2">
                                        {(comments[task.id] || []).map(comment => (
                                            <div key={comment.id} className={`p-2 rounded-lg text-sm bg-gray-50 border border-gray-100`}>
                                                <div className="font-semibold text-xs text-gray-600 mb-1">
                                                    {comment.author_details?.first_name} {comment.author_details?.last_name}
                                                </div>
                                                <div className="text-gray-800 break-words">{comment.content}</div>
                                            </div>
                                        ))}
                                        {(!comments[task.id] || comments[task.id].length === 0) && (
                                            <div className="text-xs text-gray-500 italic text-center py-2">No comments yet.</div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            className="input-field text-sm py-1.5 px-3 flex-1" 
                                            placeholder="Write a comment..." 
                                            value={newComment[task.id] || ''}
                                            onChange={e => setNewComment({...newComment, [task.id]: e.target.value})}
                                            onKeyDown={e => e.key === 'Enter' && handleAddComment(task.id)}
                                        />
                                        <button className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition" onClick={() => handleAddComment(task.id)}>
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                            <div className="flex justify-between items-center" style={{paddingTop: '0.5rem'}}>
                                <button className="text-xs text-red-600 hover:text-red-800 font-medium" onClick={() => handleDeleteTask(task.id)}>
                                    Delete Task
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
