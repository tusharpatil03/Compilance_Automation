import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { InputField } from '../../../components/UI/InputField';
import { Button } from '../../../components/UI/Button';
import { loginService } from '../services/authServices';
import { useAuth } from '../hooks/useAuth';
import type { FormErrors } from '../types/auth.types';
import { validateEmailFormat } from '../utils/authValidation';
import styles from './LoginForm.module.css';
import axios from 'axios';

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmailFormat(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    // Clear API error when user makes changes
    if (apiError) {
      setApiError('');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginService({
        email: formData.email,
        password: formData.password,
      });

      if (response.success && response.data) {
        // Login the user with the response data
        login(response.data.tenant, response.data.auth);
        navigate('/dashboard');
      } else {
        setApiError(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        const responseData = error.response.data;
        
        // Handle validation errors
        if (responseData.errors) {
          setErrors(responseData.errors);
        } else {
          setApiError(responseData.message || 'Invalid email or password');
        }
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {apiError && (
        <div className={styles.errorAlert}>
          {apiError}
        </div>
      )}

      <InputField
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="Enter your email"
        disabled={isLoading}
        autoComplete="email"
      />

      <InputField
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        placeholder="Enter your password"
        disabled={isLoading}
        autoComplete="current-password"
      />

      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        Login
      </Button>

      <div className={styles.footer}>
        Don't have an account?{' '}
        <Link to="/register" className={styles.link}>
          Register here
        </Link>
      </div>
    </form>
  );
}