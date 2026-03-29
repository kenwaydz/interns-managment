import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export const Register = () => {
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', first_name: '', last_name: '', role: 'INTERN', major: '', start_date: '', end_date: ''
    });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('auth/register/', formData);
            navigate('/login');
        } catch (err) {
            setError('Registration failed. Please check inputs.');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Intern Registration</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Create a new intern account</p>
                </div>
                
                {error && (
                    <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
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
                            <label>End Date</label>
                            <input type="date" name="end_date" className="input-field" onChange={handleChange} required />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
                        Register
                    </button>
                    
                    <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};
