import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { catchError, debounceTime, distinctUntilChanged, finalize, forkJoin, map, Observable, of, startWith, Subject, Subscription, switchMap, take, tap } from 'rxjs';
import { ComponenteDTO } from 'src/app/core/models/request/componenteDTO';
import { ComponentesService } from 'src/app/core/services/componentes.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconCircleCheckComponent } from 'src/app/shared/icon/icon-circle-check';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


@Component({
  selector: 'app-componentes',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgxSpinnerModule, NgxTippyModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule,
    NgSelectModule, IconTrashLinesComponent, IconPencilComponent, IconSearchComponent, IconPlusComponent, IconCircleCheckComponent, FontAwesomeModule],
  templateUrl: './componentes.component.html',
  styleUrl: './componentes.component.css'
})
export class ComponentesComponent implements OnInit, OnDestroy {

  @Output() eventProducto = new EventEmitter<any>();

  @Input() producto: any;
  @Input() rol!: string;
  componentes: any[] = [];

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
    'product->parent_product_uuid': { value: '', op: '=', contiene: false },
    'product->childProduct.productType.name': { value: 'Procesos IP LADIE', op: '!=', contiene: false },
  };
  ordenamiento: any = {
    'order': 'asc'
  };

  componenteForm!: FormGroup;
  tituloModal: string = '';
  tituloModalProceso: string = '';
  isSubmit = false;
  isEdicion = false;

  // Referencia al modal.
  @ViewChild('modalComponente') modalComponente!: NgxCustomModalComponent;
  @ViewChild('modalProceso') modalProceso!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  // Catalogos
  proveedores: any[] = [];
  prods: any[] = [];

  productoInput$ = new Subject<string>();
  productos$!: Observable<any[]>;
  loadingProductos = false; procesos: any[] = [];

  componenteProceso: any[] = [];

  placeholderCantidad: string = '';
  // placeholderOrden: string = '';

  procesoActivo: any;

  // Iconos
  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

  showWarningOrden: boolean = false;
  showWarningComponent: string = '';

  constructor(private _indexService: IndexService, private _swalService: SwalService, private spinner: NgxSpinnerService,
    private _tokenService: TokenService, private _componenteService: ComponentesService) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['producto'] && changes['producto'].currentValue) {
      this.spinner.show();
      // Si el producto cambia, actualizamos los filtros y obtenemos los componentes
      this.filtros['product->parent_product_uuid'].value = this.producto.uuid;
      this.obtenerComponentes();
      this.obtenerProcesoActivo();
      this.obtenerPosiblesProcesos();
    }
  }

  obtenerComponentes() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["childProduct.productType", "childProduct.measure", "childProduct.country", "supplier.person.human", "supplier.person.legalEntity"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getComponentesWithParam(params, this.rol).subscribe({
        next: res => {
          this.componentes = res.data;
          this.modificarPaginacion(res);
          this._tokenService.setToken(res.token);
          this.obtenerCatalogos();
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

  obtenerPosiblesProcesos() {
    const paramsProcesos: any = {};
    paramsProcesos.with = [];
    paramsProcesos.paging = null;
    paramsProcesos.page = null;
    paramsProcesos.order_by = {};
    paramsProcesos.filters = {
      'productType.name': { value: 'Procesos IP LADIE', op: '=', contiene: false }
    };

    this.subscription.add(
      this._indexService.getProductosWithParam(paramsProcesos, this.rol).subscribe({
        next: res => {
          this.procesos = res.data;
          this.procesos = this.procesos.map(p => ({
            ...p,
            disabled: p.uuid === this.procesoActivo
          }));
        },
        error: error => {
          this._swalService.toastError('top-right', error.error.message);
          console.error(error);
          this.spinner.hide();
        }
      })
    )
  }

  obtenerProcesoActivo() {
    const paramsComponenteProceso: any = {};
    paramsComponenteProceso.with = ["childProduct.productType", "supplier.person.human", "supplier.person.legalEntity"];
    paramsComponenteProceso.paging = null;
    paramsComponenteProceso.page = null;
    paramsComponenteProceso.order_by = {};
    paramsComponenteProceso.filters = {
      'product->childProduct.productType.name': { value: 'Procesos IP LADIE', op: '=', contiene: false },
      'product->parent_product_uuid': { value: this.producto.uuid, op: '=', contiene: false }
    };

    this.subscription.add(
      this._indexService.getComponentesWithParam(paramsComponenteProceso, this.rol).subscribe({
        next: res => {
          this.componenteProceso = res.data;
          this.procesoActivo = this.componenteProceso.length > 0 ? this.componenteProceso[0].child_product?.uuid : null;
          this._tokenService.setToken(res.token);
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

  disableProducto = (item: any): boolean => {
    return (item.uuid === this.producto.uuid) || this.esComponente(item);
  };

  esComponente(item: any) {
    if (this.componentes.length > 0) {
      const idsComponentes = new Set(this.componentes.map(c => c.child_product.uuid));
      return idsComponentes.has(item.uuid)
    }
    return false;
  }


  obtenerCatalogos() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["productType", "measure"];
    params.paging = null;
    params.page = null;
    params.order_by = {};
    params.filters = {};

    forkJoin({
      proveedores: this._indexService.getProveedores(this.rol),
      // productos: this._indexService.getProductosPosiblesWithParam(params, this.rol, this.producto.uuid)
    }).subscribe({
      next: res => {
        this.proveedores = res.proveedores.data;
        this.proveedores = this.proveedores.map(proveedor => ({
          ...proveedor,
          nombreCompleto: this.bindName(proveedor)
        }));
      },
      error: error => {
        console.error('Error cargando catalogos:', error);
      }
    });
  }

  obtenerProductos() {
    const params: any = {};
    params.with = ["productType", "measure"];
    params.paging = 20;
    params.page = null;
    params.order_by = {};
    params.filters = {};

    this.productos$ = this.productoInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loadingProductos = true),
      switchMap((term: string) => {
        if (!term || term.trim().length < 2) {
          this.loadingProductos = false;
          return of([]);
        }

        params.filters = {
          'name': { value: term, op: 'LIKE', contiene: true },
        };

        return this._indexService.getProductosPosiblesWithParam(params, this.rol, this.producto.uuid).pipe(
          map((res: any) => res.data),
          map((productos: any[]) =>
            productos.map(p => ({
              ...p,
              disabled: this.disableProducto(p)
            }))
          ),
          finalize(() => this.loadingProductos = false)
        );
      })
    );
  }


  obtenerProductosParaEdicion(dato: any) {
    const productoActual = dato.child_product;

    // Sobrescribimos el observable productos$ para inyectar el producto actual
    const params: any = {
      with: ['productType', 'measure'],
      paging: 20,
      page: null,
      order_by: {}
    };

    this.productos$ = this.productoInput$.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loadingProductos = true), // <- activamos loading justo antes del switch

      switchMap((term: string) => {
        if (!term || term.trim().length < 2) {
          // Si no hay término de búsqueda, devolvemos solo el producto actual
          return of([productoActual]);
        }

        params.filters = {
          name: { value: term, op: 'LIKE', contiene: true }
        };

        return this._indexService.getProductosPosiblesWithParam(params, this.rol, this.producto.uuid).pipe(
          map((res: any) => res.data),
          map((productos: any[]) =>
            productos.map(p => ({
              ...p,
              disabled: this.disableProducto(p)
            }))
          ),
          map((productos: any[]) => {
            const existe = productos.some(p => p.uuid === productoActual.uuid);
            return existe ? productos : [productoActual, ...productos];
          }),
        );
      }),
      tap(() => this.loadingProductos = false), // <- apagamos loading luego del fetch
      catchError(err => {
        this.loadingProductos = false;
        return of([productoActual]); // fallback en caso de error
      })
    );
  }



  openModalComponente(type: string, dato?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nuevo componente';
      this.componenteForm = new FormGroup({
        child_product_uuid: new FormControl(null, Validators.required),
        quantity: new FormControl({ value: null, disabled: true }, Validators.required),
        supplier_uuid: new FormControl(null, []),
        orden: new FormControl(null, [])
      });
      this.obtenerProductos();
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición componente';
      this.placeholderCantidad = 'Cantidad en ' + dato.child_product.measure?.name;
      this.componenteForm = new FormGroup({
        uuid: new FormControl(dato.uuid),
        parent_product_uuid: new FormControl(this.producto.uuid, Validators.required),
        child_product_uuid: new FormControl(dato.child_product, []),
        quantity: new FormControl(this.mostrarCantidad(dato), Validators.required),
        supplier_uuid: new FormControl(dato.supplier?.uuid, []),
        orden: new FormControl(dato.order, [])
      });
      this.obtenerProductosParaEdicion(dato);
    }
    this.onFormChange();
    this.modalComponente.options = this.modalOptions;
    this.modalComponente.open();
  }

  onFormChange() {
    this.componenteForm.get('child_product_uuid')!.valueChanges.subscribe((producto) => {
      if (producto) {
        this.componenteForm.get('quantity')?.enable();
        this.componenteForm.get('quantity')?.setValue('');
        this.placeholderCantidad = 'Cantidad en ' + producto.measure?.name;
      } else {
        this.componenteForm.get('quantity')?.disable();
        this.placeholderCantidad = '';
      }
    });

    this.componenteForm.get('orden')!.valueChanges.subscribe((value) => {
      const esValorValido = value && value !== 0 && value <= this.componentes.length;

      this.showWarningOrden = esValorValido;

      if (esValorValido) {
        this.showWarningComponent = this.componentes[value - 1].child_product?.name;
      } else {
        this.showWarningComponent = '';
        if (this.isEdicion) {
          this.componenteForm.get('orden')?.setErrors({ invalid: true });
        }
      }
    });
  }


  cerrarModal() {
    this.isSubmit = false;
    this.placeholderCantidad = '';
    this.showWarningOrden = false;
    this.modalComponente.close();
  }

  confirmarComponente() {
    this.isSubmit = true;
    if (this.componenteForm.valid) {
      let componente = new ComponenteDTO();
      this.armarDTOComponente(componente);
      if (this.isValidOrden(componente.order)) {
        this.spinner.show();
        if (!this.isEdicion) {
          componente['product->parent_product_uuid'] = this.producto.uuid;
          this.subscription.add(
            this._componenteService.saveComponente(componente).subscribe({
              next: res => {
                this.spinner.hide();
                this.obtenerComponentes();
                this.cerrarModal();
              },
              error: error => {
                this.spinner.hide();
                this._swalService.toastError('top-right', error.error.message)
                console.error(error);
              }
            })
          )
        } else {
          this.subscription.add(
            this._componenteService.editComponente(this.componenteForm.get('uuid')?.value, componente).subscribe({
              next: res => {
                this.obtenerComponentes();
                this.isEdicion = false;
                this.cerrarModal();
                // this._swalService.toastSuccess('top-right', "Usuario actualizado.");
                this.spinner.hide();
              },
              error: error => {
                this.spinner.hide();
                this._swalService.toastError('top-right', error.error.message);
                console.error(error);
              }
            })
          )
        }
      } else {
        this._swalService.toastError('top-right', 'El orden es inválido');
      }
    }
  }
  armarDTOComponente(componente: ComponenteDTO) {
    componente.actual_role = this.rol;
    componente.with = ["childProduct", "childProduct.productType", "childProduct.measure", "supplier.person.human", "supplier.person.legalEntity"];
    componente['product->child_product_uuid'] = this.componenteForm.get('child_product_uuid')?.value.uuid;
    componente.quantity = this.componenteForm.get('quantity')?.value;
    componente.order = this.componenteForm.get('orden')?.value;
    componente.supplier_uuid = this.componenteForm.get('supplier_uuid')?.value;
    if (!this.isEdicion) {
      this.cleanObject(componente);
    }
  }
  // Se eliminan los nulos.
  private cleanObject(obj: any): void {
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object') {
        this.cleanObject(obj[key]); // Limpiar objetos anidados
      }
      if (obj[key] == null) {
        delete obj[key]; // Eliminar propiedades nulas o undefined
      }
    });
  }

  isValidOrden(order: number): boolean {
    if (order) {
      const max = this.isEdicion ? this.total_rows : this.total_rows + 1;
      const valor = +order;
      return valor >= 1 && valor <= max;
    }
    return true;
  }

  openSwalEliminar(componente: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el componente ${componente.child_product.name}?`,
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

  eliminarComponente(componente: any) {
    this.spinner.show();
    this.subscription.add(
      this._componenteService.deleteComponent(componente.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerComponentes();
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

  getNombreCompletoProveedor(data: any): string {
    if (!data.supplier?.person) return '';
    if (data.supplier.person.human) {
      return data.supplier.person.human.firstname + ' ' + data.supplier.person.human.lastname;
    } else if (data.supplier.person.legal_entity) {
      return data.supplier.person.legal_entity.company_name;
    }
    return '';
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

  mostrarCantidad(data: any) {
    if (data.child_product?.measure?.is_integer === 1) {
      return (+data.quantity)?.toFixed(0);
    } else {
      return (+data.quantity)?.toFixed(2);
    }
  }

  mostrarCostoUnitario(data: any) {
    // Si existe data.child_product.costs.defined_by y su valor es "Compra", devolver data.child_product.costs.purchase_cost_pesos
    // Si existe data.child_product.costs.defined_by y su valor es "Producción", devolver data.child_product.costs.production_cost_pesos
    // Si no existe data.child_product.costs.defined_by, y existe data.child_product.costs.purchase_cost_pesos, devolver data.child_product.costs.purchase_cost_pesos
    // Si no existe data.child_product.costs.defined_by, y existe data.child_product.costs.production_cost_pesos, devolver data.child_product.costs.production_cost_pesos
    // Si no existe data.child_product.costs.defined_by, y no existe data.child_product.costs.purchase_cost_pesos, y no existe data.child_product.costs.production_cost_pesos, devolver null
    if (data.child_product.costs.defined_by === "Compra") {
      return (data.child_product?.costs?.purchase_cost_pesos).toFixed(2);
    } else if (data.child_product.costs.defined_by === "Producción") {
      return (data.child_product?.costs?.production_cost_pesos).toFixed(2);
    } else if (data.child_product.costs.purchase_cost_pesos) {
      return (data.child_product.costs.purchase_cost_pesos).toFixed(2);
    } else if (data.child_product.costs.production_cost_pesos) {
      return (data.child_product.costs.production_cost_pesos).toFixed(2);
    } else {
      return null;
    }
  }

  mostrarCostoTotal(data: any) {
    const costoUnitario = this.mostrarCostoUnitario(data);
    return costoUnitario ? (costoUnitario * data.quantity).toFixed(2) : null;
  }

  openModalProceso(type: string, dato?: any) {
    if (type === 'NEW') {
      this.tituloModalProceso = 'Nuevo proceso';
    } else {
      this.tituloModalProceso = 'Edición proceso';
    }
    this.procesoActivo = this.componenteProceso.length > 0 ? this.componenteProceso[0].child_product?.uuid : null;
    this.modalProceso.options = this.modalOptions;
    this.modalProceso.open();
  }

  cerrarModalProceso() {
    this.modalProceso.close();
  }

  guardarProceso() {
    if (this.procesoActivo) {
      this.spinner.show();
      let componente = new ComponenteDTO();
      if (this.componenteProceso.length > 0) {
        componente.actual_role = this.rol;
        componente.with = [];
        componente['product->child_product_uuid'] = this.procesoActivo;
        this.cleanObject(componente);
        this.subscription.add(
          this._componenteService.editComponente(this.componenteProceso[0].uuid, componente).subscribe({
            next: res => {
              this.obtenerProcesoActivo();
              this.obtenerPosiblesProcesos();
              this.cerrarModalProceso();
              this.spinner.hide();
            },
            error: error => {
              this.spinner.hide();
              this._swalService.toastError('top-right', error.error.message)
              console.error(error);
            }
          })
        )
      } else {
        componente.actual_role = this.rol;
        componente.with = [];
        componente['product->child_product_uuid'] = this.procesoActivo;
        componente['product->parent_product_uuid'] = this.producto.uuid;
        componente.quantity = 1;
        this.cleanObject(componente);
        this.subscription.add(
          this._componenteService.saveComponente(componente).subscribe({
            next: res => {
              this.obtenerProcesoActivo();
              this.obtenerPosiblesProcesos();
              this.cerrarModalProceso();
              this.spinner.hide();
            },
            error: error => {
              this.spinner.hide();
              this._swalService.toastError('top-right', error.error.message)
              console.error(error);
            }
          })
        )
      }
    } else {
      this._swalService.toastError('top-right', 'Debe elegir un proceso');
    }
  }

  openSwalEliminarProcesoActivo() {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el proceso ${this.componenteProceso[0].child_product.name}?`,
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
        this.eliminarProcesoActivo();
      } else if (result.isDenied) {

      }
    })
  }
  eliminarProcesoActivo() {
    if (this.componenteProceso.length > 0) {
      this.spinner.show();
      this.subscription.add(
        this._componenteService.deleteComponent(this.componenteProceso[0].uuid, this.rol.toUpperCase()).subscribe({
          next: res => {
            this.obtenerProcesoActivo();
            this.obtenerPosiblesProcesos();
            this.procesoActivo = '';
            this._tokenService.setToken(res.token);
            this.spinner.hide();
          },
          error: error => {
            this.spinner.hide();
            console.error(error);
            this._swalService.toastError('top-right', error.error.message);
          }
        })
      )
    }
  }

  getComments(data: any) {
    if (!data.child_product?.comments) return '';
    return data.child_product?.comments.length > 32 ? data.child_product?.comments.slice(0, 32 - 2) + '…' : data.child_product?.comments;
  }

  getTippyComments(data: any) {
    if (!data.child_product?.comments) return null;
    return data.child_product?.comments;
  }

  getTippyInUSD(data: any) {
    if (data.child_product?.costs?.purchase_cost_dollars) {
      return 'USD ' + (+data.child_product?.costs?.purchase_cost_dollars).toFixed(2);
    }
    return null;
  }

  getTippyTotalInUSD(data: any) {
    if (data.child_product?.costs?.purchase_cost_dollars) {
      return 'USD ' + (+data.child_product?.costs?.purchase_cost_dollars * data.quantity).toFixed(2);
    }
    return null;
  }

  isProductoCompuesto() {
    return this.producto?.product_type?.product_compound === 1;
  }

  goToProduct(event: MouseEvent, data: any) {
    this.eventProducto.emit({ data, event });
  }


  getGlobalIndex(index: number): number {
    return (this.currentPage - 1) * this.itemsPerPage + index;
  }

  esPrimerElementoGlobal(index: number): boolean {
    return this.getGlobalIndex(index) === 0;
  }

  esUltimoElementoGlobal(index: number): boolean {
    return this.getGlobalIndex(index) === this.total_rows - 1;
  }

  moverArriba(data: any): void {
    let componente = new ComponenteDTO();
    componente.actual_role = this.rol;
    componente.with = ["childProduct", "childProduct.productType", "childProduct.measure", "supplier.person.human", "supplier.person.legalEntity"];
    componente.order = data.order - 1;
    this.subscription.add(
      this._componenteService.editComponente(data.uuid, componente).subscribe({
        next: res => {
          this.obtenerComponentes();
          this._swalService.toastSuccess('top-right', "Componente actualizado.");
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          this._swalService.toastError('top-right', error.error.message);
          console.error(error);
        }
      })
    )
  }

  moverAbajo(data: any): void {
    let componente = new ComponenteDTO();
    componente.actual_role = this.rol;
    componente.with = ["childProduct", "childProduct.productType", "childProduct.measure", "supplier.person.human", "supplier.person.legalEntity"];
    componente.order = data.order + 1;
    this.subscription.add(
      this._componenteService.editComponente(data.uuid, componente).subscribe({
        next: res => {
          this.obtenerComponentes();
          this._swalService.toastSuccess('top-right', "Componente actualizado.");
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          this._swalService.toastError('top-right', error.error.message);
          console.error(error);
        }
      })
    )
  }


}
