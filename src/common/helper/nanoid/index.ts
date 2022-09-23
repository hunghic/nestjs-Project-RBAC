import { customAlphabet } from 'nanoid';

enum prefixCode {
  product = 'PD',
  order = 'OD',
  voucher = 'VC',
}

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const generateProductCode = () => {
  const nanoid = customAlphabet(alphabet, 12);
  return `${prefixCode.product}${nanoid()}`;
};

export const generateOrderCode = () => {
  const nanoid = customAlphabet(alphabet, 14);
  return `${prefixCode.order}${nanoid()}`;
};

export const generateVoucherCode = () => {
  const nanoid = customAlphabet(alphabet, 12);
  return `${prefixCode.voucher}${nanoid()}`;
};
