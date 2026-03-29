import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export const Evaluations = () => {
    const { user } = useContext(AuthContext);
    const [evaluations, setEvaluations] = useState([]);
    const [interns, setInterns] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newEval, setNewEval] = useState({ intern: '', score: '', feedback: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('evaluations/');
                setEvaluations(res.data);

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

    const handleCreateEval = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('evaluations/', newEval);
            setEvaluations([res.data, ...evaluations]);
            setShowModal(false);
            setNewEval({ intern: '', score: '', feedback: '' });
        } catch (err) {
            console.error("Error creating evaluation", err.response?.data || err);
            const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            alert(`API Error: ${msg}`);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Performance Evaluations</h1>
                {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>New Evaluation</button>
                )}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Create Evaluation</h2>
                        <form onSubmit={handleCreateEval}>
                            <div className="input-group">
                                <label>Intern</label>
                                <select className="input-field" required value={newEval.intern} onChange={e => setNewEval({ ...newEval, intern: e.target.value })}>
                                    <option value="">Select an intern...</option>
                                    {interns.map(i => (
                                        <option key={i.id} value={i.id}>{i.user.first_name} {i.user.last_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Score (1-10)</label>
                                <input type="number" min="1" max="10" className="input-field" required value={newEval.score} onChange={e => setNewEval({ ...newEval, score: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Feedback</label>
                                <textarea className="input-field" rows="4" required value={newEval.feedback} onChange={e => setNewEval({ ...newEval, feedback: e.target.value })} />
                            </div>
                            <div className="flex justify-between" style={{ marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Evaluation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="table-container animate-fade-in">
                <table>
                    <thead>
                        <tr>
                            <th>Intern</th>
                            <th>Evaluator</th>
                            <th>Score (/10)</th>
                            <th>Feedback</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {evaluations.map(ev => (
                            <tr key={ev.id}>
                                <td style={{fontWeight: 500}}>
                                    {ev.intern_details?.user?.first_name} {ev.intern_details?.user?.last_name}
                                </td>
                                <td style={{color: 'var(--text-muted)'}}>
                                    {ev.supervisor_details?.user?.first_name} {ev.supervisor_details?.user?.last_name}
                                </td>
                                <td>
                                    <span style={{
                                        background: ev.score >= 7 ? '#D1FAE5' : ev.score >= 5 ? '#FEF3C7' : '#FEE2E2',
                                        color: ev.score >= 7 ? '#059669' : ev.score >= 5 ? '#D97706' : '#B91C1C',
                                        padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: 600, fontSize: '0.875rem'
                                    }}>
                                        {ev.score}
                                    </span>
                                </td>
                                <td style={{maxWidth: '300px'}}>{ev.feedback}</td>
                                <td style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>
                                    {new Date(ev.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {evaluations.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                    No evaluations found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
