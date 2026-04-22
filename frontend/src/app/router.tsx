import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/app-shell';
import { ClientsPage } from '@/pages/clients-page';
import { DealsPage } from '@/pages/deals-page';
import { OverviewPage } from '@/pages/overview-page';
import { ReportsPage } from '@/pages/reports-page';
import { SettingsPage } from '@/pages/settings-page';
import { TasksPage } from '@/pages/tasks-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'deals', element: <DealsPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
