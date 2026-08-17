import { UnitOfWork } from "../../../repositories/UnitOfWork";
import { sendEmail } from "../../../utils/sendEmail";
import { generateOTP } from "../../../utils/generateOTP";
import { OtpCodeRepository } from "../repository";
import type { NewOtpCode, OtpCode, otpPurposeEnum } from "../schema";
import { hashPassword } from "../../../utils/security";

export async function verifyEmail(uow: UnitOfWork, identityId: string): Promise<void> {

}

export async function verifyPhone(uow: UnitOfWork, identityId: string): Promise<void> { }