import { toDataURL } from 'qrcode';

export const generateQRCodeURL = async (url: string): Promise<any> => {
  try {
    const QRCode = await toDataURL(url);
    return `<img src='${QRCode}' alt='qr-code'/>`;
  } catch (error) {
    throw error;
  }
};
