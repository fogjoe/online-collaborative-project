export interface MailJob {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}
