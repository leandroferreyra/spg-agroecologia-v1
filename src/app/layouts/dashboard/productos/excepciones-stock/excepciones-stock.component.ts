import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { IconExpandItemComponent } from 'src/app/shared/icon/icon-expand-item';
import { IconCollapseItemComponent } from 'src/app/shared/icon/icon-collapse-item';
import { DisposicionDTO } from 'src/app/core/models/request/disposicionDTO';
import { EjecucionDTO } from 'src/app/core/models/request/ejecucionDTO';
import { IconMultipleForwardRightComponent } from 'src/app/shared/icon/icon-multiple-forward-right';
import { __makeTemplateObject } from 'tslib';

enum RecordType {
  Reserva = 'Reserva',
  Muestra = 'Muestra',
  NoConformidad = 'No conformidad'
}

@Component({
  selector: 'app-excepciones-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxTippyModule, NgSelectModule, NgbPaginationModule, NgxSpinnerModule, IconPencilComponent,
    IconTrashLinesComponent, FontAwesomeModule, IconPlusComponent, NgxCustomModalComponent, FlatpickrDirective, IconExpandItemComponent, IconCollapseItemComponent,
    IconMultipleForwardRightComponent],
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

  expandedRows: { [uuid: string]: boolean } = {};
  isEditing: { [uuid: string]: boolean } = {};
  disposiciones: any[] = [];

  expandedNC: Record<string, boolean> = {};
  expandedDisposicion: Record<string, boolean> = {};

  disposicionesPorNC: Record<string, any[]> = {};

  usuarios: any[] = [];
  stocks: any[] = [];

  @ViewChild('modalExcepcion') modalExcepcion!: NgxCustomModalComponent;
  @ViewChild('modalDisposicion') modalDisposicion!: NgxCustomModalComponent;
  @ViewChild('modalEjecucion') modalEjecucion!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  registroForm!: FormGroup;
  disposicionForm!: FormGroup;
  ejecucionForm!: FormGroup;
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

    }
  }

  obtenerRegistrosCalidad() {
    const params: any = {};
    params.with = ["responsibleUser", "stock.product.measure", "stock.batch", "stock.productInstances.qualityRecords", "productInstances"];
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
    this.obtenerStocks();
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nuevo registro de calidad';
      this.inicializarForm(record_type);
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Editar registro de calidad';
      this.requiereInstancias = registro?.product_instances?.length > 0;
      // this.instanciasProducto = this.requiereInstancias ? registro.stock?.product_instances : [];
      // Se arman las instancias según si las usa otro registro o no.
      this.instanciasProducto = this.requiereInstancias
        ? this.mapInstanciasEdicion(registro.stock?.product_instances, registro.uuid)
        : [];
      this.inicializarForm(record_type, registro);
    }
    this.modalExcepcion.options = this.modalOptions;
    this.modalExcepcion.open();
  }
  mapInstanciasEdicion(instancias: any[], registroUuid: string) {
    return instancias.map(instancia => {
      const usadaPorOtro =
        instancia.quality_records?.length > 0 &&
        !instancia.quality_records.some(
          (qr: any) => qr.uuid === registroUuid
        );

      return {
        ...instancia,
        disabled: usadaPorOtro
      };
    });
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
          // Se deshabilitan aquellas instancias que ya fueron seleccionadas por otro registro de calidad.
          this.instanciasProducto = stock.product_instances.map((instancia: any) => ({
            ...instancia,
            disabled: Array.isArray(instancia.quality_records) &&
              instancia.quality_records.length > 0
          }));
          // this.instanciasProducto = stock.product_instances;
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
      text: `¿Desea devolver el registro al stock disponible?`,
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

  armarDTOEdicionEjecucion(ejecucionDTO: EjecucionDTO) {
    Object.keys(this.ejecucionForm.controls).forEach(key => {
      const control = this.ejecucionForm.get(key);
      if (!control) return;

      if (!control?.pristine) {
        if (key === 'execution_datetime') {
          const fechaFormateada = control.value instanceof Date
            ? format(control.value, 'dd-MM-yyyy')
            : control.value;
          ejecucionDTO[key] = this.convertirFechaADateBackend(fechaFormateada);
        } else {
          (ejecucionDTO as any)[key] = control.value;
        }
      }
    });
  }

  armarDTOEdicionDisposicion(disposicion: DisposicionDTO) {
    Object.keys(this.disposicionForm.controls).forEach(key => {
      const control = this.disposicionForm.get(key);
      if (!control) return;

      if (!control?.pristine) {
        if (key === 'disposition_datetime') {
          const fechaFormateada = control.value instanceof Date
            ? format(control.value, 'dd-MM-yyyy')
            : control.value;
          disposicion[key] = this.convertirFechaADateBackend(fechaFormateada);
        } else {
          (disposicion as any)[key] = control.value;
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

  toggleNC(nc: any) {
    const id = nc.uuid;
    this.expandedNC[id] = !this.expandedNC[id];

    if (this.expandedNC[id] && !this.disposicionesPorNC[id]) {
      this.obtenerDisposiciones(id);
    }
  }

  obtenerDisposiciones(noConformidadID: any) {
    const params: any = {};
    params.with = ["qualityRecord", "dispositionExecutions", "responsibleUser", "dispositionExecutions.responsibleUser"];
    params.filters = {
      'qualityRecord.uuid': { value: noConformidadID, op: '=', contiene: false }
    };
    params.ordenamiento = {
      'disposition_datetime': 'asc'
    };
    params.paging = 10;
    this.subscription.add(
      this._indexService.getDisposiciones(params, this.rol).subscribe({
        next: res => {
          this.disposicionesPorNC[noConformidadID] = res.data
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

  toggleDisposicion(disposicion: any) {
    this.expandedDisposicion[disposicion.uuid] = !this.expandedDisposicion[disposicion.uuid];
  }

  openModalDisposicion(type: string, noConformidad: any, disposicion?: any) {
    if (type === 'NEW') {
      this.inicializarFormDisposicion(noConformidad);
      this.tituloModal = 'Nueva disposición';
      this.isEdicion = false;
    } else {
      this.inicializarFormDisposicion(noConformidad, disposicion);
      this.isEdicion = true;
      this.tituloModal = 'Edición de disposición';
    }
    this.modalDisposicion.options = this.modalOptions;
    this.modalDisposicion.open();
  }

  openModalEjecucion(type: string, disposicion: any, ejecucion?: any) {
    if (type === 'NEW') {
      this.inicializarFormEjecucion(disposicion);
      this.tituloModal = 'Nueva ejecución';
      this.isEdicion = false;
    } else {
      this.inicializarFormEjecucion(disposicion, ejecucion);
      this.tituloModal = 'Edición de ejecución';
      this.isEdicion = true;
    }
    this.modalEjecucion.options = this.modalOptions;
    this.modalEjecucion.open();
  }

  inicializarFormDisposicion(noConformidad: any, disposicion?: any) {
    this.disposicionForm = new FormGroup({
      disposicion_uuid: new FormControl({ value: disposicion ? disposicion.uuid : null, disabled: false }, []),
      quality_record_uuid: new FormControl({ value: disposicion ? disposicion.quality_record?.uuid : noConformidad.uuid, disabled: false }, [Validators.required]),
      disposition_datetime: new FormControl({ value: disposicion ? this.showFecha(disposicion.disposition_datetime) : new Date(), disabled: false }, [Validators.required]),
      defect_type: new FormControl({ value: disposicion ? disposicion.defect_type : null, disabled: false }, [Validators.required]),
      disposition_action: new FormControl({ value: disposicion ? disposicion.disposition_action : null, disabled: false }, [Validators.required]),
      disposition_instruction: new FormControl({ value: disposicion ? disposicion.disposition_instruction : null, disabled: false }, [Validators.required]),
      corrective_action: new FormControl({ value: disposicion ? disposicion.corrective_action : null, disabled: false }, []),
      corrective_action_comments: new FormControl({ value: disposicion ? disposicion.corrective_action_comments : null, disabled: false }, []),
      user: new FormControl({ value: disposicion ? disposicion.responsible_user?.uuid : this.usuarioLogueado.uuid, disabled: false }, [Validators.required]),
    })
    this.formDisposicionChange();
  }

  formDisposicionChange() {
    this.disposicionForm.get('corrective_action')?.valueChanges.subscribe(action => {
      if (!action) {
        this.disposicionForm.get('corrective_action_comments')?.setValidators([]);
        this.disposicionForm.get('corrective_action_comments')?.updateValueAndValidity();
      } else {
        this.disposicionForm.get('corrective_action_comments')?.setValidators([Validators.required]);
        this.disposicionForm.get('corrective_action_comments')?.updateValueAndValidity();
      }
    });
  }

  inicializarFormEjecucion(disposicion: any, ejecucion?: any) {
    this.ejecucionForm = new FormGroup({
      ejecucion_uuid: new FormControl({ value: ejecucion ? ejecucion.uuid : null, disabled: false }, []),
      quality_record_uuid: new FormControl({ value: disposicion.quality_record.uuid, disabled: false }, []),
      disposition_uuid: new FormControl({ value: disposicion.uuid, disabled: false }, [Validators.required]),
      execution_datetime: new FormControl({ value: ejecucion ? this.showFecha(ejecucion.execution_datetime) : new Date(), disabled: false }, [Validators.required]),
      execution_action: new FormControl({ value: ejecucion ? ejecucion.execution_action : null, disabled: false }, [Validators.required]),
      // quantity: new FormControl({ value: ejecucion ? ejecucion.quantity : null, disabled: false }, [Validators.required]),
      // quantityNoConformidad: new FormControl({ value: disposicion.quality_record.quantity, disabled: false }, [Validators.required]),
      execution_comments: new FormControl({ value: ejecucion ? ejecucion.execution_comments : null, disabled: false }, [Validators.required]),
      user: new FormControl({ value: ejecucion ? ejecucion.responsible_user?.uuid : this.usuarioLogueado.uuid, disabled: false }, [Validators.required]),
    })
    // this.initQuantityValidation();
  }

  // private initQuantityValidation(): void {

  //   const quantityCtrl = this.ejecucionForm.get('quantity');
  //   const quantityNCCtrl = this.ejecucionForm.get('quantityNoConformidad');

  //   quantityCtrl?.valueChanges.subscribe(quantity => {

  //     const quantityNC = quantityNCCtrl?.value;

  //     if (quantity == null || quantityNC == null) {
  //       this.clearQuantityError(quantityCtrl);
  //       return;
  //     }

  //     if (quantity > quantityNC) {
  //       quantityCtrl.setErrors({
  //         ...quantityCtrl.errors,
  //         exceedsNoConformidad: true
  //       });
  //     } else {
  //       this.clearQuantityError(quantityCtrl);
  //     }
  //   });
  // }

  // private clearQuantityError(control: AbstractControl) {

  //   if (!control.errors) return;

  //   const { exceedsNoConformidad, ...rest } = control.errors;

  //   control.setErrors(Object.keys(rest).length ? rest : null);
  // }

  confirmarDisposicion() {
    if (this.isEdicion) {
      this.confirmarEdicionDisposicion();
    } else {
      this.isSubmit = true;
      this.confirmarNuevaDisposicion();
    }
  }

  confirmarNuevaDisposicion() {
    if (this.disposicionForm.valid) {
      let disposicion = new DisposicionDTO();
      disposicion.actual_role = this.rol;
      disposicion.quality_record_uuid = this.disposicionForm.get('quality_record_uuid')?.value;
      disposicion['user->responsible_user_uuid'] = this.disposicionForm.get('user')?.value;
      const fechaFormateada = this.disposicionForm.get('disposition_datetime')?.value instanceof Date
        ? format(this.disposicionForm.get('disposition_datetime')?.value, 'dd-MM-yyyy')
        : this.disposicionForm.get('disposition_datetime')?.value;
      disposicion.disposition_datetime = this.convertirFechaADateBackend(fechaFormateada);
      disposicion.corrective_action = this.disposicionForm.get('corrective_action')?.value ?? false;
      disposicion.corrective_action_comments = this.disposicionForm.get('corrective_action_comments')?.value;
      disposicion.defect_type = this.disposicionForm.get('defect_type')?.value;
      disposicion.disposition_action = this.disposicionForm.get('disposition_action')?.value;
      disposicion.disposition_instruction = this.disposicionForm.get('disposition_instruction')?.value;
      this.subscription.add(
        this._registroService.saveDisposicion(disposicion).subscribe({
          next: res => {
            this.spinner.hide();
            this._tokenService.setToken(res.token);
            this.obtenerDisposiciones(this.disposicionForm.get('quality_record_uuid')?.value);
            this.cerrarModalDisposicionOEjecucion();
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

  confirmarEdicionDisposicion() {
    if (this.disposicionForm.pristine) {
      this._swalService.toastInfo('top-right', 'No hubo modificaciones.')
      return;
    }
    this.isSubmit = true;
    if (this.disposicionForm.valid) {
      this.spinner.show();
      let disposicion = new DisposicionDTO();
      this.armarDTOEdicionDisposicion(disposicion);
      disposicion.actual_role = this.rol;
      this.subscription.add(
        this._registroService.editDisposicion(this.disposicionForm.get('disposicion_uuid')?.value, disposicion).subscribe({
          next: res => {
            this.spinner.hide();
            this._tokenService.setToken(res.token);
            this.obtenerDisposiciones(this.disposicionForm.get('quality_record_uuid')?.value);
            this.cerrarModalDisposicionOEjecucion();
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

  cerrarModalDisposicionOEjecucion() {
    this.modalDisposicion.close();
    this.modalEjecucion.close();
    this.isSubmit = false;
  }

  openSwalEliminarDisposicion(disposicion: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el disposicion?`,
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
        this.eliminarDisposicion(disposicion);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarDisposicion(disposicion: any) {
    this.spinner.show();
    this.subscription.add(
      this._registroService.eliminarDisposicion(disposicion.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerDisposiciones(disposicion.quality_record.uuid);
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

  confirmarEjecucion() {
    if (this.isEdicion) {
      this.confirmarEdicionEjecucion();
    } else {
      this.isSubmit = true;
      this.confirmarNuevaEjecucion();
    }
  }

  confirmarNuevaEjecucion() {
    if (this.ejecucionForm.valid) {
      this.spinner.show();
      let ejecucion = new EjecucionDTO();
      ejecucion.actual_role = this.rol;
      ejecucion.disposition_uuid = this.ejecucionForm.get('disposition_uuid')?.value;
      ejecucion['user->responsible_user_uuid'] = this.ejecucionForm.get('user')?.value;
      const fechaFormateada = this.ejecucionForm.get('execution_datetime')?.value instanceof Date
        ? format(this.ejecucionForm.get('execution_datetime')?.value, 'dd-MM-yyyy')
        : this.ejecucionForm.get('execution_datetime')?.value;
      ejecucion.execution_datetime = this.convertirFechaADateBackend(fechaFormateada);
      ejecucion.execution_action = this.ejecucionForm.get('execution_action')?.value ?? false;
      // ejecucion.quantity = this.ejecucionForm.get('quantity')?.value;
      ejecucion.execution_comments = this.ejecucionForm.get('execution_comments')?.value;
      this.subscription.add(
        this._registroService.saveEjecucion(ejecucion).subscribe({
          next: res => {
            this.spinner.hide();
            this._tokenService.setToken(res.token);
            this.obtenerDisposiciones(this.ejecucionForm.get('quality_record_uuid')?.value);
            this.cerrarModalDisposicionOEjecucion();
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

  confirmarEdicionEjecucion() {
    if (this.ejecucionForm.pristine) {
      this._swalService.toastInfo('top-right', 'No hubo modificaciones.')
      return;
    }
    this.isSubmit = true;
    if (this.ejecucionForm.valid) {
      this.spinner.show();
      let ejecucion = new EjecucionDTO();
      this.armarDTOEdicionEjecucion(ejecucion);
      ejecucion.actual_role = this.rol;
      this.subscription.add(
        this._registroService.editEjecucion(this.ejecucionForm.get('ejecucion_uuid')?.value, ejecucion).subscribe({
          next: res => {
            this.spinner.hide();
            this._tokenService.setToken(res.token);
            this.obtenerDisposiciones(this.ejecucionForm.get('quality_record_uuid')?.value);
            this.cerrarModalDisposicionOEjecucion();
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

  openSwalEliminarEjecucion(ejecucion: any, disposicion: any) {
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
        this.eliminarEjecucion(ejecucion, disposicion);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarEjecucion(ejecucion: any, disposicion: any) {
    this.spinner.show();
    this.subscription.add(
      this._registroService.eliminarEjecucion(ejecucion.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerDisposiciones(disposicion.quality_record.uuid);
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

  // getEstadoNoConformidad(noConformidad: any) {
  //   console.log(noConformidad);
  // }
}
