import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentesProduccionComponent } from './componentes-produccion.component';

describe('ComponentesProduccionComponent', () => {
  let component: ComponentesProduccionComponent;
  let fixture: ComponentFixture<ComponentesProduccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentesProduccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComponentesProduccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
