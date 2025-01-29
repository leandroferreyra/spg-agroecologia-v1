import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { CiudadDTO } from 'src/app/core/models/request/ciudadDTO';
import { PaisDTO } from 'src/app/core/models/request/paisDTO';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { CiudadService } from 'src/app/core/services/ciudad.service';
import { PaisesService } from 'src/app/core/services/paises.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { SharedModule } from 'src/shared.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-ciudades',
  standalone: true,
  imports: [CommonModule, SharedModule, DataTableModule, NgxSpinnerModule],
  templateUrl: './listado-ciudades.component.html',
  styleUrl: './listado-ciudades.component.css'
})
export class ListadoCiudadesComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';
  search = '';
  cols = [
    { field: 'district.name', title: 'Provincia' },
    { field: 'name', title: 'Ciudad' },
    { field: 'action', title: 'Acciones', sort: false }
  ];
  ciudades: any[] = [];
  provincias: any[] = [];

  // Paginacion
  paginationInfo: string = 'Mostrando del {0} al {1} de un total de {2} elementos';
  params = {
    current_page: 1,
    pagesize: 10,
    last_page: 0
  };
  total_rows: number = 0;
  pageSizeOptions = [5, 10, 20, 30, 50, 100];

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

  constructor(public storeData: Store<any>,
    private _catalogoService: CatalogoService, private spinner: NgxSpinnerService, private _paisService: PaisesService,
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
    this.obtenerCiudades(this.params.pagesize);
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
    )
  }

  obtenerCiudades(paging: number, page?: number) {
    this.subscription.add(
      this._catalogoService.getCiudadesWithDistrictsAndPaging(paging, page).subscribe({
        next: res => {
          this.ciudades = res.data;
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
          this.obtenerCiudades(this.params.pagesize, this.params.current_page);
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
              if (this.params.current_page === this.params.last_page) {
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

  changeServer(data: any) {
    this.params.current_page = data.current_page;
    this.params.pagesize = data.pagesize;
    if (data.change_type === 'search') {
      // this.obtenerPaisesConFiltro(data.pagesize, data.search);
    } else {
      this.obtenerCiudades(data.pagesize, data.current_page);
    }
  }

  // obtenerPaisesConFiltro(paging: number, filter: string) {
  //   this.subscription.add(
  //     this._catalogoService.getPaisesWithFilter(paging, filter).subscribe({
  //       next: res => {
  //         console.log(res);
  //         this.paises = res.data;
  //         this.total_rows = res.meta.total;
  //         this.params.last_page = res.meta.last_page;
  //         this.spinner.hide();
  //       },
  //       error: error => {
  //         this.spinner.hide();
  //         console.log(error);
  //       }
  //     })
  //   )
  // }

}
