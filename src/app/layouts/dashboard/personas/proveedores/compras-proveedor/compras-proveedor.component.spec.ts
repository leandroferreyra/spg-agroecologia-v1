import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprasProveedorComponent } from './compras-proveedor.component';

describe('ComprasProveedorComponent', () => {
  let component: ComprasProveedorComponent;
  let fixture: ComponentFixture<ComprasProveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprasProveedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprasProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
