import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { faCommentNodes } from '@fortawesome/free-solid-svg-icons';
import { NgbPagination, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { ModalOptions, NgxCustomModalComponent } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { CuentaBancariaDTO } from 'src/app/core/models/request/cuentaBancariaDTO';
import { CuentaBancariaProveedorDTO } from 'src/app/core/models/request/cuentaBancariaProveedorDTO';
import { CuentasProveedorService } from 'src/app/core/services/cuentasProveedor.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cuentas-bancarias',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgxSpinnerModule, NgxTippyModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule,
    NgSelectModule, IconTrashLinesComponent, IconPencilComponent, IconSearchComponent, IconPlusComponent
  ],
  templateUrl: './cuentas-bancarias.component.html',
  styleUrl: './cuentas-bancarias.component.css'
})
export class CuentasBancariasComponent implements OnInit, OnDestroy {


  @Input() proveedor: any;
  @Input() rol!: string;
  cuentasBancarias: any[] = [];
  monedas: any[] = [];
  tiposDeCuenta: any[] = [];
  bancos: any[] = [];

  private subscription: Subscription = new Subscription();

  // Orden, filtro y paginación para cuentas bancarias de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  filtrosCuentasBancarias: any = {
    'supplier.uuid': { value: '', op: '=', contiene: false }
  };
  showFilterCuentasBancarias: boolean = false;
  ordenamiento: any = {

  };

  // Referencia al modal para crear y editar países.
  @ViewChild('modalCuenta') modalCuenta!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  cuentaForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  constructor(private _indexService: IndexService, private _swalService: SwalService, private spinner: NgxSpinnerService,
    private _cuentasBancariasService: CuentasProveedorService, private _tokenService: TokenService) {

  }
  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['proveedor'] && changes['proveedor'].currentValue) {
      this.spinner.show();
      // Si el supplierUuid cambia, actualizamos los filtros y obtenemos las cuentas
      this.filtrosCuentasBancarias['supplier.uuid'].value = this.proveedor.uuid;
      this.obtenerCuentasBancariasDeProveedor();
    }
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalCuenta.close();
  }

  confirmarCuenta() {
    this.isSubmit = true;
    if (this.cuentaForm.valid) {
      this.spinner.show();
      let cuenta = new CuentaBancariaProveedorDTO();
      cuenta.bank_uuid = this.cuentaForm.get('bank_uuid')?.value;
      cuenta.account_type_uuid = this.cuentaForm.get('account_type_uuid')?.value;
      cuenta.currency_uuid = this.cuentaForm.get('currency_uuid')?.value;
      cuenta.account_number = this.cuentaForm.get('account_number')?.value;
      cuenta.cbu = this.cuentaForm.get('cbu')?.value;
      cuenta.alias = this.cuentaForm.get('alias')?.value;
      cuenta.actual_role = this.rol;
      cuenta.supplier_uuid = this.proveedor.uuid;
      if (!this.isEdicion) {
        this.subscription.add(
          this._cuentasBancariasService.saveCuenta(cuenta).subscribe({
            next: res => {
              this.obtenerCuentasBancariasDeProveedor();
              this.cerrarModal();
              this._swalService.toastSuccess('top-right', res.message);
              this._tokenService.setToken(res.token);
              this.spinner.hide();
            },
            error: error => {
              this._swalService.toastError('top-right', error.error.message);
              console.error(error);
              this.spinner.hide();
            }
          })
        )
      } else {
        this.subscription.add(
          this._cuentasBancariasService.editCuenta(this.cuentaForm.get('uuid')?.value, cuenta).subscribe({
            next: res => {
              this.obtenerCuentasBancariasDeProveedor();
              this.cerrarModal();
              this._swalService.toastSuccess('top-right', res.message)
              this._tokenService.setToken(res.token);
              this.spinner.hide();
            },
            error: error => {
              console.error(error);
              this.spinner.hide();
              this._swalService.toastError('top-right', error.error.message);
            }
          })
        )
      }
    }
  }

  obtenerCuentasBancariasDeProveedor() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["bank", "currency", "accountType"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtrosCuentasBancarias;

    this.subscription.add(
      this._indexService.getCuentasProveedorWithParam(params, this.rol).subscribe({
        next: res => {
          this.cuentasBancarias = res.data;
          this.modificarPaginacion(res);
          this._tokenService.setToken(res.token);
          this.spinner.hide();
        },
        error: error => {
          this._swalService.toastError('top-right', error.error.message);
          console.error(error);
          this.spinner.hide();
        }
      })
    )
  }

  modificarPaginacion(res: any) {
    this.total_rows = res.meta.total;
    this.last_page = res.meta.last_page;
    if (this.cuentasBancarias.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }


  openModalNuevaCuenta(type: string, cuenta?: any) {
    this.obtenerBancos();
    this.obtenerTiposDeCuenta();
    this.obtenerMonedas();
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nueva cuenta';
      this.cuentaForm = new FormGroup({
        bank_uuid: new FormControl(null, [Validators.required]),
        account_type_uuid: new FormControl(null, [Validators.required]),
        currency_uuid: new FormControl(null, [Validators.required]),
        account_number: new FormControl(null, [Validators.required]),
        cbu: new FormControl(null, []),
        alias: new FormControl(null, []),
      });
    } else {
      // console.log(moneda);
      this.isEdicion = true;
      this.tituloModal = 'Edición cuenta';
      this.cuentaForm = new FormGroup({
        uuid: new FormControl(cuenta?.uuid, []),
        bank_uuid: new FormControl(cuenta?.bank?.uuid, [Validators.required]),
        account_type_uuid: new FormControl(cuenta?.account_type?.uuid, [Validators.required]),
        currency_uuid: new FormControl(cuenta?.currency?.uuid, [Validators.required]),
        account_number: new FormControl(cuenta?.account_number, [Validators.required]),
        cbu: new FormControl(cuenta?.cbu, []),
        alias: new FormControl(cuenta?.alias, []),
      });
    }
    this.modalCuenta.options = this.modalOptions;
    this.modalCuenta.open();
  }

  toggleFilter() {
    this.showFilterCuentasBancarias = !this.showFilterCuentasBancarias;
    if (!this.showFilterCuentasBancarias) {
      delete this.filtrosCuentasBancarias.account_number;
      delete this.filtrosCuentasBancarias.alias;
      delete this.filtrosCuentasBancarias.cbu;
      this.obtenerCuentasBancariasDeProveedor();
    } else {
      this.filtrosCuentasBancarias.account_number = { value: '', op: 'LIKE', contiene: true }
      this.filtrosCuentasBancarias.alias = { value: '', op: 'LIKE', contiene: true }
      this.filtrosCuentasBancarias.cbu = { value: '', op: 'LIKE', contiene: true }
    }
  }

  openSwalEliminar(cuenta: any) {
    console.log(cuenta);
    Swal.fire({
      title: '',
      text: `¿Desea eliminar la cuenta ${cuenta.account_number}?`,
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
        this.eliminarCuenta(cuenta);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarCuenta(cuenta: any) {
    this.spinner.show();
    this.subscription.add(
      this._cuentasBancariasService.eliminarCuenta(cuenta.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerCuentasBancariasDeProveedor();
          this._tokenService.setToken(res.token);
          this.spinner.hide();
        },
        error: error => {
          console.error(error);
          this._swalService.toastError('top-right', error.error.message);
          this.spinner.hide();
        }
      })
    )
  }

  obtenerMonedas() {
    this.subscription.add(
      this._indexService.getMonedas(this.rol).subscribe({
        next: res => {
          // console.log(res);
          this.monedas = res.data;
        },
        error: error => {
          console.error(error);
        }
      })
    )
  }

  obtenerBancos() {
    this.subscription.add(
      this._indexService.getBancos(this.rol).subscribe({
        next: res => {
          // console.log(res);
          this.bancos = res.data;
        },
        error: error => {
          console.error(error);
        }
      })
    )
  }

  obtenerTiposDeCuenta() {
    this.subscription.add(
      this._indexService.getTipoDeCuentas(this.rol).subscribe({
        next: res => {
          // console.log(res);
          this.tiposDeCuenta = res.data;
        },
        error: error => {
          console.error(error);
        }
      })
    )
  }

}
