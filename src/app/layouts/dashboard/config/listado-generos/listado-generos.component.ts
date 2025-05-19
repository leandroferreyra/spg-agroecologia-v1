import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { BancoDTO } from 'src/app/core/models/request/bancoDTO';
import { GeneroDTO } from 'src/app/core/models/request/generoDTO';
import { BancosService } from 'src/app/core/services/bancos.service';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { GenerosService } from 'src/app/core/services/generos.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { IndexService } from 'src/app/core/services/index.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-listado-generos',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, DataTableModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule,
    IconPencilComponent, IconPlusComponent, IconTrashLinesComponent, NgxTippyModule, FontAwesomeModule, IconSearchComponent,
    NgbPagination, NgSelectModule],
  templateUrl: './listado-generos.component.html',
  styleUrl: './listado-generos.component.css'
})
export class ListadoGenerosComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';

  generos: any[] = [];

  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  // Orden y filtro
  filtros: any = {
    'name': { value: '', op: 'LIKE', contiene: true },
  };
  showFilter: boolean = false;
  ordenamiento: any = {
    'name': 'asc'
  };

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

  generoForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalGenero') modalGenero!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private swalService: SwalService, private _catalogoService: CatalogoService,
    private _generoService: GenerosService, private spinner: NgxSpinnerService, private tokenService: TokenService,
    private _indexService: IndexService) {
    this.initStore();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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
    this.obtenerGeneros();
  }

  obtenerGeneros() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = [];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getGenerosWithParam(params).subscribe({
        next: res => {
          this.generos = res.data;
          this.modificarPaginacion(res);
          this.spinner.hide();
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
    if (this.generos.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }



  cambiarOrdenamiento(column: string) {
    // si el ordenamiento es asc, lo cambiamos a desc y si es desc, lo cambiamos a sin ordenamiento
    if (this.ordenamiento[column] === 'asc') {
      this.ordenamiento[column] = 'desc';
    } else if (this.ordenamiento[column] === 'desc') {
      this.ordenamiento[column] = 'asc';
    }
    this.obtenerGeneros();
  }

  openModalNuevoGenero(type: string, genero?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nuevo genero';
      this.generoForm = new FormGroup({
        nombre: new FormControl(null, [Validators.required]),
      });
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición genero';
      this.generoForm = new FormGroup({
        uuid: new FormControl(genero?.uuid, []),
        nombre: new FormControl(genero?.name, [Validators.required])
      });
    }
    this.modalGenero.options = this.modalOptions;
    this.modalGenero.open();
  }

  confirmarGenero() {
    this.isSubmit = true;
    if (this.generoForm.valid) {
      this.spinner.show();
      let genero = new GeneroDTO();
      genero.name = this.generoForm.get('nombre')?.value;
      genero.actual_role = this.actual_role;
      if (!this.isEdicion) {
        this.subscription.add(
          this._generoService.saveGenero(genero).subscribe({
            next: res => {
              this.obtenerGeneros();
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
          this._generoService.editGenero(this.generoForm.get('uuid')?.value, genero).subscribe({
            next: res => {
              const index = this.generos.findIndex(p => p.uuid === (this.generoForm.get('uuid')?.value));
              if (index !== -1) {
                this.generos[index] = { ...this.generos[index], name: this.generoForm.get('nombre')?.value };
                this.generos = [...this.generos];
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

  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        'name': { value: '', op: 'LIKE', contiene: true },
      };
      this.obtenerGeneros();
    }
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalGenero.close();
  }

  openSwalEliminar(genero: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el genero ${genero.name}?`,
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
        this.eliminarGenero(genero);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarGenero(genero: any) {
    this.spinner.show();
    this.subscription.add(
      this._generoService.eliminarGenero(genero.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          this.obtenerGeneros();
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
