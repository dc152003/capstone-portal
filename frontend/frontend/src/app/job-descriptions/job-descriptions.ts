import { Component, OnInit } from '@angular/core';
import { JobService } from '../services/job.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../shared/navbar/navbar';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
 
@Component({
  selector: 'app-job-descriptions',
  standalone: true,
  imports: [CommonModule,FormsModule, NavbarComponent],
  templateUrl: './job-descriptions.html',
  styleUrls: ['./job-descriptions.css']
})
export class JobDescriptions implements OnInit {
  jobs: any[] = [];
  filteredJobs: any[] = [];
  searchTerm: string = '';
  constructor(private jobService: JobService, private router: Router) {}
 
  ngOnInit() {
    this.jobService.list().subscribe(j => {this.jobs = j || [];
      this.filteredJobs = this.jobs;
  });
  }
 
  // viewFull(job: any) {
  //   alert(`Title: ${job.title}\n\nDescription:\n${job.description}`);
  // }
 
  filterJobs() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredJobs = this.jobs;
      return;
    }
    this.filteredJobs = this.jobs.filter(job =>
      (job.title?.toLowerCase().includes(term) || job.location?.toLowerCase().includes(term))
    );
  }
 
  viewFull(job: any) {
    this.router.navigate(['/dashboard/job-description-view', job._id]);
  }
 
 
  apply(job: any) {
    this.router.navigate(['/dashboard/resume-upload'], { queryParams: { jobId: job._id } });
  }
}
 
 