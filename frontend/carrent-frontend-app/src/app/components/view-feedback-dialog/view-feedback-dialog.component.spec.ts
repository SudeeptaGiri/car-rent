import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewFeedbackDialogComponent } from './view-feedback-dialog.component';

describe('ViewFeedbackDialogComponent', () => {
  let component: ViewFeedbackDialogComponent;
  let fixture: ComponentFixture<ViewFeedbackDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewFeedbackDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewFeedbackDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
