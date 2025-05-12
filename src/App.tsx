
import { useEffect } from 'react';
import {
  BrowserRouter as Router,
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CreatomateLoader } from './components/CreatomateLoader';

function App() {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isLoggedIn()) {
      console.log('User is not logged in');
    } else {
      console.log('User is logged in');
    }
  }, [isLoggedIn]);
  
  const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    
    if (!isLoggedIn()) {
      toast({
        title: "Not authenticated",
        description: "You must log in to access this page.",
      });
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    
    return <>{children}</>;
  };
  
  return (
    <>
      {/* Add the loader near the top of the component tree */}
      <CreatomateLoader />
      
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/create"
            element={
              <PrivateRoute>
                <Create />
              </PrivateRoute>
            }
          />
          <Route
            path="/create/:id/customize"
            element={
              <PrivateRoute>
                <TemplateCustomize />
              </PrivateRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <PrivateRoute>
                <Templates />
              </PrivateRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <PrivateRoute>
                <Projects />
              </PrivateRoute>
            }
          />
          <Route
            path="/account"
            element={
              <PrivateRoute>
                <Account />
              </PrivateRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/create" />} />
        </Routes>
        <Toaster />
      </Router>
    </>
  );
}

export default App;
