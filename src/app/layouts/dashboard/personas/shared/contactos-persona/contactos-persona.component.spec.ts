import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactosPersonaComponent } from './contactos-persona.component';

describe('ContactosPersonaComponent', () => {
  let component: ContactosPersonaComponent;
  let fixture: ComponentFixture<ContactosPersonaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactosPersonaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactosPersonaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
