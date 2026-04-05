import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoVisitasComponent } from './listado-visitas.component';

describe('ListadoVisitasComponent', () => {
  let component: ListadoVisitasComponent;
  let fixture: ComponentFixture<ListadoVisitasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoVisitasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoVisitasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
