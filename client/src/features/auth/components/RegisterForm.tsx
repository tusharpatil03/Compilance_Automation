import { useCallback, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { InputField } from "../../../components/Form/InputField";
import { Button } from "../../../components/UI/Button";
import { useAuth } from "../../../hooks/useAuth";
import { useFormValidation } from "../../../hooks/useValidation";
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from "../../../utils/validation";
import styles from "./RegisterForm.module.css";
import { useRegister } from "../hooks/useRegister";

export function RegisterForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Use the register hook for form state and submission
  const {
    loading,
    error: apiError,
    fieldErrors: serverFieldErrors,
    formData,
    setFormData,
    handleRegister,
  } = useRegister();

  // Use validation hook for client-side validation
  const { errors: validationErrors, validateFields } = useFormValidation();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    [setFormData]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Client-side validation
      const validations = {
        name: validateName(formData.name, 3, 100),
        email: validateEmail(formData.email),
        password: validatePassword(formData.password),
        confirmPassword: validatePasswordMatch(
          formData.password,
          formData.confirmPassword
        ),
      };

      if (!validateFields(validations)) {
        return;
      }

      // Server submission via hook
      const result = await handleRegister();

      // Check if registration was successful and login user
      if (result.ok) {
        login(result.response.data.tenant);
        navigate("/dashboard");
      }
    },
    [formData, validateFields, handleRegister, login, navigate]
  );

  // Merge client-side and server-side errors, with server errors taking precedence
  const displayErrors = {
    name: serverFieldErrors.name || validationErrors.name,
    email: serverFieldErrors.email || validationErrors.email,
    password: serverFieldErrors.password || validationErrors.password,
    confirmPassword: serverFieldErrors.confirmPassword || validationErrors.confirmPassword,
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {apiError && (
        <div className={styles.errorAlert} role="alert" tabIndex={0}>
          {apiError}
        </div>
      )}

      <InputField
        label="Company Name"
        name="name"
        type="text"
        value={formData.name}
        onChange={handleChange}
        error={displayErrors.name}
        placeholder="Enter your company name"
        disabled={loading}
        autoComplete="organization"
        required
      />

      <InputField
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={displayErrors.email}
        placeholder="Enter your email"
        disabled={loading}
        autoComplete="email"
        required
      />

      <InputField
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        error={displayErrors.password}
        placeholder="Create a password (min 8 characters with uppercase, lowercase, number, and special character)"
        disabled={loading}
        autoComplete="new-password"
        required
      />

      <InputField
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={displayErrors.confirmPassword}
        placeholder="Confirm your password"
        disabled={loading}
        autoComplete="new-password"
        required
      />

      <Button
        type="submit"
        fullWidth
        isLoading={loading}
        disabled={loading}
      >
        Register
      </Button>

      <div className={styles.footer}>
        Already have an account?{" "}
        <Link to="/login" className={styles.link}>
          Login here
        </Link>
      </div>
    </form>
  );
}
