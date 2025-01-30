import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { BancoDTO } from 'src/app/core/models/request/bancoDTO';
import { BancosService } from 'src/app/core/services/bancos.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { SharedModule } from 'src/shared.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-bancos',
  standalone: true,
  imports: [CommonModule, SharedModule, DataTableModule, NgxSpinnerModule],
  templateUrl: './listado-bancos.component.html',
  styleUrl: './listado-bancos.component.css'
})
export class ListadoBancosComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';
  search = '';
  cols = [
    { field: 'name', title: 'Nombre' },
    { field: 'action', title: 'Acciones', sort: false }
  ];
  bancos: any[] = [];

  // Paginacion
  paginationInfo: string = 'Mostrando del {0} al {1} de un total de {2} elementos';
  params = {
    current_page: 1,
    pagesize: 10,
    last_page: 0
  };
  total_rows: number = 0;
  pageSizeOptions = [5, 10, 20, 30, 50, 100];

  bancoForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalBanco') modalBanco!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private swalService: SwalService,
    private _bancosService: BancosService, private spinner: NgxSpinnerService, private tokenService: TokenService) {
    this.initStore();
  }

  async initStore() {
    this.storeData
      .select((d) => d.index)
      .subscribe((d) => {
        this.actual_role = d.userRole;
      });
  }

  ngOnInit(): void {
    this.spinner.show();
    this.obtenerBancos(this.params.pagesize);
  }

  obtenerBancos(paging: number, page?: number) {
    this.subscription.add(
      this._bancosService.getBancos(this.actual_role, paging, page).subscribe({
        next: res => {
          this.spinner.hide();
          this.bancos = res.data;
          this.total_rows = res.meta.total;
          this.params.last_page = res.meta.last_page;
        },
        error: error => {
          this.spinner.hide();
          console.error(error);
        }
      })
    )
  }

  obtenerBancosConFiltro(paging: number, filter: string) {
    this.subscription.add(
      this._bancosService.getBancosWithNameFilter(this.actual_role, paging, filter).subscribe({
        next: res => {
          this.spinner.hide();
          this.bancos = res.data;
          this.total_rows = res.meta.total;
          this.params.last_page = res.meta.last_page;
        },
        error: error => {
          this.spinner.hide();
          console.error(error);
        }
      })
    )
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  changeServer(data: any) {
    this.params.current_page = data.current_page;
    this.params.pagesize = data.pagesize;
    if (data.change_type === 'search') {
      this.obtenerBancosConFiltro(data.pagesize, data.search);
    } else {
      this.obtenerBancos(data.pagesize, data.current_page);
    }
  }

  openModalNuevoBanco(type: string, banco?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nuevo banco';
      this.bancoForm = new FormGroup({
        nombre: new FormControl(null, [Validators.required]),
      });
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición banco';
      this.bancoForm = new FormGroup({
        uuid: new FormControl(banco?.uuid, []),
        nombre: new FormControl(banco?.name, [Validators.required])
      });
    }
    this.modalBanco.options = this.modalOptions;
    this.modalBanco.open();
  }

  confirmarBanco() {
    this.isSubmit = true;
    if (this.bancoForm.valid) {
      this.spinner.show();
      let banco = new BancoDTO();
      banco.name = this.bancoForm.get('nombre')?.value;
      banco.actual_role = this.actual_role;
      if (!this.isEdicion) {
        this.subscription.add(
          this._bancosService.saveBanco(banco).subscribe({
            next: res => {
              // Esto es para evitar un llamado cada vez que agrega.
              if (this.params.current_page === this.params.last_page) {
                this.bancos = [...this.bancos, res.data];
              }
              this.total_rows += 1;
              this.cerrarModal();
              this.swalService.toastSuccess('top-right', res.message);
              this.tokenService.setToken(res.token);
              this.spinner.hide();
            },
            error: error => {
              this.swalService.toastError('top-right', error.error.message);
              console.error(error);
              this.spinner.hide();
            }
          })
        )
      } else {
        this.subscription.add(
          this._bancosService.editBanco(this.bancoForm.get('uuid')?.value, banco).subscribe({
            next: res => {
              const index = this.bancos.findIndex(p => p.uuid === (this.bancoForm.get('uuid')?.value));
              if (index !== -1) {
                this.bancos[index] = { ...this.bancos[index], name: this.bancoForm.get('nombre')?.value };
                this.bancos = [...this.bancos];
              }
              this.cerrarModal();
              this.swalService.toastSuccess('top-right', res.message)
              this.tokenService.setToken(res.token);
              this.spinner.hide();
            },
            error: error => {
              console.error(error);
              this.spinner.hide();
              this.swalService.toastError('top-right', error.error.message);
            }
          })
        )
      }
    }
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalBanco.close();
  }

  openSwalEliminar(banco: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el banco ${banco.name}?`,
      icon: 'info',
      confirmButtonText: 'Confirmar',
      showDenyButton: true,
      denyButtonText: 'Cancelar',
      didRender: () => {
        const cancelButton = Swal.getDenyButton();
        if (cancelButton) {
          cancelButton.setAttribute('id', 'back-button-with-border');
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminarBanco(banco);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarBanco(banco: any) {
    this.spinner.show();
    this.subscription.add(
      this._bancosService.eliminarBanco(banco.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          this.obtenerBancos(this.params.pagesize, this.params.current_page);
          this.tokenService.setToken(res.token);
          this.spinner.hide();
        },
        error: error => {
          console.error(error);
          this.swalService.toastError('top-right', error.error.message);
          this.spinner.hide();
        }
      })
    )
  }


}
