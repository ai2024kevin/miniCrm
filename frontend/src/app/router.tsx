import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/app-shell';
import { ClientsPage } from '@/pages/clients-page';
import { DealsPage } from '@/pages/deals-page';
import { TasksPage } from '@/pages/tasks-page';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section>
      <h1>{title}</h1>
      <p>Раздел в разработке.</p>
    </section>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <PlaceholderPage title="Обзор" /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'deals', element: <DealsPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'reports', element: <PlaceholderPage title="Отчёты" /> },
    ],
  },
]);
