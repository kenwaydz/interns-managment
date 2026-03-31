import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export const Register = () => {
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', first_name: '', last_name: '',
        role: 'INTERN', major: '', start_date: '', end_date: '',
        internship_type: 'BTS', department: ''
    });
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState(null);
    const [isPending, setIsPending] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await api.get('departments/');
                const data = res.data.results || res.data;
                setDepartments(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch departments", err);
            }
        };
        fetchDepartments();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const submitData = { ...formData };
            if (submitData.role === 'SUPERVISOR') {
                delete submitData.major;
                delete submitData.start_date;
                delete submitData.end_date;
                delete submitData.internship_type;
            } else {
                delete submitData.department;
                if (submitData.internship_type !== 'UNIVERSITY') {
                    delete submitData.end_date;
                } else if (!submitData.end_date) {
                    delete submitData.end_date;
                }
            }

            await api.post('auth/register/', submitData);
            setIsPending(true);
        } catch (err) {
            const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Registration failed. Please check inputs.';
            setError(errorMsg);
        }
    };

    if (isPending) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div className="card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                    <div style={{ padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Registration Received!</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            Your account has been created but is currently <strong>awaiting administrator approval</strong>.
                            You will be able to log in once your account is activated.
                        </p>
                        <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', width: 'auto' }}>
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const isUniversity = formData.internship_type === 'UNIVERSITY';
    const isSupervisor = formData.role === 'SUPERVISOR';

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Project Management Registration</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Create a new account</p>
                </div>

                {error && (
                    <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Account Role</label>
                        <select name="role" className="input-field" value={formData.role} onChange={handleChange} required>
                            <option value="INTERN">Intern</option>
                            <option value="SUPERVISOR">Supervisor</option>
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>First Name</label>
                            <input type="text" name="first_name" className="input-field" onChange={handleChange} required />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Last Name</label>
                            <input type="text" name="last_name" className="input-field" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Email</label>
                        <input type="email" name="email" className="input-field" onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label>Username</label>
                        <input type="text" name="username" className="input-field" onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input type="password" name="password" className="input-field" onChange={handleChange} required />
                    </div>

                    {isSupervisor ? (
                        <div className="input-group">
                            <label>Department</label>
                            <select name="department" className="input-field" value={formData.department} onChange={handleChange} required>
                                <option value="">Select Department</option>
                                {departments && departments.length > 0 ? (
                                    departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))
                                ) : (
                                    <option value="" disabled>Loading departments (or none available)...</option>
                                )}
                            </select>
                        </div>
                    ) : (
                        <>
                            <div className="input-group">
                                <label>Type of Internship</label>
                                <select name="internship_type" className="input-field" value={formData.internship_type} onChange={handleChange} required>
                                    <option value="BTS">BTS</option>
                                    <option value="BT">BT</option>
                                    <option value="CAP">CAP</option>
                                    <option value="CMP">CMP</option>
                                    <option value="UNIVERSITY">Stagiaire Universitaire</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Major / Specialization</label>
                                <input type="text" name="major" className="input-field" onChange={handleChange} required />
                            </div>

                            <div className="flex gap-4">
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label>Start Date</label>
                                    <input type="date" name="start_date" className="input-field" onChange={handleChange} required />
                                </div>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label>End Date {!isUniversity && '(Auto-calculated)'}</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        className="input-field"
                                        onChange={handleChange}
                                        required={isUniversity}
                                        disabled={!isUniversity}
                                        value={isUniversity ? formData.end_date : ''}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
                        Register Account
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};
