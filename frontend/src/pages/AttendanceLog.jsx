import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Calendar, Clock, LogOut } from 'lucide-react';

export const AttendanceLog = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await api.get('attendance/');
                setLogs(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchAttendance();
    }, []);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Attendance Log</h1>
                <p className="text-gray-500 mt-1">Review the clock-in and clock-out history.</p>
            </div>

            <div className="card w-full shadow-md">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && <th>Intern</th>}
                                <th>Clock In</th>
                                <th>Clock Out</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td className="font-medium whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400" />
                                            {log.date}
                                        </div>
                                    </td>
                                    {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                                        <td>
                                            <span className="font-medium">{log.intern_details?.user?.first_name} {log.intern_details?.user?.last_name}</span>
                                            <br />
                                            <span className="text-xs text-gray-500">{log.intern_details?.user?.email}</span>
                                        </td>
                                    )}
                                    <td>
                                        {log.clock_in_time ? (
                                            <span className="text-green-600 font-medium flex items-center gap-1">
                                                <LogOut size={14} className="rotate-180" />
                                                {log.clock_in_time}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        {log.clock_out_time ? (
                                            <span className="text-red-600 font-medium flex items-center gap-1">
                                                <LogOut size={14} />
                                                {log.clock_out_time}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        {log.clock_in_time && !log.clock_out_time ? (
                                            <span className="badge" style={{background: '#dbeafe', color: '#1e40af'}}>Working...</span>
                                        ) : log.clock_out_time ? (
                                            <span className="badge" style={{background: '#dcfce7', color: '#166534'}}>Completed Day</span>
                                        ) : (
                                            <span className="badge" style={{background: '#f3f4f6', color: '#374151'}}>Absent</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={user.role === 'INTERN' ? "4" : "5"} className="text-center p-8 text-gray-500">
                                        No attendance records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
