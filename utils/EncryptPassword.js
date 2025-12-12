import CryptoJS from "crypto-js";

const keyFromEnv = process.env.ENCRYPT_KEY;

export const encrypt = (data) => {
  return CryptoJS.AES.encrypt(data, keyFromEnv).toString();
};

export const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, keyFromEnv);
  return bytes.toString(CryptoJS.enc.Utf8);
};

