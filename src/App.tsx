import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from 'react-query'

import Home from "./pages/Home";
import Projects from "./pages/Projects";
import TemplateCustomize from "./pages/TemplateCustomize";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { Toaster } from "@/components/ui/toaster"

// Import CreatomateLoader
import { CreatomateLoader } from './components/CreatomateLoader';

const queryClient = new QueryClient()

function App() {
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    // Simulate initialization process
    setTimeout(() => {
      setIsInitialized(true);
    }, 500);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Add the Creatomate loader at the root level */}
      <CreatomateLoader />
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/template/:id" element={<TemplateCustomize />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
