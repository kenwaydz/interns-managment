import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Users, CheckCircle, Clock, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({ interns: 0, pendingTasks: 0, completedTasks: 0 });
    const [tasksChartData, setTasksChartData] = useState([]);
    const [internsChartData, setInternsChartData] = useState([]);
    const [attendance, setAttendance] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                let internRes, taskRes;
                if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
                     internRes = await api.get('interns/');
                     taskRes = await api.get('tasks/');
                } else {
                     taskRes = await api.get('tasks/');
                }
                
                const taskData = taskRes ? taskRes.data : [];
                const internData = internRes ? internRes.data : [];
                
                const pending = taskData.filter(t => t.status === 'PENDING').length;
                const inProgress = taskData.filter(t => t.status === 'IN_PROGRESS').length;
                const completed = taskData.filter(t => t.status === 'COMPLETED').length;

                setStats({
                    interns: internData.length,
                    pendingTasks: pending + inProgress,
                    completedTasks: completed
                });

                setTasksChartData([
                    { name: 'Pending', value: pending },
                    { name: 'In Progress', value: inProgress },
                    { name: 'Completed', value: completed }
                ]);

                if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
                    // Group interns by department
                    const deptCounts = {};
                    internData.forEach(i => {
                        const dName = i.department_details?.name || 'Unassigned';
                        deptCounts[dName] = (deptCounts[dName] || 0) + 1;
                    });
                    const dChart = Object.keys(deptCounts).map(k => ({ name: k, count: deptCounts[k] }));
                    setInternsChartData(dChart);
                }

                if (user.role === 'INTERN') {
                    const today = new Date().toISOString().split('T')[0];
                    const attRes = await api.get('attendance/');
                    const todayAtt = attRes.data.find(a => a.date === today);
                    if (todayAtt) {
                        setAttendance(todayAtt);
                    }
                }
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            }
        };
        fetchDashboardData();
    }, [user]);

    const handleClockIn = async () => {
        try {
            const res = await api.post('attendance/clock_in/');
            setAttendance(res.data);
            alert("Clocked in successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Error clocking in");
        }
    };

    const handleClockOut = async () => {
        try {
            const res = await api.post('attendance/clock_out/');
            setAttendance(res.data);
            alert("Clocked out successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Error clocking out");
        }
    };

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <h1 className="page-title">Overview</h1>
                
                {user.role === 'INTERN' && (
                    <div className="flex gap-2 items-center bg-white p-2 rounded shadow-sm border border-gray-100">
                        <Calendar size={20} className="text-gray-500" />
                        <span className="font-semibold text-sm">Attendance:</span>
                        {!attendance?.clock_in_time ? (
                            <button className="btn btn-primary text-sm py-1" onClick={handleClockIn}>Clock In</button>
                        ) : !attendance?.clock_out_time ? (
                            <>
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">In at {attendance.clock_in_time}</span>
                                <button className="btn bg-red-600 hover:bg-red-700 text-white text-sm py-1" onClick={handleClockOut}>Clock Out</button>
                            </>
                        ) : (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Logged for today</span>
                        )}
                    </div>
                )}
            </div>

            <div className="dashboard-grid">
                {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                    <div className="card stat-card">
                        <div className="stat-icon bg-blue-100 text-blue-600">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="card shadow-md">
                    <h3 className="font-semibold text-lg mb-4 text-gray-700">Tasks Distribution</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie 
                                    data={tasksChartData} 
                                    cx="50%" cy="50%" 
                                    innerRadius={60} outerRadius={80} 
                                    paddingAngle={5} dataKey="value"
                                >
                                    {tasksChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                    <div className="card shadow-md">
                        <h3 className="font-semibold text-lg mb-4 text-gray-700">Interns by Department</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={internsChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
