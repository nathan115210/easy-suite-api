import type { Response } from 'express';
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '@/modules/auth/auth-token/auth-token.cookies';
import { REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_DURATION_MS } from '@/types/auth-token.types';

function makeRes() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;
}

describe('setRefreshTokenCookie', () => {
  it('calls res.cookie with the correct name and token', () => {
    const res = makeRes();

    setRefreshTokenCookie(res, 'my-refresh-token');

    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      'my-refresh-token',
      expect.any(Object),
    );
  });

  it('sets maxAge to REFRESH_TOKEN_DURATION_MS', () => {
    const res = makeRes();

    setRefreshTokenCookie(res, 'my-refresh-token');

    const options = (res.cookie as jest.Mock).mock.calls[0][2];
    expect(options.maxAge).toBe(REFRESH_TOKEN_DURATION_MS);
  });

  it('sets httpOnly, sameSite lax, and path /', () => {
    const res = makeRes();

    setRefreshTokenCookie(res, 'my-refresh-token');

    const options = (res.cookie as jest.Mock).mock.calls[0][2];
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe('lax');
    expect(options.path).toBe('/');
  });
});

describe('clearRefreshTokenCookie', () => {
  it('calls res.clearCookie with the correct name', () => {
    const res = makeRes();

    clearRefreshTokenCookie(res);

    expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE_NAME, expect.any(Object));
  });

  it('does not include maxAge in the clear options', () => {
    const res = makeRes();

    clearRefreshTokenCookie(res);

    const options = (res.clearCookie as jest.Mock).mock.calls[0][1];
    expect(options.maxAge).toBeUndefined();
  });
});
