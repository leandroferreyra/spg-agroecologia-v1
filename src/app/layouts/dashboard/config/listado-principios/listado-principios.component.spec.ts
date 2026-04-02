import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoPrincipiosComponent } from './listado-principios.component';

describe('ListadoPrincipiosComponent', () => {
  let component: ListadoPrincipiosComponent;
  let fixture: ComponentFixture<ListadoPrincipiosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoPrincipiosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoPrincipiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
