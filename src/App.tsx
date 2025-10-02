import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import ComingSoon from "./pages/ComingSoon";
import CoursePage from "./pages/CoursePage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import CanonicalUpdater from "@/components/CanonicalUpdater";
import Portfolio from "./pages/Portfolio";
import AdminPortfolio from "./pages/AdminPortfolio";

const queryClient = new QueryClient();

const RoutesWrapper = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Index /> : <ComingSoon />} />
      <Route path="/course/:courseId" element={<CoursePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/portfolio" element={<AdminPortfolio />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/portfolio" element={<Portfolio />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CanonicalUpdater />
          <RoutesWrapper />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
