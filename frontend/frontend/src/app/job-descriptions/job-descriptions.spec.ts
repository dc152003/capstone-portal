import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobDescriptions } from './job-descriptions';

describe('JobDescriptions', () => {
  let component: JobDescriptions;
  let fixture: ComponentFixture<JobDescriptions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobDescriptions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobDescriptions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
