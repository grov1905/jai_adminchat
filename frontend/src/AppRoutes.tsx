import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ReactNode, useEffect } from 'react';
import AdminLayout from './components/Admin/Layout/AdminLayout';
import LoginPage from './pages/Auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BusinessPage from './pages/Admin/Business/BusinessPage';
import BusinessDetailPage from './pages/Admin/Business/[id]';
import UsersPage from './pages/Admin/Users/UsersPage';
import UserDetailPage from './pages/Admin/Users/[id]';
import { useAuth } from './contexts/AuthContext';
import RolesPage from './pages/Admin/Roles/RolesPage';
import RoleDetailPage from './pages/Admin/Roles/[id]';
import BotSettingsPage from './pages/Admin/BotSettings/BotSettingsPage';
import BotSettingDetailPage from './pages/Admin/BotSettings/[id]';
import BotTemplatesPage from './pages/Admin/BotTemplates/BotTemplatesPage';
import BotTemplateDetailPage from './pages/Admin/BotTemplates/[id]';


const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { token, user, fetchUserData } = useAuth();
  
  useEffect(() => {
    if (token && !user) {
      fetchUserData(token);
    }
  }, [token, user, fetchUserData]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'business',
        children: [
          {
            index: true,
            element: <BusinessPage />,
          },
          {
            path: 'new',
            element: <BusinessDetailPage key="create" />,
          },
          {
            path: ':id',
            element: <BusinessDetailPage key="edit"/>,
          },
        ],
      },
      {
        path: 'bot-settings',
        children: [
          {
            index: true,
            element: <BotSettingsPage />,
          },
          {
            path: 'new',
            element: <BotSettingDetailPage key="create" />,
          },
          {
            path: ':id',
            element: <BotSettingDetailPage key="edit" />,
          },
        ],
      },
      {
        path: 'bot-templates',
        children: [
          {
            index: true,
            element: <BotTemplatesPage />,
          },
          {
            path: 'new',
            element: <BotTemplateDetailPage key="create" />,
          },
          {
            path: ':id',
            element: <BotTemplateDetailPage key="edit" />,
          },
        ],
      },
      {
        path: 'roles',
        children: [
          {
            index: true,
            element: <RolesPage />,
          },
          {
            path: 'new',
            element: <RoleDetailPage key="create" />,
          },
          {
            path: ':id',
            element: <RoleDetailPage key="edit" />,
          },
        ],
      },
      {
        path: 'users',
        children: [
          {
            index: true,
            element: <UsersPage />,
          },
          {
            path: 'new',
            element: <UserDetailPage />,
          },
          {
            path: ':id',
            element: <UserDetailPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/admin/dashboard" replace />,
  },
]);

export default router;