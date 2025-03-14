import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoCiudadesComponent } from './listado-ciudades.component';

describe('ListadoCiudadesComponent', () => {
  let component: ListadoCiudadesComponent;
  let fixture: ComponentFixture<ListadoCiudadesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoCiudadesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoCiudadesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
