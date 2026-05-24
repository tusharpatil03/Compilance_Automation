import { useCallback, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { InputField } from "../../../components/Form/InputField";
import { Button } from "../../../components/UI/Button";
import { useFormValidation } from "../../../hooks/useValidation";
import { validateEmail, validateRequired } from "../../../utils/validation";
import styles from "./LoginForm.module.css";
import { useLogin } from "../hooks/useLogin";
import type { LoginRequest } from "../../../types/auth.types";
import { useAuth } from "../../../hooks/useAuth";
import { useForm } from "../../../hooks/formHooks";

export function LoginForm() {
  const { loading, handleLogin } = useLogin();
  const [error, setCommonError] = useState<string| null>(null);
  const { login } = useAuth();

  const {
    values,
    handleChange,
    errors: fieldErrors,
    clearErrors,
  } = useForm<LoginRequest>({ email: "", password: "" } as LoginRequest);

  // Client-side validation hook
  const {
    errors: validationErrors,
    validateFields,
    clearAllErrors,
    setError,
  } = useFormValidation();

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      clearErrors();
      setCommonError(null);

      // Client-side validation
      const validations = {
        email: validateEmail(values.email),
        password: validateRequired(values.password, "Password"),
      };

      if (!validateFields(validations)) {
        return;
      } else {
        clearAllErrors();
      }

      //send login request
      const result = await handleLogin(values);

      if (result.ok) {
        login(result.response.data.tenant);
      } else {
        if (
          result.error.type === "validation" &&
          result.error.field !== ""
        ) {
          setError(result.error.field, result.error.message);
        } else {
          setCommonError(result.error.message || "Something went wrong");
        }
      }

      return;
    },
    [
      values,
      validateFields,
      handleLogin,
      clearAllErrors,
      login,
      clearErrors,
      setError,
    ],
  );

  // Merge client-side and server-side errors, with server errors taking precedence
  const displayErrors = {
    email: fieldErrors.email || validationErrors.email,
    password: fieldErrors.password || validationErrors.password,
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div className={styles.errorAlert} role="alert" tabIndex={0}>
          {error}
        </div>
      )}

      <InputField
        label="Email Address"
        name="email"
        type="email"
        value={values.email}
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
        value={values.password}
        onChange={handleChange}
        error={displayErrors.password}
        placeholder="Enter your password"
        disabled={loading}
        autoComplete="current-password"
        required
      />

      <Button type="submit" fullWidth isLoading={loading} disabled={loading}>
        Login
      </Button>

      <div className={styles.footer}>
        Don't have an account?{" "}
        <Link to="/register" className={styles.link}>
          Register here
        </Link>
      </div>
    </form>
  );
}
