// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { NavbarComponent } from '../shared/navbar/navbar';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { AuthService } from '../services/auth.service';
// import { RouterModule, Router } from '@angular/router';

// @Component({
//   selector: 'app-display-resumes',
//   standalone: true,
//   imports: [CommonModule, NavbarComponent, RouterModule],
//   templateUrl: './display-resumes.html',
//   styleUrls: ['./display-resumes.css']
// })
// export class DisplayResumes implements OnInit {
//   resumes: any[] = [];
//   errorMessage = '';
//   private apiUrl = 'http://localhost:5000/api';

//   constructor(
//     private http: HttpClient,
//     private auth: AuthService,
//     private router: Router
//   ) {}

//   ngOnInit() {
//     // Check role, redirect if not hr-admin
//     if (this.auth.getRole() !== 'hr-admin') {
//       this.router.navigate(['/dashboard']);
//       return;
//     }
//     this.loadResumes();
//   }

//   getAuthHeaders() {
//     const token = this.auth.getToken();
//     return {
//       headers: new HttpHeaders({
//         Authorization: `Bearer ${token || ''}`
//       })
//     };
//   }

//   loadResumes() {
//     this.http.get<any[]>(`${this.apiUrl}/resumes/all`, this.getAuthHeaders()).subscribe({
//       next: data => {
//         this.resumes = data || [];
//       },
//       error: err => {
//         this.errorMessage = err.error?.msg || 'Failed to load resumes';
//       }
//     });
//   }

//   getResumeUrl(path: string): string {
//     // Assuming resumeUrl is a relative path like "uploads/resumes/filename.pdf"
//     // Adjust base URL accordingly if needed
//     if (!path) return '#';
//     if (path.startsWith('http')) return path;
//     return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
//   }
// }


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../shared/navbar/navbar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
 
@Component({
  selector: 'app-display-resumes',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterModule, FormsModule],
  templateUrl: './display-resumes.html',
  styleUrls: ['./display-resumes.css']
})
export class DisplayResumes implements OnInit {
  resumes: any[] = [];
  filteredResumes: any[] = [];
  searchTerm: string = '';
  errorMessage = '';
  private apiUrl = 'http://localhost:5000/api';
 
  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}
 
  ngOnInit() {
    if (this.auth.getRole() !== 'hr-admin') {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadResumes();
  }
 
 
  getAuthHeaders() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token || ''}`
      })
    };
  }
 
  loadResumes() {
    this.http.get<any[]>(`${this.apiUrl}/resumes/all`, this.getAuthHeaders()).subscribe({
      next: data => {
        this.resumes = data || [];
        this.filteredResumes = [...this.resumes]; // Initialize filteredResumes here
      },
      error: err => {
        this.errorMessage = err.error?.msg || 'Failed to load resumes';
      }
    });
  }
 
  filterResumes() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredResumes = [...this.resumes];
      return;
    }
 
    this.filteredResumes = this.resumes.filter(r =>
      (r.candidateName?.toLowerCase().includes(term) || r.jobDescription?.toLowerCase().includes(term))
    );
  }
 
  highlight(text: string): SafeHtml {
    if (!this.searchTerm) return text;
    if (!text) return '';
    const term = this.searchTerm.replace(/[-\/\\^$*+?.()|[$${}]/g, '\\$&'); // escape regex chars
    const regex = new RegExp(`(${term.split(' ').filter(t => t).join('|')})`, 'gi'); // split by space for word-by-word
    const highlighted = text.replace(regex, `<mark>$1</mark>`);
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
  getResumeUrl(path: string): string {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
  }
}
 