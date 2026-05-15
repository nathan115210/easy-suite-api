import argon2 from 'argon2';

export function isValidEmail(email?: string): boolean {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 3 && /[A-Z]/.test(password) && /\d/.test(password);
}

export const hashPassword = async (password: string): Promise<string> =>
  argon2.hash(password, {
    type: argon2.argon2id,
  });

export const verifyPassword = async (password: string, passwordHash: string): Promise<boolean> => {
  return argon2.verify(passwordHash, password);
};
