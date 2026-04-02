import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoPosicionesComponent } from './listado-posiciones.component';

describe('ListadoPosicionesComponent', () => {
  let component: ListadoPosicionesComponent;
  let fixture: ComponentFixture<ListadoPosicionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoPosicionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoPosicionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
