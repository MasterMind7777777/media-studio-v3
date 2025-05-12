
import { useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Create from "./pages/Create";
import Templates from "./pages/Templates";
import TemplateCustomize from "./pages/TemplateCustomize";
import Projects from "./pages/Projects";
import { useAuth } from '@/context/AuthContext';
import Login from './pages/Auth';
import Register from './pages/Auth';
import Account from './pages/Settings';
import { CreatomateLoader } from './components/CreatomateLoader';
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';

function App() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) {
      console.log('User is not logged in');
    } else {
      console.log('User is logged in');
    }
  }, [user]);
  
  return (
    <>
      {/* Add the loader near the top of the component tree */}
      <CreatomateLoader />
      
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth" element={<Login />} />
        
        {/* Protected routes with layout */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<Create />} />
          <Route path="/create/:id/customize" element={<TemplateCustomize />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/account" element={<Account />} />
          <Route path="/settings" element={<Account />} />
        </Route>
        
        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
