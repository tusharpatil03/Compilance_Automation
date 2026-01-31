import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { InputField } from '../../../components/UI/InputField';
import { Button } from '../../../components/UI/Button';
import { registerService } from '../services/authServices';
import { useAuth } from '../hooks/useAuth';
import type { FormErrors } from '../types/auth.types';
import {
  validateEmailFormat,
  validatePasswordStrength,
  validateNameLength,
} from '../utils/authValidation';
import styles from './RegisterForm.module.css';
import axios from 'axios';

export function RegisterForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!validateNameLength(formData.name)) {
      newErrors.name = 'Name must be between 3 and 255 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmailFormat(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePasswordStrength(formData.password)) {
      newErrors.password =
        'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await registerService({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (response.success && response.data) {
        // Login the user with the response data
        login(response.data.tenant, response.data.auth);
        navigate('/dashboard');
      } else {
        setApiError(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        const responseData = error.response.data;
        
        // Handle validation errors
        if (responseData.errors) {
          setErrors(responseData.errors);
        } else {
          setApiError(responseData.message || 'Registration failed. Please try again.');
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
        label="Company Name"
        name="name"
        type="text"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        placeholder="Enter your company name"
        disabled={isLoading}
        autoComplete="organization"
      />

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
        placeholder="Create a password"
        disabled={isLoading}
        autoComplete="new-password"
      />

      <InputField
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        placeholder="Confirm your password"
        disabled={isLoading}
        autoComplete="new-password"
      />

      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        Register
      </Button>

      <div className={styles.footer}>
        Already have an account?{' '}
        <Link to="/login" className={styles.link}>
          Login here
        </Link>
      </div>
    </form>
  );
}