import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/app-shell';

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
      { path: 'clients', element: <PlaceholderPage title="Клиенты" /> },
      { path: 'deals', element: <PlaceholderPage title="Сделки" /> },
      { path: 'tasks', element: <PlaceholderPage title="Задачи" /> },
      { path: 'reports', element: <PlaceholderPage title="Отчёты" /> },
    ],
  },
]);
