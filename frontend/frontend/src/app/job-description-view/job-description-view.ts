import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JobService, Job } from '../services/job.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../shared/navbar/navbar';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-job-description-view',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterModule],
  templateUrl: './job-description-view.html',
  styleUrls: ['./job-description-view.css']
})
export class JobDescriptionView implements OnInit {
  job: Job | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private jobService: JobService,
    private router: Router
  ) {}

  ngOnInit() {
    const jobId = this.route.snapshot.paramMap.get('id');
    if (!jobId) {
      this.error = 'Invalid Job ID';
      this.loading = false;
      return;
    }

    this.jobService.get(jobId).subscribe({
      next: (data: Job) => {
        this.job = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load job description.';
        this.loading = false;
      }
    });
  }

  downloadPDF() {
    if (!this.job) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(this.job.title, 10, 20);

    doc.setFontSize(12);
    doc.text(`Location: ${this.job.location || 'N/A'}`, 10, 30);
    doc.text(`Experience: ${this.job.experience || 'N/A'} years`, 10, 38);
    doc.text(`Preferred Skills: ${this.job.preferredSkills?.join(', ') || 'N/A'}`, 10, 46);
    doc.text(`Education: ${this.job.education || 'N/A'}`, 10, 54);

    const splitDescription = doc.splitTextToSize(this.job.description || '', 180);
    doc.text('Description:', 10, 64);
    doc.text(splitDescription, 10, 72);

    doc.save(`${this.job.title.replace(/\s+/g, '_')}_JD.pdf`);
  }

  goBack() {
    this.router.navigate(['/dashboard/job-descriptions']);
  }
}
