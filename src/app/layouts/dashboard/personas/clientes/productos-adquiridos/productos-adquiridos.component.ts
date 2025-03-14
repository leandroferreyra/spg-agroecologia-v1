import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { CompraProveedorDTO } from 'src/app/core/models/request/compraProveedorDTO';
import { ComprasProveedorService } from 'src/app/core/services/comprasProveedor.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-productos-adquiridos',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgxSpinnerModule, NgxTippyModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule,
    NgSelectModule, IconTrashLinesComponent, IconPencilComponent, IconSearchComponent, IconPlusComponent, FontAwesomeModule
  ],
  templateUrl: './productos-adquiridos.component.html',
  styleUrl: './productos-adquiridos.component.css'
})
export class ProductosAdquiridosComponent implements OnInit, OnDestroy {


  @Input() cliente: any;
  @Input() rol!: string;
  productos: any[] = [];
  // monedas: any[] = [];
  // tiposDeCuenta: any[] = [];
  // bancos: any[] = [];

  private subscription: Subscription = new Subscription();

  // Orden, filtro y paginación para cuentas bancarias de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  filtros: any = {
    'transaction.transactionType.name': { value: '', op: '=', contiene: false },
    'transaction.person.uuid': { value: '', op: '=', contiene: false }
  };
  showFilterCompras: boolean = false;
  ordenamiento: any = {
    'transaction.transaction_datetime': 'desc'
  };

  // Referencia al modal para crear y editar países.
  @ViewChild('modalProducto') modalProducto!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  compraForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;


  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

  constructor(private _indexService: IndexService, private _swalService: SwalService, private spinner: NgxSpinnerService,
    private _compraService: ComprasProveedorService, private _tokenService: TokenService) {

  }
  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cliente'] && changes['cliente'].currentValue) {
      this.spinner.show();
      // Si el supplierUuid cambia, actualizamos los filtros y obtenemos las compras
      this.filtros['transaction.transactionType.name'].value = 'Venta';
      this.filtros['transaction.person.uuid'].value = this.cliente.person?.uuid;
      this.obtenerProductosAdquiridos();
    }
  }

  cambiarOrdenamiento(column: string) {
    // si el ordenamiento es asc, lo cambiamos a desc y si es desc, lo cambiamos a sin ordenamiento
    if (this.ordenamiento[column] === 'asc') {
      this.ordenamiento[column] = 'desc';
    } else if (this.ordenamiento[column] === 'desc') {
      this.ordenamiento[column] = 'asc';
    }
    this.obtenerProductosAdquiridos();
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalProducto.close();
  }

  confirmarCompra() {
    this.isSubmit = true;
    if (this.compraForm.valid) {
      this.spinner.show();
      let compra = new CompraProveedorDTO();
      compra.bank_uuid = this.compraForm.get('bank_uuid')?.value;
      compra.account_type_uuid = this.compraForm.get('account_type_uuid')?.value;
      compra.currency_uuid = this.compraForm.get('currency_uuid')?.value;
      compra.account_number = this.compraForm.get('account_number')?.value;
      compra.cbu = this.compraForm.get('cbu')?.value;
      compra.alias = this.compraForm.get('alias')?.value;
      compra.actual_role = this.rol;
      // compra.supplier_uuid = this.proveedor.uuid;
      if (!this.isEdicion) {
        this.subscription.add(
          this._compraService.saveCompra(compra).subscribe({
            next: res => {
              this.obtenerProductosAdquiridos();
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
          this._compraService.editCompra(this.compraForm.get('uuid')?.value, compra).subscribe({
            next: res => {
              this.obtenerProductosAdquiridos();
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

  obtenerProductosAdquiridos() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["product.productType", "transaction.person.customer", "transaction.transactionType", "saleProduct.productInstances"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getProductosAdquiridosWithParam(params, this.rol).subscribe({
        next: res => {
          console.log(res.data);
          this.productos = res.data;
          this.modificarPaginacion(res);
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
    if (this.productos.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }


  openModalNuevaCompra(type: string, compra?: any) {
    // this.obtenerBancos();
    // this.obtenerTiposDeCuenta();
    // this.obtenerMonedas();
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nueva compra';
      this.compraForm = new FormGroup({
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
      this.tituloModal = 'Edición compra';
      this.compraForm = new FormGroup({
        uuid: new FormControl(compra?.uuid, []),
        bank_uuid: new FormControl(compra?.bank?.uuid, [Validators.required]),
        account_type_uuid: new FormControl(compra?.account_type?.uuid, [Validators.required]),
        currency_uuid: new FormControl(compra?.currency?.uuid, [Validators.required]),
        account_number: new FormControl(compra?.account_number, [Validators.required]),
        cbu: new FormControl(compra?.cbu, []),
        alias: new FormControl(compra?.alias, []),
      });
    }
    this.modalProducto.options = this.modalOptions;
    this.modalProducto.open();
  }

  toggleFilter() {
    this.showFilterCompras = !this.showFilterCompras;
    if (!this.showFilterCompras) {
      this.filtros.account_number = { value: '', op: 'LIKE', contiene: true }
      this.filtros.alias = { value: '', op: 'LIKE', contiene: true }
      this.filtros.cbu = { value: '', op: 'LIKE', contiene: true }
      this.obtenerProductosAdquiridos();
    }
  }

  openSwalEliminar(compra: any) {
    console.log(compra);
    Swal.fire({
      title: '',
      text: `¿Desea eliminar la compra ${compra.name}?`,
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
        this.eliminarCompra(compra);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarCompra(compra: any) {
    this.spinner.show();
    this.subscription.add(
      this._compraService.deleteCompra(compra.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerProductosAdquiridos();
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

  // obtenerMonedas() {
  //   this.subscription.add(
  //     this._indexService.getMonedas(this.rol).subscribe({
  //       next: res => {
  //         // console.log(res);
  //         this.monedas = res.data;
  //       },
  //       error: error => {
  //         console.error(error);
  //       }
  //     })
  //   )
  // }

  // obtenerBancos() {
  //   this.subscription.add(
  //     this._indexService.getBancos(this.rol).subscribe({
  //       next: res => {
  //         // console.log(res);
  //         this.bancos = res.data;
  //       },
  //       error: error => {
  //         console.error(error);
  //       }
  //     })
  //   )
  // }

  // obtenerTiposDeCuenta() {
  //   this.subscription.add(
  //     this._indexService.getTipoDeCuentas(this.rol).subscribe({
  //       next: res => {
  //         // console.log(res);
  //         this.tiposDeCuenta = res.data;
  //       },
  //       error: error => {
  //         console.error(error);
  //       }
  //     })
  //   )
  // }

}
