import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {  
  const loggedInUser = localStorage.getItem('user');    
  if (!loggedInUser) {
    return <Navigate to="/*" replace />;
  }
  return <Outlet />;
}