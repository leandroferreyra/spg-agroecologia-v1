import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoGenerosComponent } from './listado-generos.component';

describe('ListadoGenerosComponent', () => {
  let component: ListadoGenerosComponent;
  let fixture: ComponentFixture<ListadoGenerosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoGenerosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoGenerosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
