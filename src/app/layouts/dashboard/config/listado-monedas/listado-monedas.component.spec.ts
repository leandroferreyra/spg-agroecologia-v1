import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoMonedasComponent } from './listado-monedas.component';

describe('ListadoMonedasComponent', () => {
  let component: ListadoMonedasComponent;
  let fixture: ComponentFixture<ListadoMonedasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoMonedasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoMonedasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
