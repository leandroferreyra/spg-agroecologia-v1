import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoParametrosGeneralesComponent } from './listado-parametros-generales.component';

describe('ListadoParametrosGeneralesComponent', () => {
  let component: ListadoParametrosGeneralesComponent;
  let fixture: ComponentFixture<ListadoParametrosGeneralesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoParametrosGeneralesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoParametrosGeneralesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
