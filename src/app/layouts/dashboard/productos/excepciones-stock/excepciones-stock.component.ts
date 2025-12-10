import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FlatpickrDirective } from 'angularx-flatpickr';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { ModalOptions, NgxCustomModalComponent } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { RegistroCalidadDTO } from 'src/app/core/models/request/registroCalidadDTO';
import { IndexService } from 'src/app/core/services/index.service';
import { RegistroCalidadService } from 'src/app/core/services/registroCalidad.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';
import { format } from 'date-fns';

enum RecordType {
  Reserva = 'Reserva',
  Muestra = 'Muestra',
  NoConformidad = 'No conformidad'
}

@Component({
  selector: 'app-excepciones-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxTippyModule, NgSelectModule, NgbPaginationModule, NgxSpinnerModule, IconPencilComponent,
    IconTrashLinesComponent, FontAwesomeModule, IconPlusComponent, NgxCustomModalComponent, FlatpickrDirective],
  templateUrl: './excepciones-stock.component.html',
  styleUrl: './excepciones-stock.component.css'
})
export class ExcepcionesStockComponent implements OnInit, OnDestroy {

  @Input() producto: any;
  @Input() rol!: string;
  usuarioLogueado: any;
  private subscription: Subscription = new Subscription();

  // Orden, filtro y paginación para compras de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;
  filtros: any = {
    'stock.product.uuid': { value: '', op: '=', contiene: false },
  };
  ordenamiento: any = {
    'detection_datetime': 'asc'
  };

  reservas: any[] = [];
  muestras: any[] = [];
  noConformidades: any[] = [];

  usuarios: any[] = [];
  stocks: any[] = [];

  @ViewChild('modalExcepcion') modalExcepcion!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  registroForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;
  requiereInstancias = false;
  instanciasProducto: any[] = [];

  // Iconos
  iconEye = faEye;
  iconEyeSlash = faEyeSlash;

  mostrarReservas = true;
  mostrarMuestras = true;
  mostrarNoConformidades = true;

  constructor(private _indexService: IndexService, private _swalService: SwalService, private spinner: NgxSpinnerService, private _registroService: RegistroCalidadService,
    private _tokenService: TokenService, private _userLogged: UserLoggedService) {
  }

