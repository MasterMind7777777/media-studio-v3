
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, navigate to dashboard
        navigate("/", { replace: true });
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
        <p>Loading...</p>
      </div>
    );
  }

  return null;
};

export default Index;
