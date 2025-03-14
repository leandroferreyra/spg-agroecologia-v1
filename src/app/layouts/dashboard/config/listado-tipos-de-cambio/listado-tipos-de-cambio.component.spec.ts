import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoTiposDeCambioComponent } from './listado-tipos-de-cambio.component';

describe('ListadoTiposDeCambioComponent', () => {
  let component: ListadoTiposDeCambioComponent;
  let fixture: ComponentFixture<ListadoTiposDeCambioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoTiposDeCambioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoTiposDeCambioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
