import bcrypt from 'bcryptjs';

type HashPayLoad = {
    password: string,
    salt?: string
} 
export const hashPasword = (payload: HashPayLoad): { hashedPassword: string, salt: string } => {
    if(!payload.salt){
        payload.salt = bcrypt.genSaltSync(10);
    }
    const hashedPassword = bcrypt.hashSync(payload.password, payload.salt);
    return {hashedPassword, salt: payload.salt};
}