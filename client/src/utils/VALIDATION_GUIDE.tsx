// /**
//  * VALIDATION LIBRARY USAGE GUIDE
//  *
//  * This file demonstrates how to use the validation utilities and hooks
//  * created in utils/validation.ts and hooks/useValidation.ts
//  */

// // ============ BASIC USAGE ============

// import {
//   validateEmail,
//   validatePassword,
//   validatePasswordMatch,
//   validateName,
//   validateDate,
//   validatePhoneNumber,
//   validateURL,
//   validateTextLength,
//   validateRequired,
//   validateAll,
//   collectErrors,
// } from "../utils/validation";
// import { useFormValidation } from "../hooks/useValidation";

// // ============ SIMPLE VALIDATION (returns boolean or ValidationResult) ============

// // Example 1: Direct boolean validation
// if (validateEmail("user@example.com")) {
//   console.log("Email is valid");
// }

// // Example 2: Validation with error handling
// const emailResult = validateEmail("invalid-email", (error) => {
//   console.log("Email error:", error);
//   // Update error state here
// });

// // ============ REACT COMPONENT EXAMPLE ============

// /**
//  * Example: Login Form using validation utilities
//  */
// function LoginFormExample() {
//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const { errors, setError, clearError, validateFields } =
//     useFormValidation();

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validate all fields
//     const validations = {
//       email: validateEmail(formData.email),
//       password: validateRequired(formData.password, "Password"),
//     };

//     if (!validateFields(validations)) {
//       return; // Validation failed, errors are updated
//     }

//     // Proceed with login
//     console.log("Form is valid, submitting...");
//   };

//   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const email = e.target.value;
//     setFormData((prev) => ({ ...prev, email }));

//     // Real-time validation
//     const result = validateEmail(email);
//     if (result.isValid) {
//       clearError("email");
//     } else if (result.error) {
//       setError("email", result.error);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <input
//         value={formData.email}
//         onChange={handleEmailChange}
//         placeholder="Email"
//       />
//       {errors.email && <span className="error">{errors.email}</span>}

//       <input
//         value={formData.password}
//         onChange={(e) =>
//           setFormData((prev) => ({ ...prev, password: e.target.value }))
//         }
//         type="password"
//         placeholder="Password"
//       />
//       {errors.password && <span className="error">{errors.password}</span>}

//       <button type="submit">Login</button>
//     </form>
//   );
// }

// // ============ REGISTRATION FORM EXAMPLE ============

// /**
//  * Example: Registration Form with multiple validation rules
//  */
// function RegistrationFormExample() {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     phone: "",
//   });

//   const { errors, validateFields, clearAllErrors } = useFormValidation();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     clearAllErrors();

//     // Perform all validations
//     const validations = {
//       name: validateName(formData.name, 3, 100),
//       email: validateEmail(formData.email),
//       password: validatePassword(formData.password),
//       confirmPassword: validatePasswordMatch(
//         formData.password,
//         formData.confirmPassword
//       ),
//       phone: validatePhoneNumber(formData.phone),
//     };

//     if (!validateFields(validations)) {
//       return; // Validation failed
//     }

//     // All validations passed
//     try {
//       await registerUser(formData);
//       console.log("Registration successful!");
//     } catch (error) {
//       console.error("Registration failed:", error);
//     }
//   };

//   const handleFieldChange = (field: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       {/* Name Field */}
//       <div>
//         <input
//           value={formData.name}
//           onChange={(e) => handleFieldChange("name", e.target.value)}
//           placeholder="Full Name"
//         />
//         {errors.name && <span className="error">{errors.name}</span>}
//       </div>

//       {/* Email Field */}
//       <div>
//         <input
//           value={formData.email}
//           onChange={(e) => handleFieldChange("email", e.target.value)}
//           placeholder="Email"
//           type="email"
//         />
//         {errors.email && <span className="error">{errors.email}</span>}
//       </div>

//       {/* Password Field */}
//       <div>
//         <input
//           value={formData.password}
//           onChange={(e) => handleFieldChange("password", e.target.value)}
//           placeholder="Password"
//           type="password"
//         />
//         {errors.password && <span className="error">{errors.password}</span>}
//       </div>

//       {/* Confirm Password Field */}
//       <div>
//         <input
//           value={formData.confirmPassword}
//           onChange={(e) =>
//             handleFieldChange("confirmPassword", e.target.value)
//           }
//           placeholder="Confirm Password"
//           type="password"
//         />
//         {errors.confirmPassword && (
//           <span className="error">{errors.confirmPassword}</span>
//         )}
//       </div>

//       {/* Phone Field */}
//       <div>
//         <input
//           value={formData.phone}
//           onChange={(e) => handleFieldChange("phone", e.target.value)}
//           placeholder="Phone Number"
//         />
//         {errors.phone && <span className="error">{errors.phone}</span>}
//       </div>

//       <button type="submit" disabled={Object.keys(errors).length > 0}>
//         Register
//       </button>
//     </form>
//   );
// }

// // ============ CUSTOM VALIDATION EXAMPLE ============

// /**
//  * Example: Using custom pattern validation
//  */
// import { validatePattern } from "../utils/validation";

