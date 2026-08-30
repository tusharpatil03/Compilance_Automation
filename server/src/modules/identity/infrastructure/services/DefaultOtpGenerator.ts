import { generateOTP } from '../../../../utils/generateOTP';
import type { OtpGenerator } from '../../application/ports/OtpGenerator';

export class DefaultOtpGenerator implements OtpGenerator {
    generate(): string {
        return generateOTP();
    }
}
