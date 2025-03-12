import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactosProveedorComponent } from './contactos-proveedor.component';

describe('ContactosProveedorComponent', () => {
  let component: ContactosProveedorComponent;
  let fixture: ComponentFixture<ContactosProveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactosProveedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactosProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
