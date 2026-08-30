import { Router } from 'express';
import { validagteBody } from '../../utils/inputValidator';
import { createIdentity } from './controllers/createIdentity';
import { verifyEmailController } from './controllers/verifyEmail';
import { verifyPhoneController } from './controllers/verifyPhone';
import { RegisterIdentity, VerifyEmail, VerifyPhone } from './zodschema';

const router = Router();

router.post(
    '/',
    validagteBody(RegisterIdentity),
    createIdentity
);

router.post(
    '/verify/email',
    validagteBody(VerifyEmail),
    verifyEmailController
);

router.post(
    '/verify/phone',
    validagteBody(VerifyPhone),
    verifyPhoneController
);

export default router;