import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { debounceTime, distinctUntilChanged, finalize, map, Observable, of, Subject, Subscription, switchMap, tap } from 'rxjs';
import { FrozenComponentDTO } from 'src/app/core/models/request/frozenComponentDTO';
import { FrozenComponentService } from 'src/app/core/services/frozenComponents.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconRefreshComponent } from 'src/app/shared/icon/icon-refresh';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import { Router } from '@angular/router';
import { RolDTO } from 'src/app/core/models/request/rolDTO';
import { IconCaretDownComponent } from 'src/app/shared/icon/icon-caret-down';
import { IconExpandAllComponent2 } from 'src/app/shared/icon/icon-expand-all2';
import { IconExpandItemComponent } from 'src/app/shared/icon/icon-expand-item';
import { IconCollapseItemComponent } from 'src/app/shared/icon/icon-collapse-item';

@Component({
  selector: 'app-componentes-produccion',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, IconPlusComponent, NgSelectModule, FormsModule, ReactiveFormsModule, NgbPaginationModule,
    IconTrashLinesComponent, IconRefreshComponent, IconPencilComponent, NgxTippyModule, NgxCustomModalComponent, NgxTippyModule, IconCaretDownComponent,
    IconExpandAllComponent2, IconExpandItemComponent, IconCollapseItemComponent],
  templateUrl: './componentes-produccion.component.html',
  styleUrl: './componentes-produccion.component.css'
})
export class ComponentesProduccionComponent implements OnInit, OnDestroy {

  @Input() produccion: any;
  @Input() rol!: string;
  private subscription: Subscription = new Subscription();

