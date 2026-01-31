# Component Tree Diagram

## Application Structure

```
App
└── AuthProvider (Context)
    └── BrowserRouter
        ├── PublicRoutes
        │   ├── / (Navigate to /login)
        │   ├── /login
        │   │   └── LoginPage
        │   │       └── AuthLayout
        │   │           ├── title: "Welcome Back"
        │   │           ├── subtitle: "Sign in to your account"
        │   │           └── LoginForm
        │   │               ├── InputField (email)
        │   │               ├── InputField (password)
        │   │               ├── Button (submit)
        │   │               └── Link (to register)
        │   │
        │   └── /register
        │       └── RegisterPage
        │           └── AuthLayout
        │               ├── title: "Create Account"
        │               ├── subtitle: "Register your company"
        │               └── RegisterForm
        │                   ├── InputField (name)
        │                   ├── InputField (email)
        │                   ├── InputField (password)
        │                   ├── InputField (confirm password)
        │                   ├── Button (submit)
        │                   └── Link (to login)
        │
        └── ProtectedRoutes (Auth Guard)
            ├── /dashboard
            │   └── DashBoard
            │       ├── Header
            │       │   ├── Title
            │       │   └── Button (logout)
            │       └── Content
            │           └── TenantInfoCard
            │               ├── Welcome message
            │               ├── Email display
            │               ├── Status badge
            │               └── Tenant ID
            │
            └── * (Navigate to /dashboard)
```

## Component Dependencies

### Page Components
```
LoginPage
  └── uses: AuthLayout, LoginForm

RegisterPage
  └── uses: AuthLayout, RegisterForm

DashBoard
  └── uses: Button, useAuth hook
```

### Feature Components
```
LoginForm
  └── uses: InputField, Button, useAuth, loginService, validateEmailFormat

RegisterForm
  └── uses: InputField, Button, useAuth, registerService, 
            validateEmailFormat, validatePasswordStrength, validateNameLength
```

### Layout Components
```
AuthLayout
  └── Generic wrapper with title, subtitle, and children
```

### UI Components
```
InputField
  └── Self-contained with label, error, helperText

Button
  └── Self-contained with variants, sizes, loading state

Spinner
  └── Self-contained loading indicator
```

## Data Flow

```
User Action (Form Submit)
    ↓
Form Component (LoginForm/RegisterForm)
    ↓
Validation (authValidation.ts)
    ↓
API Service (authServices.ts)
    ↓
Axios Client (with interceptors)
    ↓
Backend API (/api/tenants/login or /api/tenants/register)
    ↓
Response Handler
    ↓
AuthContext (login method)
    ↓
LocalStorage (saveToLocalStorage)
    ↓
Navigation (navigate('/dashboard'))
    ↓
Protected Route (ProtectedRoutes)
    ↓
Dashboard Component
```

## State Management

```
Global State (AuthContext)
├── tenant: Tenant | null
├── token: string | null
├── isAuthenticated: boolean
├── isLoading: boolean
├── login(tenant, auth): void
└── logout(): void

Local State (Form Components)
├── formData: { email, password, ... }
├── errors: FormErrors
├── isLoading: boolean
└── apiError: string
```

## Routing Flow

```
Initial Load
    ↓
Is user authenticated? (check localStorage)
    ↓
Yes → Redirect to /dashboard
    ↓
No → Show /login
    
User navigates to protected route
    ↓
Is authenticated?
    ↓
Yes → Show protected page
    ↓
No → Return null (stay on public route)

User logs out
    ↓
Clear auth state
    ↓
Redirect to /login
```

## API Integration Points

```
axiosClient
├── Base URL: VITE_API_BASE_URL
├── Default Headers: Content-Type: application/json
├── Request Interceptor: Add Authorization header
└── Response Interceptor: Handle 401 errors

authServices
├── loginService(payload)
│   └── POST /tenants/login
└── registerService(payload)
    └── POST /tenants/register
```

## Styling Architecture

```
Global Styles (index.css)
├── CSS Reset
├── Base typography
└── Root element styles

Component Styles (*.module.css)
├── Scoped to component
├── BEM-like class naming
├── CSS custom properties for theming
└── Responsive utilities

Layout Styles
├── Flexbox for layouts
├── CSS Grid where appropriate
└── Mobile-first approach
```

## Hook Dependencies

```
useAuth
├── Depends on: AuthContext
├── Throws error if used outside AuthProvider
└── Returns: AuthContextValue

Custom Hooks (if added)
└── useLogin, useLogout, useRegister
    └── All depend on useAuth
```

## Validation Flow

```
Form Submission
    ↓
validateForm()
    ↓
├── validateEmailFormat()
├── validatePasswordStrength()
├── validateNameLength()
└── Check password match (register only)
    ↓
Validation Errors?
    ↓
Yes → Show errors, prevent submit
    ↓
No → Proceed with API call
```

## Error Handling Chain

```
API Error
    ↓
Axios Interceptor (catch)
    ↓
Is 401? → Logout and redirect
    ↓
Is Axios Error?
    ↓
Yes → Extract response.data
    ↓
Has validation errors? → Set field errors
    ↓
Has message? → Set API error
    ↓
No → Generic error message
    ↓
Display to user (error alert)
```
