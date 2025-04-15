import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VinculosComponent } from './vinculos.component';

describe('VinculosComponent', () => {
  let component: VinculosComponent;
  let fixture: ComponentFixture<VinculosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VinculosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VinculosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
