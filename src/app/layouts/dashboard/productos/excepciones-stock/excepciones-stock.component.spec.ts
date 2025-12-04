import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcepcionesStockComponent } from './excepciones-stock.component';

describe('ExcepcionesStockComponent', () => {
  let component: ExcepcionesStockComponent;
  let fixture: ComponentFixture<ExcepcionesStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExcepcionesStockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcepcionesStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
