import { Navigate, Outlet, useLocation } from 'react-router-dom';

export const AUTH_SESSION_KEY = 'crm_auth';

export function isAuthenticated() {
  const token = window.sessionStorage.getItem(AUTH_SESSION_KEY);
  return typeof token === 'string' && token.trim().length > 0;
}

export function AuthGuard() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
