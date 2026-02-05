import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
 import InvoiceView from "./pages/InvoiceView";
 import PublicInvoiceView from "./pages/PublicInvoiceView";
 import Login from "./pages/Login";
  import ResetPassword from "./pages/ResetPassword";
 import AdminPanel from "./pages/AdminPanel";
 import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
             <Route path="/reset-password" element={<ResetPassword />} />
             <Route path="/view/:id" element={<PublicInvoiceView />} />
            
             {/* Admin routes */}
             <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
             
             {/* Protected routes */}
             <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
             <Route path="/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
             <Route path="/companies/:id" element={<ProtectedRoute><CompanyDetail /></ProtectedRoute>} />
             <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
             <Route path="/invoices/new" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
             <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceView /></ProtectedRoute>} />
             <Route path="/invoices/:id/edit" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
