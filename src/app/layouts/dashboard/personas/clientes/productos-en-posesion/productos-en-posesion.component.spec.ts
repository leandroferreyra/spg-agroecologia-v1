import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosEnPosesionComponent } from './productos-en-posesion.component';

describe('ProductosEnPosesionComponent', () => {
  let component: ProductosEnPosesionComponent;
  let fixture: ComponentFixture<ProductosEnPosesionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosEnPosesionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosEnPosesionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
