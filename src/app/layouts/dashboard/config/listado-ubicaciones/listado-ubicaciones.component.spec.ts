import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoUbicacionesComponent } from './listado-ubicaciones.component';

describe('ListadoUbicacionesComponent', () => {
  let component: ListadoUbicacionesComponent;
  let fixture: ComponentFixture<ListadoUbicacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoUbicacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoUbicacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
