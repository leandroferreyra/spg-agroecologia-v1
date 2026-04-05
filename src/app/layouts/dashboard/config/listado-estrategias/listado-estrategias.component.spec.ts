import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoEstrategiasComponent } from './listado-estrategias.component';

describe('ListadoPrincipiosComponent', () => {
  let component: ListadoEstrategiasComponent;
  let fixture: ComponentFixture<ListadoEstrategiasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoEstrategiasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoEstrategiasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
