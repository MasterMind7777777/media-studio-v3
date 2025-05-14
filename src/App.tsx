import React from "react";
import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import TemplateCustomize from "./pages/TemplateCustomize";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import Create from "./pages/Create";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CreatomateLoader } from "./components/CreatomateLoader";
import Auth from "./pages/Auth";

function App() {
  return (
    <>
      {/* Add the Creatomate loader at the root level */}
      <CreatomateLoader />

      <Routes>
        {/* Protected routes that require authentication and use MainLayout */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/template/:id" element={<TemplateCustomize />} />
          <Route path="/create" element={<Create />} />
          <Route path="/create/:id/customize" element={<TemplateCustomize />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="/media"
            element={<div className="p-8">Media Library</div>}
          />
          <Route
            path="/activity"
            element={<div className="p-8">Activity Page</div>}
          />
        </Route>

        {/* Add a login route for unauthenticated users */}
        <Route path="/login" element={<Auth />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
