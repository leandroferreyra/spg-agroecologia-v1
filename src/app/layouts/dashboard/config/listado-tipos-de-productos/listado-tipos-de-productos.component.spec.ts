import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoTiposDeProductosComponent } from './listado-tipos-de-productos.component';

describe('ListadoTiposDeProductosComponent', () => {
  let component: ListadoTiposDeProductosComponent;
  let fixture: ComponentFixture<ListadoTiposDeProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoTiposDeProductosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoTiposDeProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
