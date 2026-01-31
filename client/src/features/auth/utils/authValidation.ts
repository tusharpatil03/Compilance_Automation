// validate password strength
export const validatePasswordStrength = (password: string): boolean => {
    // At least 8 characters, one uppercase, one lowercase, one number, one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// validate email format
export const validateEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// validate name length
export const validateNameLength = (name: string, minLength: number = 3, maxLength: number = 255): boolean => {
    return name.length >= minLength && name.length <= maxLength;
};