import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = 'http://localhost:5000/api/dashboard';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getStats() {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token || ''}`
    });
    return this.http.get<{
      jobs: number;
      resumes: number;
      candidates: number;
      candidatesApplied: number;
    }>(`${this.apiUrl}/stats`, { headers });
  }
}
