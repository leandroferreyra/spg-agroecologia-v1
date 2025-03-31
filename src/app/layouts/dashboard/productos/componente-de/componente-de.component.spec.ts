import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponenteDeComponent } from './componente-de.component';

describe('ComponenteDeComponent', () => {
  let component: ComponenteDeComponent;
  let fixture: ComponentFixture<ComponenteDeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponenteDeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComponenteDeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
