import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../shared/navbar/navbar';
import { AuthService } from '../services/auth.service';
import { Footer } from '../shared/footer/footer';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, Footer],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  role: string | null = null;
  usernameDisplay = 'User';
  stats = {
    jobs: 0,
    resumes: 0,
    candidates: 0,
    candidatesApplied: 0
  };

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.role = this.auth.getRole();
    const username = this.auth.getUsername();
    this.usernameDisplay = username || 'User';

    if (this.role === 'hr-admin') {
      this.dashboardService.getStats().subscribe({
        next: (data) => {
          this.stats.jobs = data.jobs || 0;
          this.stats.resumes = data.resumes || 0;
          this.stats.candidates = data.candidates || 0;
          this.stats.candidatesApplied = data.candidatesApplied || 0;
        },
        error: (err) => {
          console.warn('Could not fetch stats', err);
        }
      });
    }
  }
}
