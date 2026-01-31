import { AuthLayout } from "../../components/Layout/AuthLayout";
import { LoginForm } from "../../features/auth/components/LoginForm";

function LoginPage() {
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