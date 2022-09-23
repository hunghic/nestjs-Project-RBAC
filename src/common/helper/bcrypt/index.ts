import * as bcrypt from 'bcrypt';

const _saltOrRounds = (): number => {
  return +process.env.SALT_ROUNDS || 10;
};

export const hashData = (data: string): string => {
  return bcrypt.hashSync(data, _saltOrRounds());
};

export const compareData = (plainData: string, hashedData: string): boolean => {
  return bcrypt.compareSync(plainData, hashedData);
};
