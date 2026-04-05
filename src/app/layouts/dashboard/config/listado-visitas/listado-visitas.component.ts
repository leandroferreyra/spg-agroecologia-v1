import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
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
import { PosicionDTO } from 'src/app/core/models/request/posicionDTO';
import { PrincipioDTO } from 'src/app/core/models/request/principioDTO';
import { PosicionResponse } from 'src/app/core/models/response/posicionResponse';
import { PrincipioResponse } from 'src/app/core/models/response/principioResponse';
import { PosicionService } from 'src/app/core/services/posicion.service';
import { PrincipioService } from 'src/app/core/services/principio.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-visitas',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, NgxTippyModule, DataTableModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule,
    IconPlusComponent, IconPencilComponent, IconTrashLinesComponent, NgbPagination, IconSearchComponent, FontAwesomeModule, NgSelectModule],
  templateUrl: './listado-visitas.component.html',
  styleUrl: './listado-visitas.component.css'
})
export class ListadoVisitasComponent {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';

  principios: any[] = [];
  principioForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;
  originalCheckedState: boolean = false;

  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;

  // Filtro
  filtros: any = {};
  MIN_FILTER_SIZE = 3;
  showFilter: boolean = false;

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

  // Referencia al modal para crear y editar bancos.
  @ViewChild('modalPrincipio') modalPrincipio!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private swalService: SwalService, private _principioService: PrincipioService,
    private spinner: NgxSpinnerService, private tokenService: TokenService) {
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
    this.obtenerPrincipios();
  }

  obtenerPrincipios() {
    this.spinner.show();
    this.subscription.add(
      this._principioService.getPrincipios().subscribe({
        next: res => {
          this.spinner.hide();
          this.principios = res;
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
    if (this.principios.length <= this.itemsPerPage) {
      this.itemsInPage = res.length;
    } else {
      this.itemsInPage = this.currentPage * this.itemsPerPage;
    }
  }

  public onPageChange(pageNum: number): void {
    this.pageSize = this.itemsPerPage * (pageNum - 1);
    this.itemsInPage = pageNum * this.itemsPerPage;
    if (this.itemsInPage > this.principios.length) {
      this.itemsInPage = this.principios.length;
    }
  }

  public changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  filtrarDatos(): PrincipioResponse[] {
    let resultados = this.principios;
    if (this.filtros.nombre && this.filtros.nombre.length >= this.MIN_FILTER_SIZE) {
      resultados = resultados.filter(dato =>
        dato.nombre.toLocaleLowerCase().includes(this.filtros.nombre.toLowerCase()))
    }
    return resultados;
  }

  openModalNuevoPrincipio(type: string, principio?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nueva posición';
      this.principioForm = new FormGroup({
        nombre: new FormControl(null, [Validators.required]),
      });
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición posición';
      this.principioForm = new FormGroup({
        id: new FormControl(principio?.id, []),
        nombre: new FormControl(principio?.nombre, [Validators.required])
      });
    }
    this.modalPrincipio.options = this.modalOptions;
    this.modalPrincipio.open();
  }

  confirmarPrincipio() {
    this.isSubmit = true;
    if (this.principioForm.valid) {
      this.spinner.show();
      let principio = new PrincipioDTO();
      principio.nombre = this.principioForm.get('nombre')?.value;
      if (!this.isEdicion) {
        this.subscription.add(
          this._principioService.save(principio).subscribe({
            next: res => {
              this.obtenerPrincipios();
              this.cerrarModal();
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
          this._principioService.updatePrincipio(principio, this.principioForm.get('id')?.value).subscribe({
            next: res => {
              this.obtenerPrincipios();
              this.cerrarModal();
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
    this.modalPrincipio.close();
  }

  openSwalCambiarEstadoPrincipio(principio: any, checkboxId: string) {
    this.originalCheckedState = principio.habilitado;
    Swal.fire({
      title: '',
      text: '¿Desea habilitar/deshabilitar la posición?',
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
      const checkbox = document.getElementById(checkboxId) as HTMLInputElement;
      if (result.isConfirmed) {
        this.cambiarEstadoPrincipio(principio, checkbox);
      } else if (result.isDenied) {
        checkbox.checked = this.originalCheckedState;
      }
    })
  }

  cambiarEstadoPrincipio(principio: any, checkbox: any) {
    this.spinner.show();
    this.subscription.add(
      this._principioService.updateStatus(principio.id).subscribe({
        next: res => {
          this.swalService.toastSuccess('top-right', 'Estado modificado con éxito.');
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          this.swalService.toastError('top-right', error.error.detalleError);
          checkbox.checked = this.originalCheckedState;
          console.error(error);
        }
      })
    )
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        'nombre': ''
      };
      this.obtenerPrincipios();
    }
  }

  // cambiarOrdenamiento(column: string) {
  //   // si el ordenamiento es asc, lo cambiamos a desc y si es desc, lo cambiamos a sin ordenamiento
  //   if (this.ordenamiento[column] === 'asc') {
  //     this.ordenamiento[column] = 'desc';
  //   } else if (this.ordenamiento[column] === 'desc') {
  //     this.ordenamiento[column] = 'asc';
  //   }
  //   this.obtenerBancos();
  // }


}
