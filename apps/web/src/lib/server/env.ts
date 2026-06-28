function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  apiUrl: requiredEnv('PARTSANJ_API_URL').replace(/\/+$/, ''),
  authRequestOtpPath: requiredEnv('PARTSANJ_AUTH_REQUEST_OTP_PATH'),
  authVerifyOtpPath: requiredEnv('PARTSANJ_AUTH_VERIFY_OTP_PATH'),
  authMePath: requiredEnv('PARTSANJ_AUTH_ME_PATH'),
} as const;
