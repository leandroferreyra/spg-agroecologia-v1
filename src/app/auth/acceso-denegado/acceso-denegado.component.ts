import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NavigationForRolGuardService } from '../../core/services/navigation-for-rol-guard.service';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [],
  templateUrl: './acceso-denegado.component.html',
  styleUrl: './acceso-denegado.component.scss'
})
export class AccesoDenegadoComponent {

  store: any;

  constructor(private router: Router, private route: ActivatedRoute, private navigationService: NavigationForRolGuardService,
    public storeData: Store<any>
  ) {
    this.initStore();

  }
  async initStore() {
    this.storeData
      .select((d) => d.index)
      .subscribe((d) => {
        this.store = d;
      });
  }
  goBack() {
    const previousUrl = this.navigationService.getPreviousUrl();
    this.router.navigateByUrl(previousUrl);
  }
}
