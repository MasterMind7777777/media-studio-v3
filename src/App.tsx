
import React from 'react';
import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import TemplateCustomize from "./pages/TemplateCustomize";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import Create from "./pages/Create";
import { Toaster } from "@/components/ui/toaster";

// Import CreatomateLoader and fix its implementation
import { CreatomateLoader } from './components/CreatomateLoader';

function App() {
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    // Simulate initialization process
    setTimeout(() => {
      setIsInitialized(true);
    }, 500);
  }, []);

  return (
    <>
      {/* Add the Creatomate loader at the root level */}
      <CreatomateLoader />
      
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/template/:id" element={<TemplateCustomize />} />
        <Route path="/create" element={<Create />} />
        <Route path="/create/:id/customize" element={<TemplateCustomize />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
