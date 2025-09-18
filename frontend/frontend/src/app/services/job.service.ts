import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define Job interface for type safety
export interface Job {
  _id: string;
  title: string;
  location?: string;
  experience?: number;
  description: string;
  preferredSkills?: string[];
  education?: string;
  createdBy?: string;
  // add other fields if needed
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = 'http://localhost:5000/api/jobs';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('auth_token'); // fix key here
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token || ''}`
      })
    };
  }

  list(): Observable<Job[]> {
    return this.http.get<Job[]>(this.apiUrl);
  }

  get(id: string): Observable<Job> {
    return this.http.get<Job>(`${this.apiUrl}/${id}`);
  }

  create(job: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, job, this.getHeaders());
  }

  update(id: string, job: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, job, this.getHeaders());
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  recommend(jobId: string, topN: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/${jobId}/recommend?top=${topN}`,
      this.getHeaders()
    );
  }
}
