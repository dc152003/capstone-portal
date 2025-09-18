import { Component } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterModule, NgIf, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email = '';
  password = '';
  loginSuccessMessage = '';
  loginErrorMessage = '';

  constructor(private http: HttpClient, private router: Router, private auth: AuthService) {}

  login() {
    this.loginSuccessMessage = '';
    this.loginErrorMessage = '';

    this.http.post<any>('http://localhost:5000/api/auth/login', {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        const token = res.token;
        try {
          const decoded: any = jwtDecode(token);
          this.auth.setAuth(
            token,
            decoded.user.role,
            decoded.user.username,
            decoded.user.email
          );
          this.router.navigate(['/dashboard']);
        } catch (e) {
          this.loginErrorMessage = 'Failed to parse token';
        }
      },
      error: (err) => {
        this.loginErrorMessage = err.error?.error || 'Wrong email or password';
      }
    });
  }
}
