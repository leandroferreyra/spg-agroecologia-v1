import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { SharedModule } from 'src/shared.module';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();
  usuarioLogueado: any;

  isEdicion = false;

  constructor(private _userLogged: UserLoggedService) {

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.usuarioLogueado = this._userLogged.getUsuarioLogueado;
    console.log(this.usuarioLogueado);
  }


}
