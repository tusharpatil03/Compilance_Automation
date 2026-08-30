import { sendEmail } from '../../../../utils/sendEmail';
import type { EmailSender } from '../../application/ports/EmailSender';

export class NodemailerEmailSender implements EmailSender {
    async send(recipient: string, subject: string, body: string): Promise<void> {
        await sendEmail(recipient, subject, body, '');
    }
}
