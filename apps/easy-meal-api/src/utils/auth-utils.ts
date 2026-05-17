import argon2 from 'argon2';
import type { PublicUserData } from '@/types/auth.types';

export const hashPassword = async (password: string): Promise<string> =>
  argon2.hash(password, {
    type: argon2.argon2id,
  });

export const verifyPassword = async (password: string, passwordHash: string): Promise<boolean> => {
  return argon2.verify(passwordHash, password);
};

export function toPublicUser(user: {
  id: string;
  username: string;
  email: string;
}): PublicUserData {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}
