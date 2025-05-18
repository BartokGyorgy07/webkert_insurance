import { TestBed } from '@angular/core/testing';

import { PageloadingService } from './pageloading.service';

describe('PageloadingService', () => {
  let service: PageloadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PageloadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
