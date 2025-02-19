import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { CiudadDTO } from 'src/app/core/models/request/ciudadDTO';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown, faArrowUp, faDove } from '@fortawesome/free-solid-svg-icons'; import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { CiudadService } from 'src/app/core/services/ciudad.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { IndexService } from 'src/app/core/services/index.service';

@Component({
  selector: 'app-listado-ciudades',
  standalone: true,
  imports: [CommonModule, NgxTippyModule, NgxCustomModalComponent, NgSelectModule, FormsModule, ReactiveFormsModule,
    DataTableModule, NgxSpinnerModule, IconPlusComponent, IconPencilComponent, IconTrashLinesComponent, FontAwesomeModule, IconSearchComponent,
    NgbPaginationModule],
  templateUrl: './listado-ciudades.component.html',
  styleUrl: './listado-ciudades.component.css'
})
export class ListadoCiudadesComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';

  ciudades: any[] = [];
  provincias: any[] = [];

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
    district_country_name: 'asc',
    district_name: 'asc',
    name: 'asc'
  };

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

  // filtro
  showFilter: boolean = false;
  filtros: any = {
    district_country_name: '',
    district_name: '',
    name: ''
  };

  ciudadForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalCiudad') modalCiudad!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private _indexService: IndexService,
    private _catalogoService: CatalogoService, private spinner: NgxSpinnerService,
    private _tokenService: TokenService, private swalService: SwalService, private _ciudadServiice: CiudadService) {
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
    this.obtenerCiudades();
    // Se obtienen las provincias acá para el modal cuando quiere agregar una nueva ciudad.
    this.obtenerProvincias();
  }

  obtenerProvincias() {
    this.subscription.add(
      this._catalogoService.getProvincias().subscribe({
        next: res => {
          // console.log(res);
          this.provincias = res.data;
        },
        error: error => {
          console.error(error);
          this.swalService.toastError('top-right', error.error.message);
        }
      })
    );
  }

  obtenerCiudades() {
    const params: any = {};
    params.with = ['district', 'district.country'];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getCiudadesWithParams(params).subscribe({
        next: res => {
          // console.log(res);
          this.ciudades = res.data;
          this.modificarPaginacion(res);
          this.spinner.hide();

        },
        error: error => {
          this.spinner.hide();
          console.log(error);
        }
      })
    )
  }

  cambiarOrdenamiento(column: string) {
    // si el ordenamiento es asc, lo cambiamos a desc y si es desc, lo cambiamos a sin ordenamiento
    if (this.ordenamiento[column] === 'asc') {
      this.ordenamiento[column] = 'desc';
    } else if (this.ordenamiento[column] === 'desc') {
      this.ordenamiento[column] = 'asc';
    }
    this.obtenerCiudades();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openSwalEliminar(ciudad: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar la ciudad ${ciudad.name}?`,
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
        this.eliminarCiudad(ciudad);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarCiudad(ciudad: any) {
    this.spinner.show();
    this.subscription.add(
      this._ciudadServiice.eliminarCiudad(ciudad.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          this.obtenerCiudades();
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


  openModalNuevaCiudad(type: string, ciudad?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nueva ciudad';
      this.ciudadForm = new FormGroup({
        nombre: new FormControl(null, [Validators.required]),
        provincia: new FormControl(null, [Validators.required])
      });
    } else {
      // console.log(pais);
      this.isEdicion = true;
      this.tituloModal = 'Edición ciudad';
      this.ciudadForm = new FormGroup({
        uuid: new FormControl(ciudad?.uuid, []),
        nombre: new FormControl(ciudad?.name, [Validators.required]),
        provincia: new FormControl(ciudad.district.uuid, [Validators.required])
      });
    }
    this.modalCiudad.options = this.modalOptions;
    this.modalCiudad.open();
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalCiudad.close();
    this.obtenerCiudades();
  }


  confirmarCiudad() {
    this.isSubmit = true;
    if (this.ciudadForm.valid) {
      this.spinner.show();
      let ciudad = new CiudadDTO();
      ciudad.name = this.ciudadForm.get('nombre')?.value;
      ciudad.district_uuid = this.ciudadForm.get('provincia')?.value;
      ciudad.actual_role = this.actual_role;
      ciudad.with = ['district'];

      if (!this.isEdicion) {
        this.subscription.add(
          this._ciudadServiice.saveCiudad(ciudad).subscribe({
            next: res => {
              // Esto es para evitar un llamado cada vez que agrega.
              if (this.currentPage === this.last_page) {
                this.ciudades = [...this.ciudades, res.data];
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
          this._ciudadServiice.editCiudad(this.ciudadForm.get('uuid')?.value, ciudad).subscribe({
            next: res => {
              const index = this.ciudades.findIndex(p => p.uuid === (this.ciudadForm.get('uuid')?.value));
              if (index !== -1) {
                this.ciudades[index] = {
                  ...this.ciudades[index],
                  name: this.ciudadForm.get('nombre')?.value,
                  district: this.provincias.find(p => p.uuid === this.ciudadForm.get('provincia')?.value) || this.ciudades[index].district
                };
                this.ciudades = [...this.ciudades];
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

  modificarPaginacion(res: any) {
    this.total_rows = res.meta.total;
    this.last_page = res.meta.last_page;
    if (this.ciudades.length <= this.itemsPerPage) {
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
        district_country_name: '',
        district_name: '',
        name: ''
      };
      this.obtenerCiudades();
    }
  }
}