import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown, faArrowUp, faDove } from '@fortawesome/free-solid-svg-icons';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { PaisDTO } from 'src/app/core/models/request/paisDTO';
import { ProvinciaDTO } from 'src/app/core/models/request/provinciaDTO';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { PaisesService } from 'src/app/core/services/paises.service';
import { ProvinciaService } from 'src/app/core/services/provincia.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-provincias',
  standalone: true,
  imports: [CommonModule, NgxTippyModule, NgxCustomModalComponent, DataTableModule, NgxSpinnerModule, NgSelectModule,
    FormsModule, ReactiveFormsModule, IconPlusComponent, IconPencilComponent, IconTrashLinesComponent, IconSearchComponent, NgbPaginationModule,
    FontAwesomeModule
  ],
  templateUrl: './listado-provincias.component.html',
  styleUrl: './listado-provincias.component.css'
})
export class ListadoProvinciasComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';
  provincias: any[] = [];
  paises: any[] = [];

  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  // Mantener el estado del ordenamiento
  ordenamiento: any = {
    country_name: 'asc',
    name: 'asc'
  };

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;
  iconDove = faDove;

  // Mantener el estado del filtro
  showFilter: boolean = false;
  filtros: any = {
    country_name: '',
    name: ''
  };
  
  provinciaForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalProvincia') modalProvincia!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>,
    private _catalogoService: CatalogoService, private spinner: NgxSpinnerService, private _paisService: PaisesService,
    private _tokenService: TokenService, private swalService: SwalService, private _provinciaService: ProvinciaService) {
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
    this.obtenerProvincias();
    this.subscription.add(
      this._catalogoService.getPaises().subscribe({
        next: res => {
          // console.log(res);
          this.paises = res.data;
        },
        error: error => {
          console.error(error);
          this.swalService.toastError('top-right', error.error.message);
        }
      })
    )
    //this.initializeSortDirections(['country.name', 'name']);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /* initializeSortDirections(columns: string[]) {
    this.sortDirections = columns.reduce((acc, column) => {
      acc[column] = 'asc';
      return acc;
    }, {} as { [key: string]: 'asc' | 'desc' });
  } */

  /* construirFiltros(): Array<[string, string, string]> {
    const filtrosActivos: Array<[string, string, string]> = [];
    // Solo agregamos los filtros que tengan contenido
    if (this.filtros.country.name.trim()) {
      filtrosActivos.push(['country.name', 'LIKE', `${this.filtros.country.name}%`]);
    }
    if (this.filtros.name.trim()) {
      filtrosActivos.push(['name', 'LIKE', `${this.filtros.name}%`]);
      }
    return filtrosActivos;
  } */

  obtenerProvincias() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ['country'];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._catalogoService.getProvinciasWithParams(params).subscribe({
        next: res => {
          this.provincias = res.data;
          this.modificarPaginacion(res);
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          console.log(error);
        }
      })
    );
  }

  cambiarOrdenamiento(column: string) {
    // si el ordenamiento es asc, lo cambiamos a desc y si es desc, lo cambiamos a sin ordenamiento
    if (this.ordenamiento[column] === 'asc') {
      this.ordenamiento[column] = 'desc';
    } else if (this.ordenamiento[column] === 'desc') {
      this.ordenamiento[column] = '';
    } else {
      this.ordenamiento[column] = 'asc';
    }
    this.obtenerProvincias();
  }

  openSwalEliminar(provincia: any) {
    Swal.fire({

      title: '',
      text: `¿Desea eliminar la provincia ${provincia.name}?`,
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
        this.eliminarProvincia(provincia);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarProvincia(provincia: any) {
    this.spinner.show();
    this.subscription.add(
      this._provinciaService.eliminarProvincia(provincia.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          this.obtenerProvincias();
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

  openModalNuevaProvincia(type: string, provincia?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nueva provincia';
      this.provinciaForm = new FormGroup({
        nombre: new FormControl(null, [Validators.required]),
        pais: new FormControl(null, [Validators.required])
      });
    } else {
      // console.log(pais);
      this.isEdicion = true;
      this.tituloModal = 'Edición provincia';
      this.provinciaForm = new FormGroup({
        uuid: new FormControl(provincia?.uuid, []),
        nombre: new FormControl(provincia?.name, [Validators.required]),
        pais: new FormControl(provincia.country.uuid, [Validators.required])
      });
    }
    this.modalProvincia.options = this.modalOptions;
    this.modalProvincia.open();
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalProvincia.close();
    this.obtenerProvincias();
  }

  confirmarProvincia() {
    this.isSubmit = true;
    if (this.provinciaForm.valid) {
      this.spinner.show();
      let provincia = new ProvinciaDTO();
      provincia.name = this.provinciaForm.get('nombre')?.value;
      provincia.country_uuid = this.provinciaForm.get('pais')?.value;
      provincia.actual_role = this.actual_role;
      provincia.with = ['country'];

      if (!this.isEdicion) {
        this.subscription.add(
          this._provinciaService.saveProvincia(provincia).subscribe({
            next: res => {
              // Esto es para evitar un llamado cada vez que agrega.
              if (this.currentPage === this.last_page) {
                this.provincias = [...this.provincias, res.data];
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
          this._provinciaService.editProvincia(this.provinciaForm.get('uuid')?.value, provincia).subscribe({
            next: res => {
              const index = this.provincias.findIndex(p => p.uuid === (this.provinciaForm.get('uuid')?.value));
              if (index !== -1) {
                this.provincias[index] = {
                  ...this.provincias[index],
                  name: this.provinciaForm.get('nombre')?.value,
                  country: this.paises.find(p => p.uuid === this.provinciaForm.get('pais')?.value) || this.provincias[index].country
                };
                this.provincias = [...this.provincias];
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

  /* cambiarPaginacion(type: string, currentPage: number, column?: string) {
    this.currentPage = currentPage;
    

    if (type === 'sort' && column) {
      // Actualizar el ordenamiento
      const ordenIndex = this.ordenamiento.findIndex(([campo]) => campo === column);
      if (ordenIndex >= 0) {
        const direccionActual = this.ordenamiento[ordenIndex][1];
        // Solo cambiamos el ordenamiento si es diferente al default
        if (direccionActual === 'asc') {
          this.ordenamiento[ordenIndex][1] = 'desc';
        } else {
          // Si estaba en desc, volvemos al estado default (no se incluirá en la petición)
          this.ordenamiento[ordenIndex][1] = 'asc';
        }
        this.sortDirections[column] = this.ordenamiento[ordenIndex][1];
      }
    }

    this.obtenerProvincias(this.itemsPerPage, currentPage);
  } */

  /* obtenerProvinciasConFiltro(paging: number, filter: string) {
    this.subscription.add(
      this._catalogoService.getProvinciasWithFilter(paging, filter).subscribe({
        next: res => {
          // console.log(res);
          this.provincias = res.data;
          this.modificarPaginacion(res);
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          console.log(error);
        }
      })
    )
  } */

  modificarPaginacion(res: any) {
    this.total_rows = res.meta.total;
    this.last_page = res.meta.last_page;
    if (this.provincias.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  toggleFilter() {
    // console.log(this.filtros);
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        country_name: '',
        name: ''
      };
      this.obtenerProvincias();
    }
  }

}