  ngOnInit(): void {
    this.usuarioLogueado = this._userLogged.getUsuarioLogueado;
  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['producto'] && changes['producto'].currentValue) {
      this.spinner.show();
      this.filtros['stock.product.uuid'].value = this.producto.uuid;
      this.obtenerRegistrosCalidad();
      this.obtenerUsuarios();
      this.obtenerStocks();
    }
  }

  obtenerRegistrosCalidad() {
    const params: any = {};
    params.with = ["responsibleUser", "stock.product.measure", "stock.batch", "stock.productInstances", "productInstances"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getRegistrosCalidad(params, this.rol).subscribe({
        next: res => {
          this.reservas = res.data.filter((r: any) => r.record_type === RecordType.Reserva);
          this.muestras = res.data.filter((r: any) => r.record_type === RecordType.Muestra);
          this.noConformidades = res.data.filter((r: any) => r.record_type === RecordType.NoConformidad);
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

  obtenerUsuarios() {
    this.subscription.add(
      this._indexService.getUsuariosWithParam(null, this.rol).subscribe({
        next: res => {
          this.usuarios = res.data;
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

  obtenerStocks() {
    const params: any = {};
    params.with = ["batch", "productInstances.qualityRecords", "product"];
    params.filters = {
      'product.uuid': { value: this.producto.uuid, op: '=', contiene: false },
      'product.productType.stock_controlled': { value: '1', op: '=', contiene: false },
    };

    this.subscription.add(
      this._indexService.getStocksWithParam(params, this.rol).subscribe({
        next: res => {
          this.stocks = res.data;
          this.stocks = res.data.map((stock: any) => ({
            ...stock,
            nombreCompleto: this.armarStock(this.producto, stock),
            disabled: +stock.available_amount === 0
          }));
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
  armarStock(producto: any, stock: any) {
    const batchId = stock.batch?.batch_identification ?? "Lote único";
    const batchType = stock.batch?.batch_type ?? "";

    let amount;
    if (producto.measure?.is_integer === 1) {
      amount = (+stock.available_amount).toFixed(0);
    } else {
      amount = (+stock.available_amount).toFixed(2);
    }
    return `${batchId} ${batchType} | Disponibles: ${amount}`;
  }

  getSerials(instances: any[]): string {
    if (!instances?.length) return '';
    return instances.map(i => i.serial_number).join(', ');
  }

  compararStocks = (stock1: any, stock2: any) => stock1 && stock2 && stock1.uuid === stock2.uuid;


  openModalRegistro(type: string, record_type: string, registro?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nuevo registro de calidad';
      this.inicializarForm(record_type);
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Editar registro de calidad';
      this.requiereInstancias = registro?.product_instances?.length > 0;
      this.instanciasProducto = this.requiereInstancias ? registro.stock?.product_instances : [];
      this.inicializarForm(record_type, registro);
    }
    this.modalExcepcion.options = this.modalOptions;
    this.modalExcepcion.open();
  }

  inicializarForm(record_type: string, registro?: any) {
    this.registroForm = new FormGroup({
      uuid: new FormControl({ value: registro ? registro.uuid : null, disabled: true }, []),
      record_type: new FormControl({ value: registro ? registro.record_type : record_type, disabled: true }, [Validators.required]),
      stock_uuid: new FormControl(registro ? registro.stock : null, [Validators.required]),
      quantity: new FormControl({ value: registro ? this.showCantidad(registro.stock, registro.quantity) : null, disabled: !this.isEdicion }, [Validators.required]),
      description: new FormControl(registro ? registro.description : null, [Validators.required]),
      detection_datetime: new FormControl({ value: registro ? this.showFecha(registro.detection_datetime) : new Date(), disabled: false }, [Validators.required]),
      product_instance_uuids: new FormControl({ value: registro ? registro.product_instances?.map((p: any) => p.uuid) : [], disabled: false }, []),
      usuario: new FormControl(registro ? registro.responsible_user?.uuid : this.usuarioLogueado.uuid, [Validators.required]),
    });
    this.onFormChange();
  }
  onFormChange() {
    this.registroForm.get('stock_uuid')!.valueChanges.subscribe(
      async (stock: any) => {
        if (stock) {
          this.registroForm.get('quantity')?.enable();
        } else {
          this.registroForm.get('quantity')?.disable();
          this.registroForm.get('quantity')?.setValue(null);
        }
        if (stock.product?.assign_serial_number === 1 || stock.product?.has_serial_number === 1) {
          this.requiereInstancias = true;
          this.instanciasProducto = stock.product_instances;
        } else {
          this.requiereInstancias = false;
          this.instanciasProducto = [];
        }
      });

    this.registroForm.get('quantity')!.valueChanges.subscribe(
      async (cantidad: any) => {
        // Acá se chequea que si pone una cantidad de stock mayor a la disponible, se setea automáticamente todos los disponibles.
        let disponible = +this.registroForm.get('stock_uuid')?.value?.available_amount;
        if (disponible && cantidad) {
          let valor = +cantidad > disponible ? +disponible : +cantidad;
          this.registroForm.get('quantity')?.setValue(valor, { emitEvent: false }); // El emitEvent es para que no sea recursivo.
        }
      });
  }

  openSwalEliminar(registro: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el registro?`,
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
        this.eliminarRegistroCalidad(registro);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarRegistroCalidad(registro: any) {
    this.spinner.show();
    this.subscription.add(
      this._registroService.eliminarRegistro(registro.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerRegistrosCalidad();
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

  cerrarModal() {
    this.isSubmit = false;
    this.isEdicion = false;
    this.modalExcepcion.close();
  }

  confirmarRegistroCalidad() {
    if (this.isEdicion) {
      this.confirmarEdicionRegistro();
    } else {
      this.isSubmit = true;
      this.confirmarNuevoRegistro();
    }

  }

  confirmarNuevoRegistro() {
    if (this.requiereInstancias) {
      let cantidad = this.registroForm.get('quantity')?.value;
      let instances = this.registroForm.get('product_instance_uuids')?.value;
      if (cantidad != instances.length)
        this.registroForm.get('product_instance_uuids')?.setErrors({ noCoincide: true })
    }
    if (this.registroForm.valid) {
      this.spinner.show();
      let registroDTO = new RegistroCalidadDTO();
      registroDTO.actual_role = this.rol;
      registroDTO.description = this.registroForm.get('description')?.value;
      registroDTO.record_type = this.registroForm.get('record_type')?.value;
      registroDTO.quantity = this.registroForm.get('quantity')?.value;
      const fechaFormateada = this.registroForm.get('detection_datetime')?.value instanceof Date
        ? format(this.registroForm.get('detection_datetime')?.value, 'dd-MM-yyyy')
        : this.registroForm.get('detection_datetime')?.value;
      registroDTO.detection_datetime = this.convertirFechaADateBackend(fechaFormateada);
      registroDTO['user->responsible_user_uuid'] = this.registroForm.get('usuario')?.value;
      registroDTO.stock_uuid = this.registroForm.get('stock_uuid')?.value.uuid;
      registroDTO.product_instance_uuids = this.registroForm.get('product_instance_uuids')?.value;

      this.subscription.add(
        this._registroService.saveRegistro(registroDTO).subscribe({
          next: res => {
            this.spinner.hide();
            this._tokenService.setToken(res.token);
            this.obtenerRegistrosCalidad();
            this.cerrarModal();
          },
          error: error => {
            this.spinner.hide();
            console.error(error);
            this._swalService.toastError('top-right', error.error.message);
          }
        })
      );
    }
  }

  confirmarEdicionRegistro() {
    if (this.registroForm.pristine) {
      this._swalService.toastInfo('top-right', 'No hubo modificaciones.')
      return;
    }
    this.isSubmit = true;
    if (this.requiereInstancias) {
      let cantidad = this.registroForm.get('quantity')?.value;
      let instances = this.registroForm.get('product_instance_uuids')?.value;
      if (cantidad != instances.length)
        this.registroForm.get('product_instance_uuids')?.setErrors({ noCoincide: true })
    }
    if (this.registroForm.valid) {
      this.spinner.show();
      let registroDTO = new RegistroCalidadDTO();
      this.armarDTOEdicion(registroDTO);
      registroDTO.actual_role = this.rol;
      this.subscription.add(
        this._registroService.editRegistro(this.registroForm.get('uuid')?.value, registroDTO).subscribe({
          next: res => {
            this.spinner.hide();
            this._tokenService.setToken(res.token);
            this.obtenerRegistrosCalidad();
            this.cerrarModal();
          },
          error: error => {
            this.spinner.hide();
            console.error(error);
            this._swalService.toastError('top-right', error.error.message);
          }
        })
      );
    }
  }

  armarDTOEdicion(registroDTO: RegistroCalidadDTO) {
    Object.keys(this.registroForm.controls).forEach(key => {
      const control = this.registroForm.get(key);
      if (!control) return;

      if (!control?.pristine) {
        if (key === 'detection_datetime') {
          const fechaFormateada = control.value instanceof Date
            ? format(control.value, 'dd-MM-yyyy')
            : control.value;
          registroDTO[key] = this.convertirFechaADateBackend(fechaFormateada);
        } else {
          (registroDTO as any)[key] = control.value;
        }
      }
    });
  }

  showFecha(dato: any) {
    const date = new Date(dato.replace(' ', 'T'));
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }


  convertirFechaADateBackend(fechaStr: string): string {
    const [dia, mes, anio] = fechaStr.split('-');
    return `${anio}-${mes}-${dia}`;
  }

  showCantidad(data: any, quantity: any) {
    if (data.product?.measure?.is_integer === 1) {
      return (+quantity).toFixed(0);
    } else {
      return (+quantity).toFixed(2);
    }
  }

  getMostrarOcultarTooltipReservas() {
    return this.mostrarReservas ? 'Ocultar' : 'Mostrar';
  }

  getMostrarOcultarTooltipMuestras() {
    return this.mostrarMuestras ? 'Ocultar' : 'Mostrar';
  }

  getMostrarOcultarTooltipNoConformidades() {
    return this.mostrarNoConformidades ? 'Ocultar' : 'Mostrar';
  }

  toggleReservas() {
    this.mostrarReservas = !this.mostrarReservas;
  }

  toggleMuestras() {
    this.mostrarMuestras = !this.mostrarMuestras;
  }

  toggleNoConformidades() {
    this.mostrarNoConformidades = !this.mostrarNoConformidades;
  }
}
