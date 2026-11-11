export interface SmsMessage {
  to: string;
  message: string;
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<void>;
}

export interface AfricaTalkingConfig {
  apiKey: string;
  username: string;
  senderId?: string;
  environment: 'sandbox' | 'production';
}

type FetchLike = typeof fetch;

export class AfricaTalkingSmsProvider implements SmsProvider {
  private readonly endpoint: string;

  constructor(
    private readonly config: AfricaTalkingConfig,
    private readonly fetcher: FetchLike = fetch,
  ) {
    const host = config.environment === 'sandbox' ? 'api.sandbox.africastalking.com' : 'api.africastalking.com';
    this.endpoint = `https://${host}/version1/messaging`;
  }

  async send({ to, message }: SmsMessage): Promise<void> {
    const body = new URLSearchParams({
      username: this.config.username,
      to,
      message,
    });
    if (this.config.senderId) body.set('from', this.config.senderId);

    let response: Response;
    try {
      response = await this.fetcher(this.endpoint, {
        method: 'POST',
        headers: {
          apikey: this.config.apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new Error('SMS provider request failed');
    }

    if (response.status !== 201) throw new Error('SMS provider rejected the message');
  }
}

export function getConfiguredSmsProvider(): SmsProvider | null {
  if (process.env.SMS_PROVIDER !== 'africas_talking') return null;
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;
  if (!apiKey || !username) return null;

  return new AfricaTalkingSmsProvider({
    apiKey,
    username,
    senderId: process.env.AT_SENDER_ID || undefined,
    environment: process.env.AT_ENV === 'production' ? 'production' : 'sandbox',
  });
}