  @ViewChild('modalComponente') modalComponente!: NgxCustomModalComponent;
  @ViewChild('modalReemplazo') modalReemplazo!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };
  tituloModal: string = '';

  componentes: any[] = [];
  selectedComponent: any;
  componenteForm!: FormGroup;

  reemplazos: any[] = []
  reemplazoForm!: FormGroup;

  ocultarSinStock = false;

  filtros: any = {
    'production_uuid': { value: '', op: '=', contiene: false },
  };
  ordenamiento: any = {
    'order': 'asc'
  };

  // Orden, filtro y paginación para compras de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  isSubmit = false;

  origenes: any[] = [
    { key: 'lote', label: 'Lote', tieneSelect: true },
    { key: 'terceros', label: 'Provisto por terceros', tieneSelect: true },
    { key: 'ss', label: 'Sin selección', tieneSelect: false }
  ];
  stocks: any[] = [];

  proveedorInput$ = new Subject<string>();
  proveedores$: Observable<any[]> = of([]);
  loadingProveedores = false;

  serialesPorLote: Record<string, any[]> = {};

  expandedRows: { [uuid: string]: boolean } = {};
  componenteForms: { [uuid: string]: FormGroup } = {};
  stocksByComponente: { [uuid: string]: any[] } = {};
  proveedoresByComponente: { [uuid: string]: Observable<any[]> } = {};
  proveedorInputByComponente: { [uuid: string]: Subject<string> } = {};
  isEditing: { [uuid: string]: boolean } = {};

  expandirTodo = false;

  constructor(private spinner: NgxSpinnerService, private _indexService: IndexService, private _tokenService: TokenService,
    private _swalService: SwalService, private _frozenComponentService: FrozenComponentService, private router: Router) {

  }

  ngOnInit(): void {
  }
  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['produccion'] && changes['produccion'].currentValue) {
      this.spinner.show();
      // Si la produccion cambia, actualizamos los filtros y obtenemos los componentes
      this.filtros['production_uuid'].value = this.produccion.uuid;
      this.obtenerComponentesProduccion();
    }
  }

  obtenerComponentesProduccion() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    if (this.produccion.current_state?.state?.name === 'Borrador') {
      params.with = ["productType", "measure", "stock.batch", "supplier", "supplier.person.human", "supplier.person.legalEntity", "productInstances",
        "possibleStocks.batch", "possibleStocks.location.location.location.location", "product.replacements.replacement", "possibleStocks.productInstances"];
    } else {
      params.with = ["productType", "measure", "stock.batch", "supplier", "supplier.person.human", "supplier.person.legalEntity", "productInstances",
        "possibleStocks.batch", "possibleStocks.location.location.location.location", "product", "possibleStocks.productInstances"];
    }
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getFrozenComponentsWithParam(params, this.rol).subscribe({
        next: res => {
          this.componentes = res.data;
          console.log("🚀 ~ ComponentesProduccionComponent ~ obtenerComponentesProduccion ~ this.componentes:", this.componentes)
          this.modificarPaginacion(res);
          if (this.expandirTodo) {
            this.expandirTodos();
          }
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
    if (this.componentes.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }


  getCantidadStockByComponent(data: any, stock: any) {
    if (data.measure?.is_integer === 1) {
      return +(+stock.available_amount)?.toFixed(0);
    } else {
      return +(+stock.available_amount)?.toFixed(2);
    }
  }

  getProduccionMaxima(data: any, stock: any) {
    return Math.floor(+stock.available_amount / this.getCantidadTotal(data));
  }

  showName(stock: any) {
    return stock.batch ? stock.batch.batch_identification : 'Lote único';
  }

  getCantidad(data: any) {
    if (data.measure?.is_integer === 1) {
      return (+data.quantity)?.toFixed(0);
    } else {
      return (+data.quantity)?.toFixed(2);
    }
  }

  getCantidadTotal(data: any) {
    let total = +this.produccion.quantity * +data.quantity;
    if (data.measure?.is_integer === 1) {
      return +(total)?.toFixed(0);
    } else {
      return +(total)?.toFixed(2);
    }
  }

  getOrigen(data: any) {
    if (data.product_type?.stock_controlled === 0) {
      return 'Sin control de stock';
    }
    if (data.product_type?.stock_controlled === 1 && data.traceable === 0) {
      // Lote único
      if (this.isFaltante(data)) {
        return 'Faltante';
      }
    }
    if (data.product_type?.stock_controlled === 1 && data.traceable === 1) {
      if (this.isFaltante(data)) {
        return 'Faltante';
      }
    }
    if (data.origin === 'Lote') {
      return data.stock?.batch ? data.stock?.batch.batch_identification : 'Lote único';
    } else if (data.origin === 'Provisto por terceros') {
      return data.origin;
    } else {
      return data.origin;
    }

  }

  isProvistoPorTerceros(data: any) {
    return data.origin === 'Provisto por terceros';
  }

  getLocation(data: any): string[] {
    if (!data.location) return [];
    const names: string[] = [];

    if (data.location.location) {
      names.push(...this.getLocation(data.location));
    }
    names.push(data.location.name);
    return names;
  }

  isEstadoTerminadoLiberado() {
    return this.produccion.current_state?.state?.name === 'Terminado' || this.produccion.current_state?.state?.name === 'Liberado';
  }

  isAllowEdit(data: any) {
    if (data.product_type?.stock_controlled === 0) {
      return false;
    }
    return true;
  }

  isFaltante(data: any): boolean {
    const cantidadNecesaria = this.getCantidadTotal(data);
    const sinOrigenYSinStock = data.origin === 'Sin selección' && (!data.possible_stocks || data.possible_stocks.length === 0);

    const todosLosLotesInsuficientes = Array.isArray(data.possible_stocks) &&
      data.possible_stocks.length > 0 &&
      data.possible_stocks.every((lote: any) => (+lote.available_amount || 0) < cantidadNecesaria);

    return sinOrigenYSinStock || todosLosLotesInsuficientes;
  }

  toggleComponente(data: any) {
    const uuid = data.uuid;
    this.expandedRows[uuid] = !this.expandedRows[uuid];
    if (this.expandedRows[uuid]) {
      this.inicializarFormularioComponente(data);
    }
  }

  inicializarFormularioComponente(data: any) {
    this.isEditing[data.uuid] = false;
    this.inicializarFormComponente(data);
    this.obtenerProveedoresByComponente(data);
    this.stocksByComponente[data.uuid] = (data.possible_stocks || []).map((stock: any) => ({
      ...stock,
      disabled: +stock.available_amount < +this.getCantidadTotal(data)
    }));
  }

  habilitarEdicion(data: any) {
    this.isEditing[data.uuid] = true;
    this.componenteForms[data.uuid].get('supplier_uuid')?.enable();
    this.componenteForms[data.uuid].get('note')?.enable();
  }

  cancelarEdicion(data: any) {
    this.isEditing[data.uuid] = false;
    this.componenteForms[data.uuid].get('supplier_uuid')?.disable();
    this.componenteForms[data.uuid].get('note')?.disable();
  }

  getFormControl(uuid: string, controlName: string): FormControl {
    return this.componenteForms[uuid].get(controlName) as FormControl;
  }

  expandirTodos() {
    this.componentes.forEach(componente => {
      // Solo expande los que tienen control de stock.
      if (componente.product_type?.stock_controlled === 1) {
        this.expandedRows[componente.uuid] = true;
        if (this.expandedRows[componente.uuid]) {
          this.inicializarFormComponente(componente);
          this.obtenerProveedoresByComponente(componente);
          this.stocksByComponente[componente.uuid] = (componente.possible_stocks || []).map((stock: any) => ({
            ...stock,
            disabled: +stock.available_amount < +this.getCantidadTotal(componente)
          }));
        }
      }
    });
  }

  cerrarTodos() {
    this.expandirTodo = false;
    this.expandedRows = {};
  }

  // cerrarModal(data: any) {
  // this.isSubmit = false;
  // this.modalComponente.close();
  // }

  inicializarFormComponente(data: any) {
    this.componenteForm = new FormGroup({
      uuid: new FormControl({ value: data ? data.uuid : null, disabled: !this.isEditing[data.uuid] }, []),
      origin: new FormControl({ value: data ? data.origin : null, disabled: !this.isEditing[data.uuid] }, []),
      stock_uuid: new FormControl({ value: data ? data.stock?.uuid : null, disabled: !this.isEditing[data.uuid] }, []),
      supplier_uuid: new FormControl({ value: data ? data.supplier : null, disabled: !this.isEditing[data.uuid] }, []),
      note: new FormControl({ value: data ? data.note : null, disabled: !this.isEditing[data.uuid] }, []),
      product_instances: new FormControl({ value: data ? data.product_instances : null, disabled: data.assign_serial_number === 0 }, []),
    });
    if (data && data.origin === 'Lote' && data.assign_serial_number === 1) {
      this.componenteForm.get('product_instances')?.setValidators(Validators.required);
      this.componenteForm.get('product_instances')?.updateValueAndValidity({ emitEvent: false });
    }
    this.componenteForms[data.uuid] = this.componenteForm;
  }


  compareByUuid = (a: any, b: any): boolean => a?.uuid === b?.uuid;

  showNota(nota: string) {
    if (!nota) return '';
    if (nota.length <= 21) {
      return nota;
    }
    return nota.slice(0, 18) + '...';
  }

  getTooltipNota(nota: string) {
    const v = (nota ?? '').toString();
    return v.replace(/(\S{20})/g, '$1\u200B'); // zero-width space cada 20 chars
  }

  getSupplierTooltip(supplier: any) {
    return supplier ? this.bindName(supplier) : '';
  }

  obtenerProveedoresByComponente(data: any): void {
    const uuid = data.uuid;

    // Si no existe aún el Subject, lo creamos
    if (!this.proveedorInputByComponente[uuid]) {
      this.proveedorInputByComponente[uuid] = new Subject<string>();
    }

    const proveedorInput$ = this.proveedorInputByComponente[uuid];
    const componenteForm = this.componenteForms[uuid];

    const params: any = {
      with: [
        "person.city",
        "person.city.district",
        "person.city.district.country",
        "person.human",
        "person.human.gender",
        "person.human.documentType",
        "person.human.user",
        "person.legalEntity"
      ],
      paging: 10,
      page: 1,
      order_by: {},
      filters: {}
    };

    // Si ya tiene proveedor cargado
    if (data?.supplier) {
      const supplierConNombre = {
        ...data.supplier,
        nombreCompleto: this.bindName(data.supplier)
      };

      componenteForm.get('supplier_uuid')?.setValue(supplierConNombre);
    }

    const busqueda$ = proveedorInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loadingProveedores = true),
      switchMap((term: string) => {
        if (!term || term.trim().length < 2) {
          this.loadingProveedores = false;

          return data?.supplier
            ? of([{ ...data.supplier, nombreCompleto: this.bindName(data.supplier) }])
            : of([]);
        }

        params.filters = {
          operator: { value: 'OR' },
          'person.human.firstname': { value: term, op: 'LIKE', contiene: true },
          'person.human.lastname': { value: term, op: 'LIKE', contiene: true },
          'person.legalEntity.company_name': { value: term, op: 'LIKE', contiene: true }
        };

        return this._indexService.getProveedoresWithParamAsync(params, this.rol).pipe(
          map((res: any) =>
            res.data.map((proveedor: any) => ({
              ...proveedor,
              nombreCompleto: this.bindName(proveedor)
            }))
          ),
          finalize(() => this.loadingProveedores = false)
        );
      })
    );

    this.proveedoresByComponente[uuid] = busqueda$;
  }


  bindName(data: any): string {
    if (!data.person) return '';
    if (data.person.human) {
      return data.person.human.firstname + ' ' + data.person.human.lastname;
    } else if (data.person.legal_entity) {
      return data.person.legal_entity.company_name;
    }
    return '';
  }

  confirmarComponente(data: any) {
    this.isSubmit = true;
    if (this.componenteForms[data.uuid].valid) {
      this.spinner.show();
      let componente = new FrozenComponentDTO();
      this.armarDTOComponente(data, componente);
      this.subscription.add(
        this._frozenComponentService.editComponente(this.componenteForms[data.uuid].get('uuid')?.value, componente).subscribe({
          next: res => {
            this.isSubmit = false;
            this.isEditing[data.uuid] = false;
            this.componenteForms[data.uuid].get('note')?.disable();
            this.componenteForms[data.uuid].get('supplier_uuid')?.disable();
            this.obtenerComponentesProduccion();
            // this.toggleComponente(data);
            this.limpiarSerialesDeOtroLote(data);
            this.spinner.hide();
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

  armarDTOComponente(data: any, componente: FrozenComponentDTO) {
    componente.actual_role = this.rol;
    componente.origin = this.componenteForms[data.uuid].get('origin')?.value;
    componente.stock_uuid = this.componenteForms[data.uuid].get('stock_uuid')?.value;
    componente.supplier_uuid = this.componenteForms[data.uuid].get('supplier_uuid')?.value?.uuid;
    componente.note = this.componenteForms[data.uuid].get('note')?.value;
    const productInstances = this.componenteForms[data.uuid].get('product_instances')?.value ?? [];
    const uuids = productInstances.map((pi: any) => pi.uuid);
    componente.product_instances = uuids;
    if (componente.origin !== 'Lote' || data.assign_serial_number === 0) {
      delete componente.product_instances;
    }
  }

  limpiarSerialesDeOtroLote(data: any) {
    const formValue = this.componenteForms[data.uuid].get('stock_uuid')?.value;
    if (!formValue) return;
    // Limpiar todos los product_instances de otros lotes
    Object.keys(this.serialesPorLote).forEach(uuid => {
      if (uuid !== formValue) {
        delete this.serialesPorLote[uuid];
      }
    });
  }

  switchOrigen(data: any, origen: any, event: Event, stock?: any) {
    const checked = (event.target as HTMLInputElement).checked;

    const stockUuidAnterior = this.componenteForms[data.uuid].get('stock_uuid')?.value;
    const serialesAnteriores = this.componenteForms[data.uuid].get('product_instances')?.value;
    if (checked) {
      this.componenteForms[data.uuid].get('origin')?.setValue(origen);
      if (origen === 'Provisto por terceros') {
        this.componenteForms[data.uuid].get('supplier_uuid')?.setValidators(Validators.required);
        this.componenteForms[data.uuid].get('stock_uuid')?.clearValidators();
        this.componenteForms[data.uuid].get('stock_uuid')?.setValue(null);
        this.componenteForms[data.uuid].get('product_instances')?.clearValidators();
      } else if (origen === 'Lote') {
        this.componenteForms[data.uuid].get('stock_uuid')?.setValidators(Validators.required);
        this.componenteForms[data.uuid].get('supplier_uuid')?.clearValidators();
        this.componenteForms[data.uuid].get('stock_uuid')?.setValue(stock.uuid);
        if (data.assign_serial_number === 1) {
          const control = this.componenteForms[data.uuid].get('product_instances');
          control?.setValidators(Validators.required);
          if (stockUuidAnterior && serialesAnteriores?.length) {
            this.serialesPorLote[stockUuidAnterior] = serialesAnteriores;
          }
          const prev = this.serialesPorLote[stock.uuid] ?? [];
          const disponibles = stock.product_instances?.map((p: any) => p.uuid) ?? [];
          const restaurados = prev.filter((p: any) => disponibles.includes(p.uuid));
          control?.setValue(restaurados);
        }
      } else if (origen === 'Sin selección') {
        this.componenteForms[data.uuid].get('supplier_uuid')?.clearValidators();
        this.componenteForms[data.uuid].get('stock_uuid')?.clearValidators();
        this.componenteForms[data.uuid].get('stock_uuid')?.setValue(null);
        this.componenteForms[data.uuid].get('product_instances')?.clearValidators();
      }
    } else {
      this.componenteForms[data.uuid].get('origin')?.setValue(null);
      this.componenteForms[data.uuid].get('supplier_uuid')?.clearValidators();
      this.componenteForms[data.uuid].get('stock_uuid')?.clearValidators();
      this.componenteForms[data.uuid].get('product_instances')?.clearValidators();
      this.componenteForms[data.uuid].get('stock_uuid')?.setValue(null);
    }
    ['supplier_uuid', 'stock_uuid', 'product_instances'].forEach((field) => {
      this.componenteForms[data.uuid].get(field)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  hasReplacement(data: any) {
    let reemplazos = (data.product?.replacements || []).filter(
      (replacement: any) => replacement?.replacement?.current_state?.state?.name === 'Vigente'
    );
    return (reemplazos.length > 0 && this.produccion.current_state?.state?.name === 'Borrador');
  }

  openModalReemplazos(data: any) {
    this.selectedComponent = data;
    this.reemplazos = (data.product?.replacements || []).filter(
      (replacement: any) => replacement?.replacement?.current_state?.state?.name === 'Vigente'
    );
    this.inicializarFormReemplazo();
    this.tituloModal = 'Seleccionar reemplazo';
    this.modalReemplazo.options = this.modalOptions;
    this.modalReemplazo.open();
  }
  cerrarModalReemplazo() {
    this.isSubmit = false;
    this.modalReemplazo.close();
  }

  inicializarFormReemplazo() {
    this.reemplazoForm = new FormGroup({
      uuid: new FormControl({ value: null, disabled: false }, [Validators.required])
    })
  }

  confirmarReemplazo() {
    this.isSubmit = true;
    if (this.reemplazoForm.valid) {
      this.spinner.show();
      let rolDTO = new RolDTO();
      rolDTO.actual_role = this.rol;
      this.subscription.add(
        this._frozenComponentService.replaceComponente(this.selectedComponent.uuid, this.reemplazoForm.get('uuid')?.value, rolDTO).subscribe({
          next: res => {
            this.obtenerComponentesProduccion();
            this._tokenService.setToken(res.token);
            this.spinner.hide();
            this.cerrarModalReemplazo();
          },
          error: error => {
            this.spinner.hide();
            this._swalService.toastError('top-right', error.error.message);
            console.error(error);
          },
        })
      )
    }
  }

  irAlProducto(event: MouseEvent, data: any) {
    const baseUrl = window.location.origin + window.location.pathname;
    const urlTree = this.router.createUrlTree([`/dashboard/productos/${data.product?.uuid}`]);
    const url = this.router.serializeUrl(urlTree);
    if (event.ctrlKey || event.metaKey) {
      window.open(`${baseUrl}#${url}`, '_blank');
    } else {
      this.router.navigate([`/dashboard/productos/${data.product?.uuid}`]);
    }
  }

  toggleTodos() {
    this.ocultarSinStock = !this.ocultarSinStock;
  }
}
