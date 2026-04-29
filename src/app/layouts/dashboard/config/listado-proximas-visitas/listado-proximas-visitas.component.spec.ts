import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoProximasVisitasComponent } from './listado-proximas-visitas.component';

describe('ListadoProximasVisitasComponent', () => {
  let component: ListadoProximasVisitasComponent;
  let fixture: ComponentFixture<ListadoProximasVisitasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoProximasVisitasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoProximasVisitasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
