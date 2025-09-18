import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobDescriptionView } from './job-description-view';

describe('JobDescriptionView', () => {
  let component: JobDescriptionView;
  let fixture: ComponentFixture<JobDescriptionView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobDescriptionView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobDescriptionView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
