import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarBookingPageComponent } from './car-booking-page.component';

describe('CarBookingPageComponent', () => {
  let component: CarBookingPageComponent;
  let fixture: ComponentFixture<CarBookingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CarBookingPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarBookingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
