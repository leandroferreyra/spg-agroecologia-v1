import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoQuintasComponent } from './listado-quintas.component';

describe('ListadoPrincipiosComponent', () => {
  let component: ListadoQuintasComponent;
  let fixture: ComponentFixture<ListadoQuintasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoQuintasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoQuintasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
