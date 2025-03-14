import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosAdquiridosComponent } from './productos-adquiridos.component';

describe('ProductosAdquiridosComponent', () => {
  let component: ProductosAdquiridosComponent;
  let fixture: ComponentFixture<ProductosAdquiridosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosAdquiridosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosAdquiridosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
