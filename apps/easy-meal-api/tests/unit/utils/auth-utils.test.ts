jest.mock('argon2', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    verify: jest.fn(),
    argon2id: 2,
  },
}));

import argon2 from 'argon2';
import { hashPassword, toPublicUser, verifyPassword } from '../../../src/utils/auth-utils';

const mockArgon2Hash = argon2.hash as jest.Mock;
const mockArgon2Verify = argon2.verify as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('hashPassword', () => {
  it('hashes the password using argon2id', async () => {
    mockArgon2Hash.mockResolvedValue('hashed-value');

    const result = await hashPassword('A1b');

    expect(result).toBe('hashed-value');
    expect(mockArgon2Hash).toHaveBeenCalledWith('A1b', { type: argon2.argon2id });
  });

  it('propagates argon2 hash errors', async () => {
    mockArgon2Hash.mockRejectedValue(new Error('hash failed'));

    await expect(hashPassword('A1b')).rejects.toThrow('hash failed');
  });
});

describe('verifyPassword', () => {
  it('returns true when argon2 verify succeeds', async () => {
    mockArgon2Verify.mockResolvedValue(true);

    const result = await verifyPassword('A1b', 'hashed-value');

    expect(result).toBe(true);
    expect(mockArgon2Verify).toHaveBeenCalledWith('hashed-value', 'A1b');
  });

  it('returns false when argon2 verify fails', async () => {
    mockArgon2Verify.mockResolvedValue(false);

    const result = await verifyPassword('A1b', 'hashed-value');

    expect(result).toBe(false);
  });
});

describe('toPublicUser', () => {
  it('returns only id, username, and email fields', () => {
    const result = toPublicUser({
      id: 'user-1',
      username: 'johndoe',
      email: 'john@example.com',
    });

    expect(result).toEqual({
      id: 'user-1',
      username: 'johndoe',
      email: 'john@example.com',
    });
  });
});
