import { randomBytes } from 'crypto';

export const randomString = (numberByte: number) => {
  const bytes = randomBytes(numberByte);
  let index = bytes.length;
  while (index--) {
    bytes[index] = toLetter(bytes[index]);
  }
  return bytes.toString();
};

const toLetter = (byte: number) => {
  if (byte < 0) {
    byte *= -1;
  }
  const endAccepted = '}'.charCodeAt(0);
  if (byte > endAccepted) {
    byte %= endAccepted + 1;
  }
  if (byte < '!'.charCodeAt(0)) {
    byte = byte + endAccepted - '!'.charCodeAt(0);
  }
  return byte;
};
