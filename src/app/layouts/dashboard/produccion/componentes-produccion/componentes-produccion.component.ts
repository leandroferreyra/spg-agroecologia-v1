import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { concat, debounceTime, distinctUntilChanged, finalize, map, Observable, of, Subject, Subscription, switchMap, tap } from 'rxjs';
import { FrozenComponentDTO } from 'src/app/core/models/request/frozenComponentDTO';
import { FrozenComponentService } from 'src/app/core/services/frozenComponents.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconRefreshComponent } from 'src/app/shared/icon/icon-refresh';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-componentes-produccion',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, IconPlusComponent, NgSelectModule, FormsModule, ReactiveFormsModule, NgbPaginationModule,
    IconTrashLinesComponent, IconRefreshComponent, IconPencilComponent, NgxTippyModule, NgxCustomModalComponent],
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
  // searchProveedor$ = new Subject<string>();
  // initialProveedor$ = new Subject<string>();
  proveedores$: Observable<any[]> = of([]);
  loadingProveedores = false;


  constructor(private spinner: NgxSpinnerService, private _indexService: IndexService, private _tokenService: TokenService,
    private _swalService: SwalService, private _frozenComponentService: FrozenComponentService, private router: Router,
    private location: Location) {

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
    params.with = ["productType", "measure", "stock.batch", "supplier", "supplier.person.human", "supplier.person.legalEntity",
      "possibleStocks.batch", "product.replacements"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getFrozenComponentsWithParam(params, this.rol).subscribe({
        next: res => {
          this.componentes = res.data;
          // console.log("🚀 ~ ComponentesProduccionComponent ~ obtenerComponentesProduccion ~ this.componentes:", this.componentes)
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
    if (this.componentes.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  getCantidadStockByComponent(stock: any) {
    if (this.selectedComponent.measure?.is_integer === 1) {
      return +(+stock.total_amount)?.toFixed(0);
    } else {
      return +(+stock.total_amount)?.toFixed(2);
    }
  }

  getProduccionMaxima(stock: any) {
    return Math.floor(+stock.total_amount / +this.produccion.quantity);
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
    }
    if (data.product_type?.stock_controlled === 1 && data.traceable === 1) {
      // N lotes
    }
    if (data.origin === 'Lote') {
      return data.stock?.batch?.batch_identification;
    }
    return data.origin;
  }

  isAllowEdit(data: any) {
    if (data.product_type?.stock_controlled === 0) {
      return false;
    }
    return true;
  }

  openSwalEliminar(componente: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el componente de producción ${componente.name}?`,
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
        this.eliminarComponente(componente);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarComponente(producto: any) {
    this.spinner.show();
    this.subscription.add(
      this._frozenComponentService.deleteComponent(producto.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerComponentesProduccion();
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

  openModalComponente(data: any) {
    this.selectedComponent = data;
    this.inicializarFormComponente(data);

    // Si ya tiene proveedor seleccionado, precargarlo en la lista
    // if (data.supplier) {
    //   this.proveedores$ = of([{
    //     ...data.supplier,
    //     nombreCompleto: this.bindName(data.supplier)
    //   }]);
    // }
    this.obtenerProveedoresByComponente(data);
    this.stocks = (data.possible_stocks || []).map((stock: any) => ({
      ...stock,
      disabled: +stock.total_amount < +this.getCantidadTotal(data)
    }));
    this.tituloModal = `Selección de origen de "${data.name}"`;
    this.modalComponente.options = this.modalOptions;
    this.modalComponente.open();
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalComponente.close();
  }


  // armarStock(componente: any, stock: any) {
  //   let amount;
  //   if (componente.measure?.is_integer === 1) {
  //     amount = (+stock.total_amount).toFixed(0);
  //   } else {
  //     amount = (+stock.total_amount).toFixed(2);
  //   }
  //   return `${stock.batch != null ? stock.batch.batch_identification : "Lote único"} | ${amount}`;
  // }

  inicializarFormComponente(data: any) {
    this.componenteForm = new FormGroup({
      uuid: new FormControl({ value: data ? data.uuid : null, disabled: false }, []),
      origin: new FormControl({ value: data ? data.origin : null, disabled: false }, []),
      stock_uuid: new FormControl({ value: data ? data.stock?.uuid : null, disabled: false }, []),
      supplier_uuid: new FormControl({ value: data ? data.supplier : null, disabled: false }, []),
      note: new FormControl({ value: data ? data.note : null, disabled: false }, []),
    })
  }

  obtenerProveedoresByComponente(data?: any) {
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

    // Si ya tiene proveedor seleccionado, lo ponemos como valor inicial del control
    if (data?.supplier) {
      const supplierConNombre = {
        ...data.supplier,
        nombreCompleto: this.bindName(data.supplier)
      };

      this.componenteForm.get('supplier_uuid')?.setValue(supplierConNombre);

      // También lo cargamos como primer valor en la lista
      this.proveedores$ = of([supplierConNombre]);
    }

    // Ahora configuramos la búsqueda
    const busqueda$ = this.proveedorInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loadingProveedores = true),
      switchMap((term: string) => {
        if (!term || term.trim().length < 2) {
          this.loadingProveedores = false;
          // Si no hay búsqueda, devolvemos el proveedor inicial (si existe) o lista vacía
          return data?.supplier
            ? of([{
              ...data.supplier,
              nombreCompleto: this.bindName(data.supplier)
            }])
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

    this.proveedores$ = busqueda$;
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

  confirmarComponente() {
    this.isSubmit = true;
    if (this.componenteForm.valid) {
      this.spinner.show();
      let componente = new FrozenComponentDTO();
      this.armarDTOComponente(componente);
      this.subscription.add(
        this._frozenComponentService.editComponente(this.componenteForm.get('uuid')?.value, componente).subscribe({
          next: res => {
            // console.log(res);
            this.obtenerComponentesProduccion();
            this.cerrarModal();
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

  armarDTOComponente(componente: FrozenComponentDTO) {
    componente.actual_role = this.rol;
    componente.origin = this.componenteForm.get('origin')?.value;
    componente.stock_uuid = this.componenteForm.get('stock_uuid')?.value;
    componente.supplier_uuid = this.componenteForm.get('supplier_uuid')?.value?.uuid;
    componente.note = this.componenteForm.get('note')?.value;
  }

  switchOrigen(origen: any, event: Event, stock?: any) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.componenteForm.get('origin')?.setValue(origen);
      if (origen === 'Provisto por terceros') {
        this.componenteForm.get('supplier_uuid')?.setValidators(Validators.required);
        this.componenteForm.get('stock_uuid')?.clearValidators();
        this.componenteForm.get('stock_uuid')?.setValue(null);
      } else if (origen === 'Lote') {
        this.componenteForm.get('stock_uuid')?.setValidators(Validators.required);
        this.componenteForm.get('supplier_uuid')?.clearValidators();
        this.componenteForm.get('stock_uuid')?.setValue(stock.uuid);
      } else if (origen === 'Sin selección') {
        this.componenteForm.get('supplier_uuid')?.clearValidators();
        this.componenteForm.get('stock_uuid')?.clearValidators();
        this.componenteForm.get('stock_uuid')?.setValue(null);
      }
    } else {
      this.componenteForm.get('origin')?.setValue(null);
      this.componenteForm.get('supplier_uuid')?.clearValidators();
      this.componenteForm.get('stock_uuid')?.clearValidators();
      this.componenteForm.get('stock_uuid')?.setValue(null);

    }
    ['supplier_uuid', 'stock_uuid'].forEach((field) => {
      this.componenteForm.get(field)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  openModalReemplazos(data: any) {
    this.reemplazos = data.product?.replacements;
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

    }
    // console.log(this.reemplazoForm);
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

}
