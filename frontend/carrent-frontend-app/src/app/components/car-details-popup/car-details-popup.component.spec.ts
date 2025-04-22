import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarDetailsPopupComponent } from './car-details-popup.component';

describe('CarDetailsPopupComponent', () => {
  let component: CarDetailsPopupComponent;
  let fixture: ComponentFixture<CarDetailsPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CarDetailsPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarDetailsPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
