import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { ModalOptions, NgxCustomModalComponent } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { BancoDTO } from 'src/app/core/models/request/bancoDTO';
import { MetodoPagoDTO } from 'src/app/core/models/request/metodoPagoDTO';
import { BancosService } from 'src/app/core/services/bancos.service';
import { IndexService } from 'src/app/core/services/index.service';
import { MetodosPagoService } from 'src/app/core/services/metodosPago.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-metodos-pago',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, NgxTippyModule, DataTableModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule,
    IconPlusComponent, IconPencilComponent, IconTrashLinesComponent, NgbPagination, IconSearchComponent, FontAwesomeModule, NgSelectModule],
  templateUrl: './listado-metodos-pago.component.html',
  styleUrl: './listado-metodos-pago.component.css'
})
export class ListadoMetodosPagoComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';

  metodos: any[] = [];
  metodoForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  // Orden y filtro
  filtros: any = {};
  showFilter: boolean = false;
  ordenamiento: any = {
    'name': 'asc'
  };

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

  // Referencia al modal para crear y editar bancos.
  @ViewChild('modalMetodo') modalMetodo!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _metodoService: MetodosPagoService, private spinner: NgxSpinnerService, private tokenService: TokenService) {
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
    this.obtenerMetodosPago();
  }

  obtenerMetodosPago() {
    this.spinner.show();
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = [];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getMetodosDePagoWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.spinner.hide();
          this.metodos = res.data;
          this.modificarPaginacion(res);
        },
        error: error => {
          this.spinner.hide();
          console.error(error);
        }
      })
    )
  }

  modificarPaginacion(res: any) {
    this.total_rows = res.meta.total;
    this.last_page = res.meta.last_page;
    if (this.metodos.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  openModalNuevoMetodo(type: string, metodo?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nuevo método de pago';
      this.metodoForm = new FormGroup({
        nombre: new FormControl(null, [Validators.required]),
      });
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición método de pago';
      this.metodoForm = new FormGroup({
        uuid: new FormControl(metodo?.uuid, []),
        nombre: new FormControl(metodo?.name, [Validators.required])
      });
    }
    this.modalMetodo.options = this.modalOptions;
    this.modalMetodo.open();
  }

  confirmarMetodo() {
    this.isSubmit = true;
    if (this.metodoForm.valid) {
      this.spinner.show();
      let metodo = new MetodoPagoDTO();
      metodo.name = this.metodoForm.get('nombre')?.value;
      metodo.actual_role = this.actual_role;
      if (!this.isEdicion) {
        this.subscription.add(
          this._metodoService.saveMetodo(metodo).subscribe({
            next: res => {
              this.obtenerMetodosPago();
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
          this._metodoService.editMetodo(this.metodoForm.get('uuid')?.value, metodo).subscribe({
            next: res => {
              this.obtenerMetodosPago();
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
    this.modalMetodo.close();
  }

  openSwalEliminar(metodo: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el metodo ${metodo.name}?`,
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
        this.eliminarMetodo(metodo);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarMetodo(metodo: any) {
    this.spinner.show();
    this.subscription.add(
      this._metodoService.deleteMetodo(metodo.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          this.obtenerMetodosPago();
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

  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        'name': { value: '', op: 'LIKE', contiene: true }
      };
      this.obtenerMetodosPago();
    }
  }

  cambiarOrdenamiento(column: string) {
    // si el ordenamiento es asc, lo cambiamos a desc y si es desc, lo cambiamos a sin ordenamiento
    if (this.ordenamiento[column] === 'asc') {
      this.ordenamiento[column] = 'desc';
    } else if (this.ordenamiento[column] === 'desc') {
      this.ordenamiento[column] = 'asc';
    }
    this.obtenerMetodosPago();
  }

}
