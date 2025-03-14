import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoCuentasBancariasComponent } from './listado-cuentas-bancarias.component';

describe('ListadoCuentasBancariasComponent', () => {
  let component: ListadoCuentasBancariasComponent;
  let fixture: ComponentFixture<ListadoCuentasBancariasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoCuentasBancariasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoCuentasBancariasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
