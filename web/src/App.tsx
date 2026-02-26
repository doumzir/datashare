import { Routes, Route, Navigate } from 'react-router';
import Login from './pages/Login';
import Register from './pages/Register';
import { getToken } from './lib/api';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <div className="p-8 text-gray-600">Dashboard — à venir (Étape 4)</div>
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
