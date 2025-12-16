import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ExamBank from "./pages/ExamBank";
import ExamStart from "./pages/ExamStart";
import ExamTaking from "./pages/ExamTaking";
import ExamResult from "./pages/ExamResult";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/exam-bank" element={<ExamBank />} />
          <Route path="/exam/:subjectId/start" element={<ExamStart />} />
          <Route path="/exam/:subjectId/take" element={<ExamTaking />} />
          <Route path="/exam/:subjectId/result" element={<ExamResult />} />
          <Route path="/admin/auth" element={<AdminAuth />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
