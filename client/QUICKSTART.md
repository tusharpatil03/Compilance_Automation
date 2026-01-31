# Quick Start Guide - Tenant Authentication

## 🚀 Get Started in 3 Steps

### 1. Environment Setup
```bash
cd client
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 2. Install & Run
```bash
pnpm install
pnpm dev
```

### 3. Access the Application
- Open browser: `http://localhost:5173` (or the port shown in terminal)
- Register page: `http://localhost:5173/register`
- Login page: `http://localhost:5173/login`

## 📋 Test Flow

### Register a New Tenant
1. Go to `/register`
2. Enter:
   - Company Name: "Test Company"
   - Email: "test@example.com"
   - Password: "Password123!" (must meet requirements)
   - Confirm Password: "Password123!"
3. Click "Register"
4. You'll be redirected to `/dashboard`

### Login with Existing Tenant
1. Go to `/login`
2. Enter credentials
3. Click "Login"
4. Redirected to `/dashboard`

## 🔧 Troubleshooting

### Server Connection Issues
- Ensure backend server is running on port 3000
- Check `VITE_API_BASE_URL` in `.env`
- Verify CORS is enabled on backend

### Registration Fails
- Check password meets requirements (8+ chars, uppercase, lowercase, number, special char)
- Ensure email format is valid
- Check if email already exists in database

### Login Issues
- Verify credentials are correct
- Check if tenant account is active (not suspended)
- Clear browser localStorage and try again

### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Vite cache
rm -rf node_modules/.vite
pnpm dev
```

## 📝 Key Files to Know

- **Auth Context**: `src/context/AuthContext.tsx`
- **Auth Services**: `src/features/auth/services/authServices.ts`
- **Login Form**: `src/features/auth/components/LoginForm.tsx`
- **Register Form**: `src/features/auth/components/RegisterForm.tsx`
- **Routes**: `src/routes/`

## 🎨 Customization

### Change Primary Color
Edit CSS modules and replace `#3b82f6` with your color.

### Add Logo
1. Add logo to `src/assets/`
2. Import in `AuthLayout.tsx`
3. Display above title

### Modify Validation Rules
Edit `src/features/auth/utils/authValidation.ts`

## 📚 Full Documentation
See `README_AUTH.md` for complete documentation.
