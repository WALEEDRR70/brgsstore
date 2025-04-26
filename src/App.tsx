import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ClientProvider } from "./contexts/ClientContext";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddClient from "./pages/AddClient";
import Notifications from "./pages/Notifications";
import Analytics from "./pages/Analytics";
import Trash from "./pages/Trash";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Clients from "./pages/Clients";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

// Auth Guard Component
const ProtectedRoute = ({ children }) => {
  // Check if user is logged in, if not redirect to login page
  const isAuthenticated = localStorage.getItem('clientPortalUser');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <ClientProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="add-client" element={<AddClient />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="trash" element={<Trash />} />
                  <Route path="admin" element={<Admin />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ClientProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
