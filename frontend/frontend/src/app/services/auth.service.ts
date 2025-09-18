import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRole(): string | null {
    return localStorage.getItem('user_role');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getEmail(): string | null {
    return localStorage.getItem('email');
  }

  setAuth(token: string, role: string, username: string, email: string) {
    this.setToken(token);
    localStorage.setItem('user_role', role);
    localStorage.setItem('username', username);
    localStorage.setItem('email', email);
  }

  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
  }
}
