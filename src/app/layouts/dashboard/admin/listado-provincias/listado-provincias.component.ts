import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { PaisDTO } from 'src/app/core/models/request/paisDTO';
import { ProvinciaDTO } from 'src/app/core/models/request/provinciaDTO';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { PaisesService } from 'src/app/core/services/paises.service';
import { ProvinciaService } from 'src/app/core/services/provincia.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { SharedModule } from 'src/shared.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-provincias',
  standalone: true,
  imports: [CommonModule, SharedModule, DataTableModule, NgxSpinnerModule],
  templateUrl: './listado-provincias.component.html',
  styleUrl: './listado-provincias.component.css'
})
export class ListadoProvinciasComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';
  search = '';
  cols = [
    { field: 'country.name', title: 'País' },
    { field: 'name', title: 'Provincia' },
    { field: 'action', title: 'Acciones', sort: false }
  ];
  provincias: any[] = [];
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
    this.obtenerProvincias(this.params.pagesize);
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
  }

  obtenerProvincias(paging: number, page?: number) {
    this.subscription.add(
      this._catalogoService.getProvinciasWithCountryAndPaging(paging, page).subscribe({
        next: res => {
          this.provincias = res.data;
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
          this.obtenerProvincias(this.params.pagesize, this.params.current_page);
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
              if (this.params.current_page === this.params.last_page) {
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

  changeServer(data: any) {
    this.params.current_page = data.current_page;
    this.params.pagesize = data.pagesize;
    if (data.change_type === 'search') {
      this.obtenerProvinciasConFiltro(data.pagesize, data.search);
    } else {
      this.obtenerProvincias(data.pagesize, data.current_page);
    }
  }

  obtenerProvinciasConFiltro(paging: number, filter: string) {
    this.subscription.add(
      this._catalogoService.getProvinciasWithNameFilter(paging, filter).subscribe({
        next: res => {
          console.log(res);
          this.provincias = res.data;
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
