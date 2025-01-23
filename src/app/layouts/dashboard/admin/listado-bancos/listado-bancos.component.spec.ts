import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoBancosComponent } from './listado-bancos.component';

describe('ListadoBancosComponent', () => {
  let component: ListadoBancosComponent;
  let fixture: ComponentFixture<ListadoBancosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoBancosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoBancosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
