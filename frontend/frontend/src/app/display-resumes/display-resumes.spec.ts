import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayResumes } from './display-resumes';

describe('DisplayResumes', () => {
  let component: DisplayResumes;
  let fixture: ComponentFixture<DisplayResumes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayResumes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayResumes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
