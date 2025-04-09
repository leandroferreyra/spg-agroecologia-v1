import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReemplazosComponent } from './reemplazos.component';

describe('ReemplazosComponent', () => {
  let component: ReemplazosComponent;
  let fixture: ComponentFixture<ReemplazosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReemplazosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReemplazosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
