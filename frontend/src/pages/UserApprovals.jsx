import { useState, useEffect } from 'react';
import api from '../services/api';

export const UserApprovals = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('approvals/');
            const data = res.data.results || res.data;
            setPendingUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch pending users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await api.post(`approvals/${userId}/approve/`);
            setMessage({ type: 'success', text: 'User approved successfully!' });
            fetchPendingUsers();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to approve user.' });
        }
    };

    const handleReject = async (userId) => {
        if (window.confirm("Are you sure you want to reject and delete this registration?")) {
            try {
                await api.post(`approvals/${userId}/reject/`);
                setMessage({ type: 'success', text: 'Registration rejected.' });
                fetchPendingUsers();
            } catch (err) {
                setMessage({ type: 'error', text: 'Failed to reject user.' });
            }
        }
    };

    if (loading) return <div className="p-8">Loading pending registrations...</div>;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Pending Registrations</h1>
                <p className="text-gray-500">Approve or reject new account requests</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {pendingUsers.length === 0 ? (
                <div className="card text-center p-12">
                    <p className="text-gray-500">No pending registrations at the moment.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pendingUsers.map(user => (
                        <div key={user.id} className="card flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg">{user.first_name} {user.last_name}</h3>
                                <div className="flex gap-4 text-sm text-gray-500">
                                    <span><strong>Username:</strong> {user.username}</span>
                                    <span><strong>Email:</strong> {user.email}</span>
                                    <span><strong>Role:</strong> {user.role}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleApprove(user.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Approve
                                </button>
                                <button 
                                    onClick={() => handleReject(user.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
