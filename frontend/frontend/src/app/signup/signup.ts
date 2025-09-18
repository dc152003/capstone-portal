import { Component } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../services/auth.service';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterModule, NgIf, CommonModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class Signup {
  username = '';
  email = '';
  password = '';
  role = 'candidate';

  signupSuccessMessage = '';
  signupErrorMessage = '';

  constructor(private http: HttpClient, private router: Router, private auth: AuthService) {}

  signup() {
    this.signupSuccessMessage = '';
    this.signupErrorMessage = '';

    this.http.post<any>('http://localhost:5000/api/auth/signup', {
      username: this.username,
      email: this.email,
      password: this.password,
      role: this.role
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
          setTimeout(() => this.router.navigate(['/dashboard']), 700);
        } catch (e) {
          this.signupErrorMessage = 'Could not parse signup token';
        }
      },
      error: (err) => {
        this.signupErrorMessage = err.error?.error || 'Signup failed. Please try again.';
      }
    });
  }
}
