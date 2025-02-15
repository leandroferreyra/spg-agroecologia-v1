import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoCategoriasProductosComponent } from './listado-categorias-productos.component';

describe('ListadoCategoriasProductosComponent', () => {
  let component: ListadoCategoriasProductosComponent;
  let fixture: ComponentFixture<ListadoCategoriasProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoCategoriasProductosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoCategoriasProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
