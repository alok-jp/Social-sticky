import React from 'react';
import { createBrowserRouter, RouterProvider, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/Common/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import DashboardPage  from './pages/DashboardPage';
import GroupPage      from './pages/GroupPage';
import AdminPage      from './pages/AdminDashboardPage';
import FriendsPage    from './pages/FriendsPage';
import ProfilePage    from './pages/ProfilePage';
import GoalsPage      from './pages/GoalsPage';
import FocusModePage  from './pages/FocusModePage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:32 }}>📌 Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  const router = createBrowserRouter([
    { path: '/', element: <Navigate to="/dashboard" replace /> },
    { path: '/login', element: <PublicRoute><LoginPage /></PublicRoute> },
    { path: '/register', element: <PublicRoute><RegisterPage /></PublicRoute> },
    { path: '/forgot-password', element: <PublicRoute><ForgotPassword /></PublicRoute> },
    { path: '/reset-password/:token', element: <PublicRoute><ResetPassword /></PublicRoute> },
    { path: '/dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
    { path: '/friends', element: <ProtectedRoute><FriendsPage /></ProtectedRoute> },
    { path: '/group/:id', element: <ProtectedRoute><GroupPage /></ProtectedRoute> },
    { path: '/profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
    { path: '/goals', element: <ProtectedRoute><GoalsPage /></ProtectedRoute> },
    { path: '/focus-mode', element: <ProtectedRoute><FocusModePage /></ProtectedRoute> },
    { path: '/admin', element: <AdminRoute><AdminPage /></AdminRoute> },
  ], {
    future: {
      v7_relativeSplatPath: true,
      v7_startTransition: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    }
  });

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
