import { AuthLayout } from "../../components/Layout/AuthLayout";
import { RegisterForm } from "../../features/auth/components/RegisterForm";

function RegisterPage() {
  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Register your company"
    >
      <RegisterForm />
    </AuthLayout>
  );
}

export default RegisterPage;
