import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoMetodosPagoComponent } from './listado-metodos-pago.component';

describe('ListadoMetodosPagoComponent', () => {
  let component: ListadoMetodosPagoComponent;
  let fixture: ComponentFixture<ListadoMetodosPagoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoMetodosPagoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoMetodosPagoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
