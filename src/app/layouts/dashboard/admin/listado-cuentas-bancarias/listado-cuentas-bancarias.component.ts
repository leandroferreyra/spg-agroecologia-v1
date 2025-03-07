import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { CuentaBancariaDTO } from 'src/app/core/models/request/cuentaBancariaDTO';
import { CurrencyDTO } from 'src/app/core/models/request/currencyDTO';
import { CuentasBancariasService } from 'src/app/core/services/cuentas.service';
import { CurrenciesService } from 'src/app/core/services/currencies.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-cuentas-bancarias',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule, DataTableModule,
    NgxSpinnerModule, NgxTippyModule, IconPencilComponent, IconPlusComponent, IconTrashLinesComponent,
    FontAwesomeModule, IconSearchComponent, NgbPagination, NgSelectComponent],
  templateUrl: './listado-cuentas-bancarias.component.html',
  styleUrl: './listado-cuentas-bancarias.component.css'
})
export class ListadoCuentasBancariasComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';

  cuentasBancarias: any[] = [];
  monedas: any[] = [];
  tiposDeCuenta: any[] = [];
  bancos: any[] = [];


  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  // Orden y filtro
  showFilter: boolean = false;
  filtros: any = {
    account_number: '',
    alias: '',
    cbu: ''
    // name: '',
    // symbol: ''
  };
  ordenamiento: any = {
    // name: 'asc',
    // symbol: 'asc'
  };

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

  cuentaForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalCuenta') modalCuenta!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private _indexService: IndexService,
    private _cuentaBancariaService: CuentasBancariasService, private spinner: NgxSpinnerService,
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
    this.obtenerCuentas();
    // this.obtenerBancos();
    // this.obtenerTiposDeCuenta();
    // this.obtenerMonedas();
  }

  obtenerMonedas() {
    this.subscription.add(
      this._indexService.getMonedas(this.actual_role).subscribe({
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
      this._indexService.getBancos(this.actual_role).subscribe({
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
      this._indexService.getTipoDeCuentas(this.actual_role).subscribe({
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

  obtenerCuentas() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["bank", "currency", "accountType"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getCuentasBancariasLadieWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.cuentasBancarias = res.data;
          // console.log(this.cuentasBancarias);
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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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
      this._cuentaBancariaService.eliminarCuenta(cuenta.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          this.obtenerCuentas();
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

  cerrarModal() {
    this.isSubmit = false;
    this.modalCuenta.close();
  }

  confimarCuenta() {
    this.isSubmit = true;
    if (this.cuentaForm.valid) {
      this.spinner.show();
      let cuenta = new CuentaBancariaDTO();
      cuenta.bank_uuid = this.cuentaForm.get('bank_uuid')?.value;
      cuenta.account_type_uuid = this.cuentaForm.get('account_type_uuid')?.value;
      cuenta.currency_uuid = this.cuentaForm.get('currency_uuid')?.value;
      cuenta.account_number = this.cuentaForm.get('account_number')?.value;
      cuenta.cbu = this.cuentaForm.get('cbu')?.value;
      cuenta.alias = this.cuentaForm.get('alias')?.value;
      cuenta.actual_role = this.actual_role;
      if (!this.isEdicion) {
        this.subscription.add(
          this._cuentaBancariaService.saveCuenta(cuenta).subscribe({
            next: res => {
              this.obtenerCuentas();
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
          this._cuentaBancariaService.editCuenta(this.cuentaForm.get('uuid')?.value, cuenta).subscribe({
            next: res => {
              const index = this.cuentasBancarias.findIndex(p => p.uuid === (this.cuentaForm.get('uuid')?.value));
              if (index !== -1) {
                this.cuentasBancarias[index] = {
                  ...this.cuentasBancarias[index],
                  bank_uuid: this.cuentaForm.get('bank_uuid')?.value,
                  account_type_uuid: this.cuentaForm.get('account_type_uuid')?.value,
                  currency_uuid: this.cuentaForm.get('currency_uuid')?.value,
                  account_number: this.cuentaForm.get('account_number')?.value,
                  alias: this.cuentaForm.get('alias')?.value,
                  cbu: this.cuentaForm.get('cbu')?.value,
                };
                this.cuentasBancarias = [...this.cuentasBancarias];
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
    this.obtenerCuentas();
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


  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        account_number: '',
        alias: '',
        cbu: ''
      };
      this.obtenerCuentas();
    }
  }

}
