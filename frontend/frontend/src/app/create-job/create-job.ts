import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../shared/navbar/navbar';
import { JobService } from '../services/job.service';
import { RouterModule } from '@angular/router';
 
@Component({
  selector: 'app-create-job',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, NavbarComponent],
  templateUrl: './create-job.html',
  styleUrls: ['./create-job.css']
})
export class CreateJob implements OnInit {
  jobs: any[] = [];
  filteredJobs: any[] = [];
  searchTerm: string = '';
 
  newJob: any = {
    title: '',
    description: '',
    location: '',
    experience: null,
    preferredSkillsStr: '',
    education: ''
  };
 
  editingJobId: string | null = null;
  addMessage: { type: 'success' | 'error', text: string } | null = null;
  existingJobMessage: { type: 'success' | 'error', text: string } | null = null;
  editedJob: any = {};
 
  constructor(private jobService: JobService) { }
 
  ngOnInit() {
    this.getJobs();
  }
 
  getJobs() {
    this.jobService.list().subscribe(res => {
      this.jobs = res || [];
      this.filteredJobs = this.jobs;
    });
  }
 
  showMessage(type: 'success' | 'error', text: string, target: 'add' | 'existing' = 'existing') {
    if (target === 'add') {
      this.addMessage = { type, text };
      setTimeout(() => this.addMessage = null, 5000);
    } else {
      this.existingJobMessage = { type, text };
      setTimeout(() => this.existingJobMessage = null, 5000);
    }
  }
 
  addJob() {
    const payload = {
      title: this.newJob.title,
      location: this.newJob.location,
      experience: this.newJob.experience,
      description: this.newJob.description,
      preferredSkills: (this.newJob.preferredSkillsStr || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      education: this.newJob.education
    };
 
    this.jobService.create(payload).subscribe({
      next: (res) => {
        this.jobs.unshift(res);
        this.filterJobs(); // update filtered list
        this.newJob = { title: '', description: '', location: '', experience: null, preferredSkillsStr: '', education: '' };
        this.showMessage('success', 'Job added successfully!', 'add');
      },
      error: () => this.showMessage('error', 'Failed to add job. Please try again.', 'add')
    });
  }
 
  confirmDelete(id: string) {
    this.jobService.delete(id).subscribe({
      next: () => {
        this.jobs = this.jobs.filter(j => j._id !== id);
        this.filterJobs(); // update filtered list
        this.showMessage('success', 'Job deleted.', 'existing');
      },
      error: () => this.showMessage('error', 'Failed to delete job.', 'existing')
    });
  }
 
  editJob(job: any) {
    this.editingJobId = job._id;
    this.editedJob = { ...job, preferredSkillsStr: (job.preferredSkills || []).join(', ') };
  }
 
  saveEdit(job: any) {
    const payload = {
      title: this.editedJob.title,
      location: this.editedJob.location,
      experience: this.editedJob.experience,
      description: this.editedJob.description,
      preferredSkills: (this.editedJob.preferredSkillsStr || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      education: this.editedJob.education
    };
 
    this.jobService.update(job._id, payload).subscribe({
      next: (updated) => {
        const idx = this.jobs.findIndex(j => j._id === job._id);
        if (idx !== -1) this.jobs[idx] = updated;
        this.editingJobId = null;
        this.filterJobs(); // update filtered list
        this.showMessage('success', 'Job updated successfully!', 'existing');
      },
      error: () => this.showMessage('error', 'Failed to update job.', 'existing')
    });
  }
 
  cancelEdit() {
    this.editingJobId = null;
  }
 
  filterJobs() {
    const term = this.searchTerm.toLowerCase().trim();
 
    if (!term) {
      this.filteredJobs = this.jobs;
      return;
    }
 
    this.filteredJobs = this.jobs.filter(job =>
      (job.title && job.title.toLowerCase().includes(term)) ||
      (job.location && job.location.toLowerCase().includes(term))
    );
  }
}
 