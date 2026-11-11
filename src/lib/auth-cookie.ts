/** Use Secure cookies for HTTPS deployments while allowing local HTTP access. */
export function shouldUseSecureAuthCookie(): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      return new URL(appUrl).protocol === 'https:';
    } catch {
      // Fall back to production mode when the configured URL is malformed.
    }
  }

  return process.env.NODE_ENV === 'production';
}
