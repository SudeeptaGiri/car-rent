import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingCancelledDialogComponent } from './booking-cancelled-dialog.component';

describe('BookingCancelledDialogComponent', () => {
  let component: BookingCancelledDialogComponent;
  let fixture: ComponentFixture<BookingCancelledDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookingCancelledDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingCancelledDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
