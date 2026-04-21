import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { InternManagement } from './pages/InternManagement';
import { TaskManagement } from './pages/TaskManagement';
import { Evaluations } from './pages/Evaluations';
import { UserApprovals } from './pages/UserApprovals';
import { AttendanceLog } from './pages/AttendanceLog';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="interns" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
                <InternManagement />
              </ProtectedRoute>
            } />
            <Route path="tasks" element={<TaskManagement />} />
            <Route path="evaluations" element={<Evaluations />} />
            <Route path="attendance" element={<AttendanceLog />} />
            <Route path="approvals" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UserApprovals />
              </ProtectedRoute>
            } />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
