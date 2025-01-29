import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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

  isEdicion: boolean = false;
  userForm!: FormGroup;


  constructor(private _userLogged: UserLoggedService) {

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.usuarioLogueado = this._userLogged.getUsuarioLogueado;
    console.log(this.usuarioLogueado);
    this.inicializarForm();
  }

  inicializarForm() {
    this.userForm = new FormGroup({
      email: new FormControl({ value: this.usuarioLogueado.email, disabled: true }, [Validators.required, Validators.email]),
      usuario: new FormControl({ value: this.usuarioLogueado.user_name, disabled: true }, [Validators.required, Validators.email]),
      nombres: new FormControl({ value: this.usuarioLogueado.firstname, disabled: true }, [Validators.required]),
      apellidos: new FormControl({ value: this.usuarioLogueado.lastname, disabled: true }, [Validators.required]),
      genero: new FormControl({ value: '', disabled: true }, [Validators.required]),
      ciudad: new FormControl({ value: '', disabled: true }, [Validators.required]),
      direccion: new FormControl({ value: '', disabled: true }, [Validators.required]),
    });
    this.onFormChange();
  }

  onFormChange() {

  }

  toggleEdicion() {
    this.isEdicion = !this.isEdicion;
    if (this.isEdicion) {
      this.modificarValidacionesForm();
    } else {
      this.inicializarForm();
    }
  }

  modificarValidacionesForm() {
    this.userForm.get('email')?.enable();
    this.userForm.get('usuario')?.enable();
    this.userForm.get('nombres')?.enable();
    this.userForm.get('apellidos')?.enable();
    this.userForm.get('genero')?.enable();
    this.userForm.get('ciudad')?.enable();
    this.userForm.get('direccion')?.enable();
  }


}
