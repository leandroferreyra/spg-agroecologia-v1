import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { toggleAnimation } from 'src/app/shared/animations';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './config.component.html',
  styleUrl: './config.component.css',
  animations: [toggleAnimation],

})
export class ConfigComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();
  store: any;
  menuItems: any[] = [];
  configSubmenu: any[] = [];

  constructor(
    public storeData: Store<any>,
    public router: Router, private spinner: NgxSpinnerService, private swalService: SwalService,
    public _authService: AuthService, public _tokenService: TokenService, public _userLogged: UserLoggedService
  ) {
    this.initStore();
  }
  async initStore() {
    this.storeData
      .select((d) => d.index)
      .subscribe((d) => {
        this.store = d;
        this.menuItems = this.store.menuItems;
      });
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  ngOnInit() {
    const configMenu = this.menuItems.find(item => item.label === 'Configuraciones');
    if (configMenu && configMenu.submenu) {
      this.configSubmenu = configMenu.submenu;
    }
  }

}
