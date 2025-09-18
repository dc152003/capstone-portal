import { Component, OnInit } from '@angular/core';
import { JobService } from '../services/job.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../shared/navbar/navbar';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-best-fit-candidate',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule, RouterModule],
  templateUrl: './best-fit-candidate.html',
  styleUrls: ['./best-fit-candidate.css']
})

export class BestFitCandidate implements OnInit {
  jobs: any[] = [];
  selectedJobId: string = '';
  topN = 5;
  candidates: any[] = [];
  loading = false;  // <-- add loading state

  private apiUrl = 'http://localhost:5000/api';

  constructor(
    private jobService: JobService,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  getSkillsAsString(c: any): string {
    if (!c.skills) return '';
    if (Array.isArray(c.skills)) {
      if (c.skills.length > 0 && typeof c.skills[0] === 'object' && 'skill' in c.skills[0]) {
        return c.skills.map((s: any) => s.skill).join(', ');
      }
      return c.skills.join(', ');
    }
    return '';
  }

  ngOnInit() {
    this.jobService.list().subscribe({
      next: (j) => this.jobs = j || []
    });
  }

  fetchTop() {
    if (!this.selectedJobId) {
      alert('Select a job first');
      return;
    }
    const count = this.topN || 5;

    const token = this.auth.getToken() || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.loading = true;  // start loading
    this.candidates = [];  // clear previous results

    this.http.post<any[]>(
      `${this.apiUrl}/bestfit`,
      { jobId: this.selectedJobId, count },
      { headers }
    ).subscribe({
      next: (res) => {
        this.candidates = res || [];
        this.loading = false;  // stop loading
      },
      error: () => {
        alert('Failed to fetch recommendations');
        this.loading = false;  // stop loading on error
      }
    });
  }

  exportReport(resumeId: string) {
    const token = this.auth.getToken() || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    const url = `${this.apiUrl}/bestfit/report/${resumeId}`;
    this.http.get(url, { headers, responseType: 'blob' }).subscribe(blob => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `candidate_summary_${resumeId}.pdf`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    }, err => {
      alert('Failed to download report');
    });
  }

  exportAllReport() {
    if (!this.selectedJobId) {
      alert('Select a job first');
      return;
    }
    const count = this.topN || 5;
  
    const token = this.auth.getToken() || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  
    this.http.post(
      `${this.apiUrl}/bestfit/report-all`,
      { jobId: this.selectedJobId, count },
      { headers, responseType: 'blob' }
    ).subscribe(blob => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `bestfit_candidates_report_${this.selectedJobId}.pdf`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    }, err => {
      alert('Failed to download combined report');
    });
  }
}