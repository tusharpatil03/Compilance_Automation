# Client Application - Tenant Authentication

This is a React-based frontend application for tenant (user) registration and login with a modular, scalable architecture.

## Features

- ✅ Tenant Registration with validation
- ✅ Tenant Login with authentication
- ✅ Protected routes with authentication guard
- ✅ JWT token management with localStorage
- ✅ Axios interceptors for automatic token injection
- ✅ Form validation (client-side)
- ✅ Error handling and display
- ✅ Responsive UI with minimal CSS modules
- ✅ TypeScript for type safety
- ✅ Modular component architecture

## Project Structure

```
client/src/
├── api/
│   └── axiosClient.ts              # Axios instance with interceptors
├── assets/                         # Static assets
├── components/
│   ├── Layout/
│   │   ├── AuthLayout.tsx          # Layout wrapper for auth pages
│   │   └── AuthLayout.module.css
│   └── UI/
│       ├── Button.tsx              # Reusable button component
│       ├── Button.module.css
│       ├── InputField.tsx          # Reusable input component
│       ├── InputField.module.css
│       ├── Spinner.tsx             # Loading spinner
│       └── Spinner.module.css
├── context/
│   └── AuthContext.tsx             # Global auth state management
├── features/
│   └── auth/
│       ├── components/
│       │   ├── LoginForm.tsx       # Login form component
│       │   ├── LoginForm.module.css
│       │   ├── RegisterForm.tsx    # Registration form
│       │   └── RegisterForm.module.css
│       ├── hooks/
│       │   └── useAuth.ts          # Custom hook for auth context
│       ├── services/
│       │   └── authServices.ts     # API calls for auth
│       ├── types/
│       │   └── auth.types.ts       # TypeScript types
│       └── utils/
│           └── authValidation.ts   # Validation utilities
├── pages/
│   ├── protected/
│   │   ├── DashBoard.tsx           # Protected dashboard page
│   │   └── DashBoard.module.css
│   └── public/
│       ├── LoginPage.tsx           # Public login page
│       └── RegisterPage.tsx        # Public register page
├── routes/
│   ├── AppRoutes.tsx               # Main routes wrapper
│   ├── ProtectedRoutes.tsx         # Protected route guard
│   └── PublicRoutes.tsx            # Public routes
├── utils/
│   └── storage.ts                  # LocalStorage utilities
├── App.tsx                         # Root component
├── main.tsx                        # Entry point
└── index.css                       # Global styles
```

## API Integration

The application integrates with the following tenant API endpoints:

### Register
- **Endpoint**: `POST /api/tenants/register`
- **Payload**: `{ name, email, password }`
- **Response**: `{ success, message, data: { tenant, auth } }`

### Login
- **Endpoint**: `POST /api/tenants/login`
- **Payload**: `{ email, password }`
- **Response**: `{ success, message, data: { tenant, auth } }`

## Setup Instructions

1. **Install dependencies**
   ```bash
   cd client
   pnpm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   ```
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

3. **Run the development server**
   ```bash
   pnpm dev
   ```

4. **Build for production**
   ```bash
   pnpm build
   ```

## Usage

### Registration Flow
1. Navigate to `/register`
2. Fill in company name, email, and password
3. Form validates inputs client-side
4. On success, user is logged in and redirected to dashboard
5. JWT token and tenant data stored in localStorage

### Login Flow
1. Navigate to `/login` (or root `/`)
2. Enter email and password
3. On success, user is redirected to dashboard
4. Token automatically included in subsequent API requests

### Authentication State
- Managed by `AuthContext` using React Context API
- Token stored in localStorage for persistence
- Axios interceptors automatically add token to requests
- 401 responses trigger automatic logout and redirect

## Validation Rules

### Registration
- **Name**: 3-255 characters
- **Email**: Valid email format
- **Password**: Min 8 characters, must include:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)
- **Confirm Password**: Must match password

### Login
- **Email**: Valid email format
- **Password**: Required

## Component Documentation

### UI Components

#### Button
```tsx
<Button 
  variant="primary|secondary|outline"
  size="small|medium|large"
  fullWidth={boolean}
  isLoading={boolean}
  onClick={handler}
>
  Text
</Button>
```

#### InputField
```tsx
<InputField
  label="Label"
  name="fieldName"
  type="text|email|password"
  value={value}
  onChange={handler}
  error={errorMessage}
  helperText="Helper text"
  placeholder="Placeholder"
/>
```

#### Spinner
```tsx
<Spinner size="small|medium|large" color="primary|white" />
```

### Custom Hooks

#### useAuth
```tsx
const { tenant, token, isAuthenticated, isLoading, login, logout } = useAuth();
```

## Security Features

- Password strength validation
- XSS protection through React's built-in escaping
- CSRF tokens can be added via axios interceptors
- Secure password input fields
- Token expiration handling
- Automatic logout on 401 responses

## Styling Approach

- **CSS Modules** for component-scoped styling
- **Minimal design** with focus on functionality
- **Responsive** layout using flexbox
- **Color scheme**: Blue primary (#3b82f6), gradient backgrounds
- **No external UI libraries** for minimal bundle size

## Future Enhancements

- [ ] Remember me functionality
- [ ] Password reset flow
- [ ] Email verification
- [ ] Multi-factor authentication
- [ ] Session timeout warnings
- [ ] Refresh token rotation
- [ ] Social login integration
- [ ] Dark mode support

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT
