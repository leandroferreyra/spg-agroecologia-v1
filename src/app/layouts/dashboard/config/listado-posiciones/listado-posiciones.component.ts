import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { Store } from '@ngrx/store';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { PosicionService } from 'src/app/core/services/posicion.service';
import { PosicionResponse } from 'src/app/core/models/response/posicionResponse';
import { PosicionDTO } from 'src/app/core/models/request/posicionDTO';

@Component({
  selector: 'app-listado-posiciones',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, NgxTippyModule, DataTableModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule,
    IconPlusComponent, IconPencilComponent, IconTrashLinesComponent, NgbPagination, IconSearchComponent, FontAwesomeModule, NgSelectModule],
  templateUrl: './listado-posiciones.component.html',
  styleUrl: './listado-posiciones.component.css'
})
export class ListadoPosicionesComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';

  posiciones: any[] = [];
  posicionForm!: FormGroup;
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
  @ViewChild('modalPosicion') modalPosicion!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private swalService: SwalService, private _posicionService: PosicionService,
    private spinner: NgxSpinnerService, private tokenService: TokenService) {
    this.initStore();
  }

  async initStore() {
    this.storeData
      .select((d) => d.index)
      .subscribe((d) => {
        this.actual_role = d.userRole;
        console.log("🚀 ~ ListadoPosicionesComponent ~ initStore ~ this.actual_role:", this.actual_role)
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.obtenerPosiciones();
  }

  obtenerPosiciones() {
    this.spinner.show();
    this.subscription.add(
      this._posicionService.getPosiciones().subscribe({
        next: res => {
          this.spinner.hide();
          this.posiciones = res;
          console.log("🚀 ~ ListadoPosicionesComponent ~ obtenerPosiciones ~ this.posiciones:", this.posiciones)
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
    if (this.posiciones.length <= this.itemsPerPage) {
      this.itemsInPage = res.length;
    } else {
      this.itemsInPage = this.currentPage * this.itemsPerPage;
    }
  }

  public onPageChange(pageNum: number): void {
    this.pageSize = this.itemsPerPage * (pageNum - 1);
    this.itemsInPage = pageNum * this.itemsPerPage;
    if (this.itemsInPage > this.posiciones.length) {
      this.itemsInPage = this.posiciones.length;
    }
  }

  public changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  filtrarDatos(): PosicionResponse[] {
    let resultados = this.posiciones;
    if (this.filtros.nombre && this.filtros.nombre.length >= this.MIN_FILTER_SIZE) {
      resultados = resultados.filter(dato =>
        dato.nombre.toLocaleLowerCase().includes(this.filtros.nombre.toLowerCase()))
    }
    return resultados;
  }

  openModalNuevaPosicion(type: string, posicion?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nueva posición';
      this.posicionForm = new FormGroup({
        nombre: new FormControl(null, [Validators.required]),
      });
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición posición';
      this.posicionForm = new FormGroup({
        id: new FormControl(posicion?.id, []),
        nombre: new FormControl(posicion?.nombre, [Validators.required])
      });
    }
    this.modalPosicion.options = this.modalOptions;
    this.modalPosicion.open();
  }

  confirmarPosicion() {
    this.isSubmit = true;
    if (this.posicionForm.valid) {
      this.spinner.show();
      let posicion = new PosicionDTO();
      posicion.nombre = this.posicionForm.get('nombre')?.value;
      if (!this.isEdicion) {
        this.subscription.add(
          this._posicionService.save(posicion).subscribe({
            next: res => {
              this.obtenerPosiciones();
              this.cerrarModal();
              // this.swalService.toastSuccess('top-right', res.message);
              // this.tokenService.setToken(res.token);
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
          this._posicionService.updatePosicion(posicion, this.posicionForm.get('id')?.value).subscribe({
            next: res => {
              this.obtenerPosiciones();
              this.cerrarModal();
              // this.swalService.toastSuccess('top-right', res.message)
              // this.tokenService.setToken(res.token);
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
    this.modalPosicion.close();
  }

  openSwalEliminar(posicion: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar la posición ${posicion.nombre}?`,
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
        // this.eliminarBanco(banco);
      } else if (result.isDenied) {

      }
    })
  }

  openSwalCambiarEstadoPosicion(posicion: any, checkboxId: string) {
    this.originalCheckedState = posicion.habilitado;
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
        this.cambiarEstadoPosicion(posicion, checkbox);
      } else if (result.isDenied) {
        checkbox.checked = this.originalCheckedState;
      }
    })
  }

  cambiarEstadoPosicion(user: any, checkbox: any) {
    this.spinner.show();
    this.subscription.add(
      this._posicionService.updateStatus(user.id).subscribe({
        next: res => {
          console.log(res);
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
      this.obtenerPosiciones();
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
