import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/Layout/AuthLayout";
import { LoginForm } from "../../features/auth/components/LoginForm";
import { useAuth } from "../../hooks/useAuth";

function LoginPage() {
  const {isAuthenticated} = useAuth();
  const navigate = useNavigate();
  if(isAuthenticated){
    navigate("/dashboard");
    return null;
  }
  return (
    <AuthLayout 
      title="Welcome Back"
      subtitle="Sign in to your account"
    >
      <LoginForm />
    </AuthLayout>
  );
}

export default LoginPage;