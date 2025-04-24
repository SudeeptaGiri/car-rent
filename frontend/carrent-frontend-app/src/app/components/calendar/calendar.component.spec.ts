import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarComponent } from './calendar.component';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';


describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalendarComponent],
      imports: [FormsModule, MatIconModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.bookedDates).toEqual([]);
    expect(component.externalToggle).toBeFalse();
    expect(component.initialStartDate).toBeNull();
    expect(component.initialEndDate).toBeNull();
    expect(component.pickupTime).toBe('07:00');
    expect(component.dropoffTime).toBe('10:30');
    expect(component.isOpen).toBeFalse();
  });

  it('should update calendar months when goToNextMonth is called', () => {
    const initialMonths = [...component.calendarMonths];
    component.goToNextMonth();
    expect(component.currentMonthIndex).toBe(1);
    expect(component.calendarMonths[0].getMonth()).not.toBe(initialMonths[0].getMonth());
  });

  it('should update calendar months when goToPrevMonth is called', () => {
    const initialMonths = [...component.calendarMonths];
    component.goToPrevMonth();
    expect(component.currentMonthIndex).toBe(-1);
    expect(component.calendarMonths[0].getMonth()).not.toBe(initialMonths[0].getMonth());
  });

  it('should toggle calendar visibility when togglePicker is called', () => {
    expect(component.isOpen).toBeFalse();
    component.togglePicker();
    expect(component.isOpen).toBeTrue();
    component.togglePicker();
    expect(component.isOpen).toBeFalse();
  });

  it('should identify past dates correctly', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(component.isPast(yesterday)).toBeTrue();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(component.isPast(tomorrow)).toBeFalse();
  });

  it('should identify blocked dates correctly', () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    component.bookedDates = [{
      startDate: today.toISOString(),
      endDate: nextWeek.toISOString()
    }];

    const blockedDate = new Date(today);
    blockedDate.setDate(today.getDate() + 3);
    expect(component.isBlocked(blockedDate)).toBeTrue();

    const availableDate = new Date(nextWeek);
    availableDate.setDate(nextWeek.getDate() + 3);
    expect(component.isBlocked(availableDate)).toBeFalse();
  });

  it('should reset calendar correctly', () => {
    // Setup initial state
    component.selectedPickup = new Date();
    component.selectedDropoff = new Date();
    component.selectedPickupDate = new Date();
    component.selectedDropoffDate = new Date();
    component.pickupTime = '08:00';
    component.dropoffTime = '16:00';
    component.isOpen = true;
    
    // Call reset
    const closedSpy = spyOn(component.closed, 'emit');
    component.resetCalendar();
    
    // Verify state is reset
    expect(component.selectedPickup).toBeNull();
    expect(component.selectedDropoff).toBeNull();
    expect(component.selectedPickupDate).toBeNull();
    expect(component.selectedDropoffDate).toBeNull();
    expect(component.pickupTime).toBe('07:00');
    expect(component.dropoffTime).toBe('10:30');
    expect(component.isOpen).toBeFalse();
    expect(closedSpy).toHaveBeenCalledWith(true);
  });

  it('should handle date selection correctly', () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // First selection (pickup)
    component.onSelectDate(today);
    expect(component.selectedPickup).toEqual(today);
    expect(component.selectedDropoff).toBeNull();
    
    // Second selection (dropoff)
    component.onSelectDate(tomorrow);
    expect(component.selectedPickup).toEqual(today);
    expect(component.selectedDropoff).toEqual(tomorrow);
    
    // New selection starts over
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    component.onSelectDate(nextWeek);
    expect(component.selectedPickup).toEqual(nextWeek);
    expect(component.selectedDropoff).toBeNull();
  });

  it('should emit selected date range when emitSelected is called', () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    component.selectedPickup = today;
    component.selectedDropoff = tomorrow;
    component.pickupTime = '08:00';
    component.dropoffTime = '10:00';
    
    const emitSpy = spyOn(component.dateRangeSelected, 'emit');
    component.emitSelected();
    
    expect(emitSpy).toHaveBeenCalled();
    expect(component.isOpen).toBeFalse();
  });

  it('should format dates correctly', () => {
    const testDate = new Date(2023, 0, 15); // January 15, 2023
    const formatted = component.formatDate(testDate);
    expect(formatted).toMatch(/Jan 15, 2023/);
  });

  it('should handle ngOnChanges for initialStartDate', () => {
    const testDate = new Date(2023, 0, 15);
    component.initialStartDate = testDate;
    component.ngOnChanges({
      initialStartDate: {
        currentValue: testDate,
        previousValue: null,
        firstChange: false,
        isFirstChange: () => false
      }
    });
    expect(component.selectedPickup).toEqual(testDate);
  });

  it('should check if a date is in the selected range', () => {
    const startDate = new Date(2023, 0, 10);
    const midDate = new Date(2023, 0, 15);
    const endDate = new Date(2023, 0, 20);
    
    component.selectedPickup = startDate;
    component.selectedDropoff = endDate;
    
    expect(component.isInRange(midDate)).toBeTrue();
    expect(component.isInRange(new Date(2023, 0, 5))).toBeFalse();
    expect(component.isInRange(new Date(2023, 0, 25))).toBeFalse();
  });

  it('should check if a date is selected as pickup or dropoff', () => {
    const startDate = new Date(2023, 0, 10);
    const endDate = new Date(2023, 0, 20);
    const otherDate = new Date(2023, 0, 15);
    
    component.selectedPickup = startDate;
    component.selectedDropoff = endDate;
    
    expect(component.isSelected(startDate)).toBeTrue();
    expect(component.isSelected(endDate)).toBeTrue();
    expect(component.isSelected(otherDate)).toBeFalse();
  });

  it('should not allow selecting blocked dates', () => {
    const blockedDate = new Date();
    component.bookedDates = [{
      startDate: blockedDate.toISOString(),
      endDate: blockedDate.toISOString()
    }];
    
    component.onSelectDate(blockedDate);
    expect(component.selectedPickup).toBeNull();
  });
});
