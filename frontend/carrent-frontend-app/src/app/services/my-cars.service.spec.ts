import { TestBed } from '@angular/core/testing';

import { myCarService } from './my-cars.service';

describe('myCarService', () => {
  let service: myCarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(myCarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
