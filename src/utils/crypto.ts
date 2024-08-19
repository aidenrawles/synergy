import CryptoJS from 'crypto-js';
import { UserType } from '../types/enums';

export interface RegisterToken {
  iss: string;
  email: string;
  role: UserType;
}

const registerTokenSecret = import.meta.env.VITE_REGISTER_SECRET as string;

/**
 * Encrypts a RegisterToken object into a string.
 *
 * @param {RegisterToken} obj - The RegisterToken object to encrypt.
 * @returns {string} The encrypted and encoded token.
 */
export const encrypt = (obj: RegisterToken): string => {
  const plainText = JSON.stringify(obj);
  const cipherText = CryptoJS.AES.encrypt(plainText, registerTokenSecret).toString();
  return encodeURIComponent(cipherText);
};

/**
 * Decrypts an encrypted token string into a RegisterToken object.
 *
 * @param {string | undefined} token - The encrypted token string to decrypt.
 * @returns {RegisterToken} The decrypted RegisterToken object.
 */
export const decrypt = (token: string | undefined): RegisterToken => {
  let result: RegisterToken = {
    iss: '',
    email: '',
    role: UserType.Student,
  };

  try {
    if (token) {
      if (token !== 'student') {
        token = decodeURIComponent(token);
        const bytes = CryptoJS.AES.decrypt(token, registerTokenSecret);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        result = JSON.parse(decryptedText) as RegisterToken;
      }
    }
  } catch (error) {
    console.error('Decrypt error:', error);
  }

  return result;
};
