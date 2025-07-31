import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaltantesComponent } from './faltantes.component';

describe('FaltantesComponent', () => {
  let component: FaltantesComponent;
  let fixture: ComponentFixture<FaltantesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaltantesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaltantesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
