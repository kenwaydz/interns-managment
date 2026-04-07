import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export const InternManagement = () => {
    const { user } = useContext(AuthContext);
    const [interns, setInterns] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [departments, setDepartments] = useState([]);
    
    const [showModal, setShowModal] = useState(false);
    const [selectedIntern, setSelectedIntern] = useState(null);
    const [assignData, setAssignData] = useState({ supervisor: '', department: '' });

    useEffect(() => {
        const fetchInterns = async () => {
            try {
                const res = await api.get('interns/');
                setInterns(res.data);
                
                if (user?.role === 'ADMIN') {
                    const supRes = await api.get('supervisors/');
                    const depRes = await api.get('departments/');
                    setSupervisors(supRes.data);
                    setDepartments(depRes.data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchInterns();
    }, [user?.role]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this intern? This cannot be undone. All their tasks will also be dropped.")) return;
        try {
            await api.delete(`interns/${id}/`);
            setInterns(interns.filter(i => i.id !== id));
        } catch (err) {
            console.error(err);
            alert(`Error deleting intern: ${JSON.stringify(err.response?.data || err.message)}`);
        }
    };

    const openAssignModal = (intern) => {
        setSelectedIntern(intern);
        setAssignData({
            supervisor: intern.supervisor_details?.id || '',
            department: intern.department_details?.id || ''
        });
        setShowModal(true);
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                supervisor: assignData.supervisor || null,
                department: assignData.department || null
            };
            const res = await api.patch(`interns/${selectedIntern.id}/`, dataToSubmit);
            setInterns(interns.map(i => i.id === selectedIntern.id ? res.data : i));
            setShowModal(false);
        } catch (err) {
            console.error(err);
            alert(`Error assigning intern: ${JSON.stringify(err.response?.data || err.message)}`);
        }
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="page-title">Interns Management</h1>
                {user?.role === 'ADMIN' && (
                    <button 
                        className="btn btn-primary" 
                        onClick={async () => {
                            try {
                                const response = await api.get('interns/export_excel/', {
                                    responseType: 'blob',
                                });
                                // Create a download link for the blob
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `interns_report_${new Date().toISOString().split('T')[0]}.xlsx`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                window.URL.revokeObjectURL(url);
                            } catch (err) {
                                console.error('Download failed:', err);
                                // If the error response is a blob, we need to read it to see the error message
                                if (err.response?.data instanceof Blob) {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        try {
                                            const errorData = JSON.parse(reader.result);
                                            alert(`Download failed: ${errorData.error || 'Server error'}`);
                                        } catch (e) {
                                            alert('Download failed: Internal server error (500)');
                                        }
                                    };
                                    reader.readAsText(err.response.data);
                                } else {
                                    alert('Failed to connect to the server for download.');
                                }
                            }
                        }}
                    >
                        Download Excel Report
                    </button>
                )}
            </div>

            {showModal && selectedIntern && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100}}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Assign {selectedIntern.user.first_name}</h2>
                        <form onSubmit={handleAssign}>
                            <div className="input-group">
                                <label>Department</label>
                                <select className="input-field" value={assignData.department} onChange={e => setAssignData({...assignData, department: e.target.value})}>
                                    <option value="">No Department selected...</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Supervisor</label>
                                <select className="input-field" value={assignData.supervisor} onChange={e => setAssignData({...assignData, supervisor: e.target.value})}>
                                    <option value="">No Supervisor selected...</option>
                                    {supervisors.map(s => (
                                        <option key={s.id} value={s.id}>{s.user.first_name} {s.user.last_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-between" style={{marginTop: '1.5rem'}}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Assignment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="table-container animate-fade-in">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Major</th>
                            <th>Department</th>
                            <th>Supervisor</th>
                            <th>Timeline</th>
                            {user?.role === 'ADMIN' && <th style={{width: '200px'}}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {interns.map(intern => (
                            <tr key={intern.id}>
                                <td style={{fontWeight: 500}}>
                                    {intern.user.first_name || intern.user.username} {intern.user.last_name}<br/>
                                    <span style={{color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 400}}>{intern.user.email}</span>
                                </td>
                                <td>{intern.major || '-'}</td>
                                <td>
                                    <span className="badge" style={{background: 'var(--background)'}}>{intern.department_details?.name || 'Unassigned'}</span>
                                </td>
                                <td>{intern.supervisor_details?.user?.first_name || 'Unassigned'}</td>
                                <td style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
                                    {intern.start_date || '-'} <br/>to {intern.end_date || '-'}
                                </td>
                                {user?.role === 'ADMIN' && (
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn" style={{padding: '0.5rem', fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1'}} onClick={() => openAssignModal(intern)}>Assign</button>
                                            <button className="btn" style={{padding: '0.5rem', fontSize: '0.75rem', background: '#fee2e2', color: '#b91c1c'}} onClick={() => handleDelete(intern.id)}>Delete</button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {interns.length === 0 && (
                            <tr>
                                <td colSpan={user?.role === 'ADMIN' ? "6" : "5"} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                    No interns found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
