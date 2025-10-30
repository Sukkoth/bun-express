import { env } from '@libs/configs';
import { AppException } from '@libs/exceptions/app-exception';
import Logger from '@libs/logger';
import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
} from '@getbrevo/brevo';

const transactionalEmailsApi = new TransactionalEmailsApi();
transactionalEmailsApi.setApiKey(
  TransactionalEmailsApiApiKeys.apiKey,
  env.BREVO_API_KEY,
);

type SendEmailParams = {
  from?: string;
  to: string;
  clientName: string;
  subject: string;
  html: string;
};

export async function sendEmail({
  from = env.BREVO_SENDER_EMAIL,
  to,
  clientName,
  subject,
  html,
}: SendEmailParams) {
  try {
    const result = await transactionalEmailsApi.sendTransacEmail({
      to: [{ email: to, name: clientName }],
      subject,
      htmlContent: html,
      sender: { email: from, name: 'WorkSpaced' },
    });

    Logger.info({ message: 'Email sent!', messageId: result.body.messageId });
    return result.body.messageId;
  } catch (error) {
    Logger.error({
      message: 'Error sending password reset email',
      error,
    });
    throw AppException.internalServerError({ message: 'Something Went Wrong' });
  }
}

export function generateEmailTemplate(
  type: 'forgotPassword' | 'register',
  data?: { token?: string },
) {
  const baseUrl = env.BASE_URL;

  const styles = `
    body { font-family: Arial, sans-serif; background: #f8f9fa; padding: 20px; }
    .container { background: white; border-radius: 8px; padding: 24px; max-width: 480px; margin: auto; }
    h1 { color: #222; font-size: 20px; }
    p { color: #444; line-height: 1.6; }
    a.button {
      display: inline-block;
      background: #007bff;
      color: white;
      padding: 10px 16px;
      border-radius: 4px;
      text-decoration: none;
      margin-top: 12px;
    }
  `;

  if (type === 'forgotPassword' && data?.token) {
    return `
      <html>
        <head><style>${styles}</style></head>
        <body>
          <div class="container">
            <h1>Reset Your Password</h1>
            <p>You recently requested to reset your password.</p>
            <p>Copy the token below:</p>
            <blockquote>${data.token}</blockquote>
            <p>If you didn’t request this, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `;
  }

  if (type === 'register') {
    return `
      <html>
        <head><style>${styles}</style></head>
        <body>
          <div class="container">
            <h1>Welcome!</h1>
            <p>Your account has been created successfully.</p>
            <p>You can now log in to your account.</p>
            <a class="button" href="${baseUrl}/login">Login Now</a>
          </div>
        </body>
      </html>
    `;
  }

  throw new Error('Invalid email template type or missing data');
}
