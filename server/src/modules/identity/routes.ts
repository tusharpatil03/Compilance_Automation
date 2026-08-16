import { Router } from 'express';
import { validagteBody } from '../../utils/inputValidator';
import { createIdentity } from './controllers/createIdentity';
import { RegisterIdentity } from './zodschema';

const router = Router();

router.post(
    '/',
    validagteBody(RegisterIdentity),
    createIdentity
);

export default router;