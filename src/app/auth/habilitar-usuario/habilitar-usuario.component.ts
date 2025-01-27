import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/services/auth.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';


@Component({
  selector: 'app-habilitar-usuario',
  standalone: true,
  imports: [NgxSpinnerModule],
  templateUrl: './habilitar-usuario.component.html',
  styleUrl: './habilitar-usuario.component.scss'
})
export class HabilitarUsuarioComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();

  uuid: string = '';
  token: string = '';

  constructor(private router: Router, private route: ActivatedRoute, private _authService: AuthService,
    private spinner: NgxSpinnerService
  ) {

  }

  ngOnInit(): void {
    this.spinner.show();
    this.route.params.subscribe(params => {
      this.uuid = params['uuid'];
      this.token = params['token'];
    });
    this.subscription.add(
      this._authService.verifyUser(this.uuid, this.token).subscribe({
        next: res => {
          this.spinner.hide();
          Swal.fire({
            title: '',
            text: `¡Excelente! Estás habilitado.`,
            icon: 'success',
            confirmButtonText: 'Continuar',
          }).then((result) => {
            if (result.isConfirmed) {
              this.router.navigate(['auth/login']);
            }
          });
        },
        error: error => {
          this.spinner.hide();
          Swal.fire({
            title: '',
            text: `Ocurrio un error en la habilitación.`,
            icon: 'error',
            confirmButtonText: 'Continuar',
          }).then((result) => {
            if (result.isConfirmed) {
              this.router.navigate(['auth/login']);
            }
          });
          console.error(error);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
