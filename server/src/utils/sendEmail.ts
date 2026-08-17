import nodemailer from 'nodemailer';

// 1. Define the custom interface for Nodemailer errors
interface NodemailerError extends Error {
    code?: string;
    responseCode?: number;
    command?: string;
    rejected?: string[];
    rejectedErrors?: Error[];
}

// 2. Type guard helper to check if an unknown error is a NodemailerError/Error
function isNodemailerError(err: unknown): err is NodemailerError {
    return typeof err === "object" && err !== null && "message" in err;
}

export async function sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        await transporter.verify();
        console.log("Server is ready to take our messages");
    } catch (err) {
        throw new Error(`Failed to verify email transporter: ${err}`);
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html
        });
    } catch (err) {
        if (isNodemailerError(err)) {
            switch (err?.code) {
                case "ECONNECTION":
                case "ETIMEDOUT":
                    console.error("Network error - retry later:", err.message);
                    break;
                case "EAUTH":
                    console.error("Authentication failed:", err.message);
                    break;
                case "EENVELOPE":
                    // err.rejected is only present when every recipient was refused
                    console.error("Invalid envelope:", err.message, err.rejected || []);
                    break;
                default:
                    console.error("Send failed:", err.message);
            }
        }
        console.log("Failed to send email:", err);
        throw new Error(`Failed to send email: ${err}`);
    }
}