import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarReservedDialogComponent } from './car-reserved-dialog.component';

describe('CarReservedDialogComponent', () => {
  let component: CarReservedDialogComponent;
  let fixture: ComponentFixture<CarReservedDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CarReservedDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarReservedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
