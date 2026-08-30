export interface EmailSender {
    send(
        recipient: string,
        subject: string,
        body: string
    ): Promise<void>;
}
