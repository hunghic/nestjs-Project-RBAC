import * as argon from 'argon2';

export const hashDataArgon = async (data: string): Promise<string> => {
  return await argon.hash(data);
};

export const verifyDataArgon = async (
  hashedData: string,
  plainData: string,
): Promise<boolean> => {
  return await argon.verify(hashedData, plainData);
};
