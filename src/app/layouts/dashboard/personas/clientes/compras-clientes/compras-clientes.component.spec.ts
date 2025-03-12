import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprasClientesComponent } from './compras-clientes.component';

describe('ComprasClientesComponent', () => {
  let component: ComprasClientesComponent;
  let fixture: ComponentFixture<ComprasClientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprasClientesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprasClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
