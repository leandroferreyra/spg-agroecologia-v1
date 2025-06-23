import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { PaisDTO } from 'src/app/core/models/request/paisDTO';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { PaisesService } from 'src/app/core/services/paises.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IndexService } from 'src/app/core/services/index.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-listado-paises',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, DataTableModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule,
    NgxTippyModule, IconPlusComponent, IconPencilComponent, IconTrashLinesComponent, FontAwesomeModule, NgbPagination,
    IconSearchComponent, NgSelectModule
  ],
  templateUrl: './listado-paises.component.html',
  styleUrl: './listado-paises.component.css'
})
export class ListadoPaisesComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();
  actual_role: string = '';

  paises: any[] = [];

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
    'name': { value: '', op: 'LIKE' }
  };
  showFilter: boolean = false;
  ordenamiento: any = {
    'name': 'asc'
  };

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

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

  constructor(public storeData: Store<any>, private _indexService: IndexService, private titleService: Title,
    private spinner: NgxSpinnerService, private _paisService: PaisesService,
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
    this.obtenerPaises();
    this.titleService.setTitle('LADIE - Países');
  }

  obtenerPaises() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = [];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getPaisesWithParams(params).subscribe({
        next: res => {
          this.paises = res.data;
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
    if (this.paises.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
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
          this.obtenerPaises();
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
              // if (this.currentPage === this.last_page) {
              //   this.paises = [...this.paises, res.data];
              // }
              // if (this.itemsInPage < this.MAX_ITEMS_PER_PAGE) {
              //   this.itemsInPage += 1;
              // }
              // this.total_rows += 1;
              this.obtenerPaises();
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

  cambiarOrdenamiento(column: string) {
    // si el ordenamiento es asc, lo cambiamos a desc y si es desc, lo cambiamos a sin ordenamiento
    if (this.ordenamiento[column] === 'asc') {
      this.ordenamiento[column] = 'desc';
    } else if (this.ordenamiento[column] === 'desc') {
      this.ordenamiento[column] = 'asc';
    }
    this.obtenerPaises();
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        'name': { value: '', op: 'LIKE', contiene: true }
      };
      this.obtenerPaises();
    }
  }


}