// function SkuValidationExample() {
//   // SKU format: ABC-12345 (3 letters, dash, 5 digits)
//   const skuPattern = /^[A-Z]{3}-\d{5}$/;

//   const validateSku = (sku: string) => {
//     return validatePattern(sku, skuPattern, "Invalid SKU format (ABC-12345)");
//   };

//   // Use in your component
//   const [sku, setSku] = useState("");
//   const [error, setError] = useState<string>("");

//   const handleSkuChange = (value: string) => {
//     setSku(value.toUpperCase());
//     const result = validateSku(value);
//     setError(result.error || "");
//   };

//   return (
//     <div>
//       <input
//         value={sku}
//         onChange={(e) => handleSkuChange(e.target.value)}
//         placeholder="Enter SKU (ABC-12345)"
//       />
//       {error && <span className="error">{error}</span>}
//     </div>
//   );
// }

// // ============ BATCH VALIDATION EXAMPLE ============

// /**
//  * Example: Validating multiple fields at once and collecting errors
//  */
// import { validateAll, collectErrors } from "../utils/validation";

// function BulkValidationExample() {
//   const validateForm = (data: any) => {
//     const results = [
//       validateEmail(data.email),
//       validatePassword(data.password),
//       validatePhoneNumber(data.phone),
//     ];

//     if (!validateAll(...results)) {
//       const errorMessages = collectErrors(...results);
//       console.log("Errors:", errorMessages);
//       return false;
//     }

//     console.log("All validations passed!");
//     return true;
//   };
// }

// // ============ REAL-TIME VALIDATION EXAMPLE ============

// import { useValidationFeedback } from "../hooks/useValidation";
// import { useState } from "react";

// /**
//  * Example: Real-time validation with feedback
//  */
// function RealTimeValidationExample() {
//   const { updateValidation, isFieldValid, allFieldsValid, reset } =
//     useValidationFeedback((isValid) => {
//       console.log("Form is", isValid ? "valid" : "invalid");
//     });

//   const handlePasswordChange = (value: string) => {
//     const result = validatePassword(value);
//     updateValidation("password", result.isValid);
//   };

//   return (
//     <div>
//       <input
//         onChange={(e) => handlePasswordChange(e.target.value)}
//         type="password"
//         placeholder="Password"
//       />
//       {isFieldValid("password") && <span>✓ Password is strong</span>}
//       <button disabled={!allFieldsValid()}>Submit</button>
//     </div>
//   );
// }

// // ============ CALLBACK VALIDATION EXAMPLE ============

// /**
//  * Example: Using error callbacks to directly update state
//  */
// function CallbackValidationExample() {
//   const [emailError, setEmailError] = useState<string>("");
//   const [passwordError, setPasswordError] = useState<string>("");

//   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const email = e.target.value;
//     // Validation function will call setEmailError directly
//     validateEmail(email, setEmailError);
//   };

//   const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const password = e.target.value;
//     // Validation function will call setPasswordError directly
//     validatePassword(password, setPasswordError);
//   };

//   return (
//     <form>
//       <input
//         onChange={handleEmailChange}
//         placeholder="Email"
//         type="email"
//       />
//       {emailError && <span className="error">{emailError}</span>}

//       <input
//         onChange={handlePasswordChange}
//         placeholder="Password"
//         type="password"
//       />
//       {passwordError && <span className="error">{passwordError}</span>}
//     </form>
//   );
// }

// // ============ VALIDATION UTILITIES CHEAT SHEET ============

// /**
//  * EMAIL
//  * - validateEmail(email, onError?) → ValidationResult
//  * - isValidEmail(email) → boolean
//  *
//  * PASSWORD
//  * - validatePassword(password, onError?) → ValidationResult
//  * - validatePasswordMatch(password, confirmPassword, onError?) → ValidationResult
//  * - isValidPassword(password) → boolean
//  *
//  * DATE
//  * - validateDate(dateString, onError?) → ValidationResult
//  * - validateFutureDate(dateString, onError?) → ValidationResult
//  * - validatePastDate(dateString, onError?) → ValidationResult
//  * - isValidDateFormat(dateString) → boolean
//  *
//  * TEXT/STRING
//  * - validateRequired(text, fieldName?, onError?) → ValidationResult
//  * - validateTextLength(text, minLength?, maxLength?, onError?) → ValidationResult
//  * - validateName(name, minLength?, maxLength?, onError?) → ValidationResult
//  *
//  * NUMBERS
//  * - validateNumberRange(value, min?, max?, onError?) → ValidationResult
//  * - validatePositiveNumber(value, onError?) → ValidationResult
//  *
//  * OTHER
//  * - validatePhoneNumber(phone, onError?) → ValidationResult
//  * - validateURL(url, onError?) → ValidationResult
//  * - validatePattern(value, pattern, errorMessage?, onError?) → ValidationResult
//  *
//  * BATCH
//  * - validateAll(...validations) → boolean
//  * - collectErrors(...validations) → string[]
//  *
//  * HOOKS
//  * - useFormValidation(initialErrors?) → ValidationHookReturn
//  * - useValidationFeedback(onValidationChange?) → ValidationFeedbackReturn
//  */
