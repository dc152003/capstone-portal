//frontend\frontend\src\app\resume-upload\resume-upload.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../shared/navbar/navbar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-resume-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, RouterModule],
  templateUrl: './resume-upload.html',
  styleUrls: ['./resume-upload.css']
})
export class ResumeUpload implements OnInit {
  candidateName = '';
  jobs: any[] = [];
  selectedJobId: string = '';
  selectedJob: any = null;
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  isDragOver: boolean = false;
  isHrAdmin = false;
  uploadMessage = '';
  submitMessage = '';
  aiResults: any | null = null;
  loadingAi = false;
  errorAi = '';


  private apiUrl = 'http://localhost:5000/api';

  uploadedResumeId: string | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.isHrAdmin = this.auth.getRole() === 'hr-admin';
    this.loadJobs();

    if (!this.isHrAdmin) {
      const username = this.auth.getUsername();
      if (username) this.candidateName = username;
    }

    this.route.queryParams.subscribe(params => {
      const jobId = params['jobId'];
      if (jobId) {
        this.selectedJobId = jobId;
        if (this.jobs.length > 0) {
          this.selectedJob = this.jobs.find(j => j._id === jobId) || null;
        }
      }
    });
  }

  loadJobs() {
    const headers = this.getAuthHeaders();
    this.http.get<any[]>(`${this.apiUrl}/resumes/jobs`, { headers }).subscribe({
      next: (data) => {
        this.jobs = data || [];
        if (this.selectedJobId) {
          this.selectedJob = this.jobs.find(j => j._id === this.selectedJobId) || null;
        }
      },
      error: () => alert('Failed to load jobs')
    });
  }

  onJobChange() {
    this.selectedJob = this.jobs.find(j => j._id === this.selectedJobId) || null;
  }

  viewJD() {
    if (this.selectedJob) {
      alert(`Title: ${this.selectedJob.title}\n\nPlease navigate to Job Descriptions page to read full details.`);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.selectedFile = file; // your existing file handling
    }
  }

  getAuthHeaders() {
    const token = this.auth.getToken();
    return {
      Authorization: `Bearer ${token || ''}`
    };
  }

  canUpload() {
    return this.candidateName.trim() !== '' && this.selectedJobId !== '' && this.selectedFile !== null;
  }

  canSubmit() {
    return this.candidateName.trim() !== '' && this.selectedJobId !== '' && this.selectedFile !== null;
  }

  uploadResume() {
    if (!this.canUpload()) {
      alert('Please fill all fields and select a file.');
      return;
    }
    const formData = new FormData();
    formData.append('candidateName', this.candidateName);
    formData.append('jobId', this.selectedJobId);
    if (this.selectedFile) {
      formData.append('resume', this.selectedFile);
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken() || ''}`
    });

    this.http.post(`${this.apiUrl}/resumes/upload`, formData, { headers }).subscribe({
      next: (res: any) => {
        this.uploadMessage = res.msg || 'Uploaded successfully';
        this.selectedFile = null;
        if (res._id) {
          this.uploadedResumeId = res._id;
          console.log('Uploaded resume ID:', res._id);
        }
      },
      error: (err) => {
        alert('Upload failed: ' + (err.error?.msg || 'Server error'));
      }
    });
  }

  async analyzeResume() {
    if (!this.uploadedResumeId) {
      alert('Please upload the resume first.');
      return;
    }

    this.loadingAi = true;
    this.errorAi = '';
    this.aiResults = null;

    try {
      const headers = new HttpHeaders(this.getAuthHeaders());
      const result = await this.http.post<any>(
        `${this.apiUrl}/ai/analyze-resume`,
        { resumeId: this.uploadedResumeId },
        { headers }
      ).toPromise();

      this.aiResults = [result];
    } catch (err: any) {
      this.errorAi = err.error?.error || 'Failed to analyze resume';
    } finally {
      this.loadingAi = false;
    }
  }

  onSubmit() {
    this.uploadResume();
    this.submitMessage = 'Resume submitted successfully';
  }

  exportReport(resumeId: string) {
    const headers = new HttpHeaders(this.getAuthHeaders());
    const url = `${this.apiUrl}/bestfit/report/${resumeId}`;
    this.http.get(url, { headers, responseType: 'blob' }).subscribe(blob => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `resume_report_${resumeId}.pdf`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    }, err => {
      alert('Failed to download report');
    });
  }


  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files?.length) {
      const file = event.dataTransfer.files[0];
      this.selectedFileName = file.name;
      this.selectedFile = file;
    }
  }
}
