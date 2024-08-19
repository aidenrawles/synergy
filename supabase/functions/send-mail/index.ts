import { SMTPClient, SendConfig } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';

const MAIL_SENDER = Deno.env.get('MAIL_SENDER')!;
const MAIL_PASSWORD = Deno.env.get('MAIL_PASSWORD')!;

const client = new SMTPClient({
  connection: {
    hostname: 'smtp.gmail.com',
    port: 465,
    tls: true,
    auth: {
      username: MAIL_SENDER,
      password: MAIL_PASSWORD,
    },
  },
});

/**
 * Interface representing the email information.
 */
interface EmailInfo {
  to: string;
  subject: string;
  content: string;
  html: string;
}

/**
 * Sends an email using the configured SMTP client.
 * @param {EmailInfo} emailInfo - The email information.
 * @returns {Promise<void>}
 */
const sendEmail = async (emailInfo: EmailInfo): Promise<void> => {
  const { to, subject, content, html } = emailInfo;
  const body: SendConfig = {
    from: `Synergy <${MAIL_SENDER}>`,
    to,
    subject,
    content,
    html,
  };

  await client.send(body);
  await client.close();
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'POST') {
    try {
      const { emailInfo }: { emailInfo: EmailInfo } = await req.json();

      await sendEmail(emailInfo);
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Request processing error:', error);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  } else {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }
});
