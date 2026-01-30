import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


export const hashPassword = (password: string, salt?: string): { hashedPassword: string, salt: string } => {
    if (!salt) {
        salt = bcrypt.genSaltSync(10);
    }
    const hashedPassword = bcrypt.hashSync(password, salt);
    return { hashedPassword, salt: salt };
}

export const comparePassword = (password: string, hashedPassword: string, salt: string): boolean => {
    const hashToCompare = bcrypt.hashSync(password, salt);
    return hashToCompare === hashedPassword;
}

export const generateApiKey = (): string => {
    const apiKey = bcrypt.genSaltSync(20);
    return apiKey.replace(/\//g, ''); // remove / to make it URL safe
}

export const hashApiKey = (apiKey: string): string => {
    const hashedApiKey = bcrypt.hashSync(apiKey);
    return hashedApiKey;
}

export type JWTPayload = {
    id: number;
    email: string;
}

export const generateJWTToken = (JWTPayload: JWTPayload): string => {
    const secretKey = process.env.ACCESS_TOKEN_SECRET;
    if (!secretKey) {
        throw new Error("JWT secret key is not defined in environment variables");
    }
    const token = jwt.sign({
        id: JWTPayload.id,
        email: JWTPayload.email
    },
        secretKey,
        { expiresIn: "1h" }); // default 1 hour
    return token;
}