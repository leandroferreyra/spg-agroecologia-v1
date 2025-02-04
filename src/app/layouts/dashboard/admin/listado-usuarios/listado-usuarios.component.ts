import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { ArrayToStringPipe } from 'src/app/core/pipes/array-to-string.pipe';
import { TokenService } from 'src/app/core/services/token.service';
import { UserService } from 'src/app/core/services/user.service';
import { IconInfoCircleComponent } from 'src/app/shared/icon/icon-info-circle';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-usuarios',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, NgbModule, NgbPaginationModule, FormsModule, ReactiveFormsModule,
    IconPencilComponent, IconTrashLinesComponent, IconInfoCircleComponent, ArrayToStringPipe],
  templateUrl: './listado-usuarios.component.html',
  styleUrl: './listado-usuarios.component.css'
})
export class ListadoUsuariosComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();
  actual_role: string = '';

  usuarios: any[] = [];

  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;

  constructor(public storeData: Store<any>, private userService: UserService, private spinner: NgxSpinnerService,
    private tokenService: TokenService
  ) {
    this.initStore();
  }
  async initStore() {
    this.storeData
      .select((d) => d.index)
      .subscribe((d) => {
        this.actual_role = d.userRole;
      });
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.spinner.show();
    this.obtenerUsuarios();
  }

  obtenerUsuarios() {
    this.subscription.add(
      this.userService.getUsers(this.actual_role).subscribe({
        next: res => {
          this.spinner.hide();
          this.tokenService.setToken(res.token);
          this.usuarios = res.data;
          if (this.usuarios.length <= this.itemsPerPage) {
            this.itemsInPage = this.usuarios.length;
          }
          console.log(res);
        },
        error: error => {
          this.spinner.hide();
          console.error(error);
        }
      })
    )
  }

  isVerified(user: any): boolean {
    return (user.email_verified_at !== null) ? true : false;
  }

  openSwalCambiarEstadoUsuario(user: any, checkboxId: string) {
    const originalCheckedState = this.isVerified(user);
    Swal.fire({
      title: '',
      text: '¿Desea habilitar/deshabilitar al usuario?',
      icon: 'info',
      confirmButtonText: 'Confirmar',
      showDenyButton: true,
      denyButtonText: 'Cancelar',
    }).then((result) => {
      const checkbox = document.getElementById(checkboxId) as HTMLInputElement;
      if (result.isConfirmed) {
        // this.cambiarEstadoUsuario(user);
      } else if (result.isDenied) {
        checkbox.checked = originalCheckedState;
      }
    })
  }

  // cambiarEstadoUsuario(user: any) {
  //   let userUpdateDTO = new RegistroDTO();
  //   userUpdateDTO.actual_role = this.rolActual.toUpperCase();
  //   userUpdateDTO.email = user.email;
  //   if (user.email_verified_at === null) {
  //     userUpdateDTO.email_verified_at = this.formatDateToYmdHis(new Date());
  //   } else {
  //     userUpdateDTO.email_verified_at = null;
  //   }
  //   this.spinner.show();
  //   this.subscription.add(
  //     this._userService.cambiarEstadoUsuario(user.uuid, userUpdateDTO).subscribe({
  //       next: res => {
  //         // console.log(res);
  //         this._toastr.toastrSuccess(res.message);
  //         this._tokenService.setToken(res.token);
  //         this.spinner.hide();
  //       },
  //       error: error => {
  //         this.spinner.hide();
  //         console.error(error);
  //       }
  //     })
  //   )
  // }

  public onPageChange(pageNum: number): void {
    this.currentPage = pageNum;
    this.pageSize = this.itemsPerPage * (pageNum - 1);
    // this.itemsInPage = pageNum * this.itemsPerPage;
    // if (this.itemsInPage > this.usuariosFiltrados.length) {
    //   this.itemsInPage = this.usuariosFiltrados.length;
    // }
  }
  cambiarPaginacion() {
    this.onPageChange(1);
  }

}
