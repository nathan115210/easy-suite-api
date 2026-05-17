import type { Response } from 'express';
import {
  setSessionCookie,
  clearSessionCookie,
} from '../../../src/modules/auth/auth-sessions/auth-sessions.cookies';
import { AUTH_SESSION_COOKIE_NAME, SESSION_DURATION_MS } from '../../../types/auth.types';

function makeRes() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;
}

describe('setSessionCookie', () => {
  it('calls res.cookie with the session cookie name and session id', () => {
    const res = makeRes();
    setSessionCookie(res, 'session-123');
    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_SESSION_COOKIE_NAME,
      'session-123',
      expect.any(Object),
    );
  });

  it('sets httpOnly, sameSite, and path cookie options', () => {
    const res = makeRes();
    setSessionCookie(res, 'session-123');
    const [, , options] = (res.cookie as jest.Mock).mock.calls[0];
    expect(options).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' });
  });

  it('sets maxAge to SESSION_DURATION_MS', () => {
    const res = makeRes();
    setSessionCookie(res, 'session-123');
    const [, , options] = (res.cookie as jest.Mock).mock.calls[0];
    expect(options.maxAge).toBe(SESSION_DURATION_MS);
  });
});

describe('clearSessionCookie', () => {
  it('calls res.clearCookie with the session cookie name', () => {
    const res = makeRes();
    clearSessionCookie(res);
    expect(res.clearCookie).toHaveBeenCalledWith(AUTH_SESSION_COOKIE_NAME, expect.any(Object));
  });

  it('clears the cookie without maxAge', () => {
    const res = makeRes();
    clearSessionCookie(res);
    const [, options] = (res.clearCookie as jest.Mock).mock.calls[0];
    expect(options).not.toHaveProperty('maxAge');
  });

  it('clears with the same base options used when setting (httpOnly, sameSite, path)', () => {
    const res = makeRes();
    clearSessionCookie(res);
    const [, options] = (res.clearCookie as jest.Mock).mock.calls[0];
    expect(options).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' });
  });
});
