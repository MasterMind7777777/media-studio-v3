
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only redirect if authentication state is determined
    if (!loading) {
      if (user) {
        // User is authenticated, navigate to dashboard
        navigate("/dashboard", { replace: true });
      } else {
        // User is not authenticated, navigate to login
        navigate("/auth", { replace: true });
      }
    }
  }, [navigate, user, loading]);

  // Show a loading state while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Return a minimal placeholder while navigating
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default Index;
