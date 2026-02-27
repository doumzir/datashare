import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getToken, saveToken, removeToken } from './api';

describe('api — token helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('getToken returns null when nothing is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('saveToken stores a token in localStorage', () => {
    saveToken('my-jwt-token');
    expect(localStorage.getItem('datashare_token')).toBe('my-jwt-token');
  });

  it('getToken returns the stored token', () => {
    localStorage.setItem('datashare_token', 'my-jwt-token');
    expect(getToken()).toBe('my-jwt-token');
  });

  it('removeToken clears the token', () => {
    localStorage.setItem('datashare_token', 'my-jwt-token');
    removeToken();
    expect(getToken()).toBeNull();
  });
});
