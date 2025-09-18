import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BestFitCandidate } from './best-fit-candidate';

describe('BestFitCandidate', () => {
  let component: BestFitCandidate;
  let fixture: ComponentFixture<BestFitCandidate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BestFitCandidate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BestFitCandidate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
