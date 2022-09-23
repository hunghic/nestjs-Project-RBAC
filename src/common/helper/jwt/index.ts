import * as jwt from 'jsonwebtoken';

const _accessTokenSecret = (): string => {
  return process.env.ACCESS_TOKEN_SECRET_KEY || 'at-secret';
};

const _refreshTokenSecret = (): string => {
  return process.env.REFRESH_TOKEN_SECRET_KEY || 'rt-secret';
};

const _confirmMailSecret = (): string => {
  return process.env.CONFIRM_EMAIL_SECRET_KEY || 'confirm-email-secret';
};

const _resetPasswordSecret = (): string => {
  return process.env.RESET_PASSWORD_SECRET_KEY || 'reset-password-secret';
};

export const generateAccessToken = (data: any): string => {
  return jwt.sign(data, _accessTokenSecret(), {
    expiresIn: '1d',
  });
};

export const generateRefreshToken = (data: any): string => {
  return jwt.sign(data, _refreshTokenSecret(), {
    expiresIn: '30d',
  });
};

export const generateConfirmEmailToken = (data: any): string => {
  return jwt.sign(data, _confirmMailSecret(), {
    expiresIn: '7d',
  });
};

export const generateResetPasswordToken = (data: any): string => {
  return jwt.sign(data, _resetPasswordSecret(), {
    expiresIn: '10m',
  });
};

export const verifyAccessToken = (token: string): any => {
  return jwt.verify(token, _accessTokenSecret());
};

export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, _refreshTokenSecret());
};

export const verifyConfirmEmailToken = (token: string): any => {
  return jwt.verify(token, _confirmMailSecret());
};

export const verifyResetPasswordToken = (token: string): any => {
  return jwt.verify(token, _resetPasswordSecret());
};

export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};
