import { authenticator } from 'otplib';

export const generateOtpSecret = () => {
  return authenticator.generateSecret();
};

export const generateOtpCode = (secret: string): string => {
  authenticator.options = { digits: 6, step: 120, window: 1 };
  return authenticator.generate(secret);
};

export const generateOtpUri = (
  userName: string,
  serviceName: string,
  secret: string,
): string => {
  authenticator.resetOptions();
  return authenticator.keyuri(userName, serviceName, secret);
};

export const verifyOtpToken = (token: string, secret: string): boolean => {
  authenticator.options = { digits: 6, step: 120, window: 1 };
  return authenticator.verify({ token, secret });
};

export const verifyAuthenticatorCode = (
  token: string,
  secret: string,
): boolean => {
  authenticator.resetOptions();
  return authenticator.verify({ token, secret });
};
