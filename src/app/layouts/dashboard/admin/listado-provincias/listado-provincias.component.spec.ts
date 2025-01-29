import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoProvinciasComponent } from './listado-provincias.component';

describe('ListadoProvinciasComponent', () => {
  let component: ListadoProvinciasComponent;
  let fixture: ComponentFixture<ListadoProvinciasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoProvinciasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoProvinciasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
