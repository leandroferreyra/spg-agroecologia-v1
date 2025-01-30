import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { PaisDTO } from 'src/app/core/models/request/paisDTO';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { PaisesService } from 'src/app/core/services/paises.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { SharedModule } from 'src/shared.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-paises',
  standalone: true,
  imports: [CommonModule, SharedModule, DataTableModule, NgxSpinnerModule],
  templateUrl: './listado-paises.component.html',
  styleUrl: './listado-paises.component.css'
})
export class ListadoPaisesComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';
  search = '';
  cols = [
    { field: 'name', title: 'Nombre' },
    { field: 'action', title: 'Acciones', sort: false }
  ];
  paises: any[] = [];

  // Paginacion
  paginationInfo: string = 'Mostrando del {0} al {1} de un total de {2} elementos';
  params = {
    current_page: 1,
    pagesize: 10,
    last_page: 0
  };
  total_rows: number = 0;
  pageSizeOptions = [5, 10, 20, 30, 50, 100];

  paisForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalPais') modalPais!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>,
    private _catalogoService: CatalogoService, private spinner: NgxSpinnerService, private _paisService: PaisesService,
    private _tokenService: TokenService, private swalService: SwalService) {
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
    this.obtenerPaises(this.params.pagesize);
  }

  obtenerPaises(paging: number, page?: number) {
    this.subscription.add(
      this._catalogoService.getPaisesWithPaging(paging, page).subscribe({
        next: res => {
          this.paises = res.data;
          this.total_rows = res.meta.total;
          this.params.last_page = res.meta.last_page;
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          console.log(error);
        }
      })
    )
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }


  openSwalEliminar(pais: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el país ${pais.name}?`,
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
        this.eliminarPais(pais);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarPais(pais: any) {
    this.spinner.show();
    this.subscription.add(
      this._paisService.eliminarPais(pais.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          this.obtenerPaises(this.params.pagesize, this.params.current_page);
          this._tokenService.setToken(res.token);
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


  openModalNuevoPais(type: string, pais?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nuevo país';
      this.paisForm = new FormGroup({
        nombre: new FormControl(null, [Validators.required]),
      });
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición país';
      this.paisForm = new FormGroup({
        uuid: new FormControl(pais?.uuid, []),
        nombre: new FormControl(pais?.name, [Validators.required])
      });
    }
    this.modalPais.options = this.modalOptions;
    this.modalPais.open();
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalPais.close();
  }

  confirmarPais() {
    this.isSubmit = true;
    if (this.paisForm.valid) {
      this.spinner.show();
      let pais = new PaisDTO();
      pais.name = this.paisForm.get('nombre')?.value;
      pais.actual_role = this.actual_role;
      if (!this.isEdicion) {
        this.subscription.add(
          this._paisService.savePais(pais).subscribe({
            next: res => {
              // Esto es para evitar un llamado cada vez que agrega.
              if (this.params.current_page === this.params.last_page) {
                this.paises = [...this.paises, res.data];
              }
              this.total_rows += 1;
              this.cerrarModal();
              this.swalService.toastSuccess('top-right', res.message);
              this._tokenService.setToken(res.token);
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
          this._paisService.editPais(this.paisForm.get('uuid')?.value, pais).subscribe({
            next: res => {
              const index = this.paises.findIndex(p => p.uuid === (this.paisForm.get('uuid')?.value));
              if (index !== -1) {
                this.paises[index] = { ...this.paises[index], name: this.paisForm.get('nombre')?.value };
                this.paises = [...this.paises];
              }
              this.cerrarModal();
              this.swalService.toastSuccess('top-right', res.message)
              this._tokenService.setToken(res.token);
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

  changeServer(data: any) {
    this.params.current_page = data.current_page;
    this.params.pagesize = data.pagesize;
    if (data.change_type === 'search') {
      this.obtenerPaisesConFiltro(data.pagesize, data.search);
    } else {
      this.obtenerPaises(data.pagesize, data.current_page);
    }
  }

  obtenerPaisesConFiltro(paging: number, filter: string) {
    this.subscription.add(
      this._catalogoService.getPaisesWithNameFilter(paging, filter).subscribe({
        next: res => {
          this.paises = res.data;
          this.total_rows = res.meta.total;
          this.params.last_page = res.meta.last_page;
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          console.log(error);
        }
      })
    )
  }

}
