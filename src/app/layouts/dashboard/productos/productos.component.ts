import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators, RequiredValidator, FormArray, FormBuilder, AbstractControl } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faArrowDown, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { MenuModule } from 'headlessui-angular';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription, forkJoin } from 'rxjs';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { toggleAnimation } from 'src/app/shared/animations';
import { IconEditComponent } from 'src/app/shared/icon/icon-edit';
import { IconHorizontalDotsComponent } from 'src/app/shared/icon/icon-horizontal-dots';
import { IconMenuComponent } from 'src/app/shared/icon/icon-menu';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconSettingsComponent } from 'src/app/shared/icon/icon-settings';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import { IconUserComponent } from 'src/app/shared/icon/icon-user';
import Swal from 'sweetalert2';
import { ComprasProveedorComponent } from '../personas/proveedores/compras-proveedor/compras-proveedor.component';
import { CuentasBancariasComponent } from '../personas/proveedores/cuentas-bancarias/cuentas-bancarias.component';
import { ContactosPersonaComponent } from '../personas/shared/contactos-persona/contactos-persona.component';
import { ContactosComponent } from '../personas/shared/contactos/contactos.component';
import { ProductoDTO, ProductState } from 'src/app/core/models/request/productoDTO';
import { ProductoService } from 'src/app/core/services/producto.service';
import { ComponentesComponent } from './componentes/componentes.component';
import { ComponenteDeComponent } from './componente-de/componente-de.component';
import { ReemplazosComponent } from './reemplazos/reemplazos.component';
import { ProveedoresProductoComponent } from './proveedores-producto/proveedores-producto.component';
import { StocksComponent } from './stocks/stocks.component';
import { ComprasProductoComponent } from './compras-producto/compras-producto.component';
import { VinculosComponent } from './vinculos/vinculos.component';
import { Location } from '@angular/common';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { ProduccionService } from 'src/app/core/services/produccion.service';
import { ProduccionDTO } from 'src/app/core/models/request/produccionDTO';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { format } from 'date-fns';
import { FlatpickrDirective } from 'angularx-flatpickr';
import { consumerPollProducersForChange } from '@angular/core/primitives/signals';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent, IconPencilComponent, IconTrashLinesComponent, NgxCustomModalComponent, NgxSpinnerModule,
    NgSelectModule, IconHorizontalDotsComponent, MenuModule, FontAwesomeModule, CuentasBancariasComponent, ComprasProveedorComponent,
    ContactosComponent, ContactosPersonaComponent, IconSettingsComponent, NgbPaginationModule, ComponentesComponent, ComponenteDeComponent,
    ReemplazosComponent, ProveedoresProductoComponent, StocksComponent, ComprasProductoComponent, VinculosComponent, IconSettingsComponent,
    FlatpickrDirective, IconSearchComponent
  ],
  animations: [toggleAnimation],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit, OnDestroy {
  toggleDropdown = false;
  @ViewChild('offcanvasRight', { static: false }) offcanvasElement!: ElementRef;

  store: any;
  private subscription: Subscription = new Subscription();
  actual_role: string = '';
  productos: any[] = [];
  selectedProducto: any;
  productoAnterior: any[] = [];
  productoForm!: FormGroup;
  newProductoForm!: FormGroup;
  produccionForm!: FormGroup;

  isEdicion: boolean = false;
  isShowMailMenu = false;
  isTabDisabled = false;

  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  // Orden y filtro
  filtros: any = {
    'name': { value: '', op: 'LIKE', contiene: true },
    'code': { value: '', op: 'LIKE', contiene: true },
    'productType.uuid': { value: '', op: '=', contiene: false },
    'productType.can_be_produced': { value: '', op: '=', contiene: false },
    'productCategory.uuid': { value: '', op: '=', contiene: false },
    'productStates.possibleProductState.uuid': { value: '', op: '=', contiene: false },
    'mercosur_nomenclature': { value: '', op: 'LIKE', contiene: true },
    'measure.uuid': { value: '', op: '=', contiene: false },
    'stocks.batch.batch_identification': { value: '', op: 'LIKE', contiene: true },
    'suppliers.uuid': { value: '', op: '=', contiene: false },
    'traceable': { value: '', op: '=', contiene: false },
    'assign_serial_number': { value: '', op: '=', contiene: false }
  };
  ordenamiento: any = {
    'name': 'asc'
  };

  isSubmit = false;

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;
  iconArrowLeft = faArrowLeft;

  tab1: string = 'datos-generales';

  // Referencia al modal para crear y editar países.
  @ViewChild('modalProducto') modalProducto!: NgxCustomModalComponent;
  @ViewChild('modalProduccion') modalProduccion!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };
  tituloModal: string = '';

  // Catalogos
  paises: any[] = [];
  categorias: any[] = [];
  estados: any[] = [];
  proveedores: any[] = [];
  tipoProductos: any[] = [];
  measures: any[] = [];
  usuarios: any[] = [];

  uuidFromUrl: string = '';
  isLoadingProductos: boolean = true;

  placeholderStocks: string = '';
  usuarioLogueado: any;
  productoAProducir: any;

  // Manejo de filtros activos.
  activeFilters: Array<{ key: string; label: string; display: string }> = [];

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _productoService: ProductoService, private spinner: NgxSpinnerService, private tokenService: TokenService,
    private _catalogoService: CatalogoService, private location: Location, private route: ActivatedRoute, private router: Router,
    private _produccionService: ProduccionService, private _userLogged: UserLoggedService, private formBuilder: FormBuilder
  ) {
    this.initStore();
  }

  async initStore() {
    this.storeData
      .select((d) => d.index)
      .subscribe((d) => {
        this.actual_role = d.userRole;
      });
  }

  ngAfterViewInit() {
    if (this.offcanvasElement) {
      this.offcanvasElement.nativeElement.addEventListener('hidden.bs.offcanvas', () => {
        // Aquí puedes ejecutar cualquier acción adicional al cierre
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.uuidFromUrl = params.get('uuid') ?? '';
    });
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab')?.toLowerCase();
      const validTabs = ['datos-generales', 'componentes', 'componente-de', 'reemplazos', 'proveedores', 'stocks', 'compras', 'vinculos'];
      if (tab && validTabs.includes(tab)) {
        this.tab1 = tab;
      } else {
        this.tab1 = 'datos-generales';
      }
    });
    this.usuarioLogueado = this._userLogged.getUsuarioLogueado;

    this.spinner.show();
    this.obtenerProductos();
    this.obtenerCatalogos();
  }

  obtenerProductos(alta: boolean = false) {
    // El booleano 'alta' es para que cuando da de alta un nuevo registro, no entre a inicializar, sino siempre muestra el primero de 
    // la lista y no el que acabo de agregar.

    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["productType", "productCategory", "currentState", "productStates", "measure", "country", "stocks"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getProductosWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.productos = res.data;
          this.modificarPaginacion(res);
          this.tokenService.setToken(res.token);
          if (this.uuidFromUrl) {
            this.showProductByUuid(this.uuidFromUrl, false);
          } else {
            if (this.productos.length === 0) {
              this.swalService.toastSuccess('center', 'No existen productos.');
              this.isTabDisabled = true;
              this.tab1 = 'datos-generales';
              this.selectedProducto = null;
            } else {
              this.isTabDisabled = false;
            }
            if (!alta && this.productos.length > 0) {
              this.isEdicion = false;
              const first = this.productos[0];
              this.uuidFromUrl = first.uuid;
              this.showProductByUuid(first.uuid, false);
              this.updateTabQueryParam('datos-generales', this.uuidFromUrl);
            }
          }
          this.spinner.hide();
        },
        error: error => {
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

  showProductByUuid(uuid: string, updateTab: boolean, event?: MouseEvent) {
    if (event?.ctrlKey || event?.metaKey) {
      const baseUrl = window.location.origin + window.location.pathname;
      const urlTree = this.router.createUrlTree([`/dashboard/productos/${uuid}`], {
        queryParams: updateTab ? { tab: 'datos-generales' } : {}
      });
      const finalUrl = this.router.serializeUrl(urlTree);
      window.open(`${baseUrl}#${finalUrl}`, '_blank');
      return;
    }

    this.subscription.add(
      this._productoService.showProduct(uuid, this.actual_role).subscribe({
        next: res => {
          this.showDataProducto(res.data, updateTab);
          this.isLoadingProductos = false;
          this.tokenService.setToken(res.token);
        },
        error: error => {
          // this.isLoadingProductos = false;
          console.error(error);
        }
      })
    )
  }

  obtenerCatalogos() {
    forkJoin({
      paises: this._catalogoService.getPaises(),
      categorias: this._catalogoService.getCategorias(this.actual_role),
      estados: this._catalogoService.getPosiblesEstadosProductos(this.actual_role),
      tipoProductos: this._catalogoService.getTipoProductos(this.actual_role),
      measures: this._catalogoService.getMeasures(this.actual_role),
      proveedores: this._indexService.getProveedores(this.actual_role),
      usuarios: this._indexService.getUsuariosWithParam(null, this.actual_role)
    }).subscribe({
      next: res => {
        this.paises = res.paises.data;
        this.categorias = res.categorias.data;
        this.categorias = this.categorias.sort((a: any, b: any) => a.name.localeCompare(b.name));
        this.estados = res.estados.data;
        this.tipoProductos = res.tipoProductos.data;
        this.tipoProductos = this.tipoProductos.sort((a: any, b: any) => a.name.localeCompare(b.name));
        this.measures = res.measures.data;
        this.proveedores = res.proveedores.data;
        this.proveedores = this.proveedores.map(proveedor => ({
          ...proveedor,
          nombreCompleto: this.getNombreProveedor(proveedor)
        }));
        this.usuarios = res.usuarios.data;
      },
      error: error => {
        console.error('Error cargando catalogos:', error);
      }
    });
  }

  getNombreProveedor(proveedor: any): string {
    if (!proveedor || !proveedor.person) return '';
    if (proveedor.person?.human) {
      return proveedor.person?.human?.firstname + ' ' + proveedor.person?.human?.lastname;
    } else if (proveedor.person?.legal_entity) {
      return proveedor.person?.legal_entity?.company_name;
    }
    return ''; // En caso de que no tenga ninguno de los dos
  }

  inicializarFormEdit(producto: any) {
    this.selectedProducto = producto;
    this.productoForm = new FormGroup({
      nombre: new FormControl({ value: producto?.name, disabled: !this.isEdicion }, [Validators.required]),
      codigo: new FormControl({ value: producto?.code, disabled: !this.isEdicion }, []),
      tipoProducto: new FormControl({ value: producto?.product_type, disabled: !this.isEdicion }, [Validators.required]),
      categoria: new FormControl({ value: producto?.product_category?.uuid, disabled: !this.isEdicion }, []),
      estado: new FormControl({ value: producto?.current_state?.state?.uuid, disabled: !this.isEdicion }, [Validators.required]),
      estadoComentario: new FormControl({ value: producto?.current_state?.comments, disabled: !this.isEdicion }, []),
      nomenclatura: new FormControl({ value: producto?.mercosur_nomenclature, disabled: !this.isEdicion }, []),
      unidad: new FormControl({ value: producto?.measure, disabled: !this.isEdicion }, [Validators.required]),
      iva: new FormControl({ value: producto?.vat_percent, disabled: !this.isEdicion }, [Validators.required]),
      pais: new FormControl({ value: producto?.country?.uuid, disabled: !this.isEdicion }, [Validators.required]),
      asignaNumSerie: new FormControl({ value: producto?.assign_serial_number, disabled: !this.isEdicion }, [Validators.required]),
      tieneNumSerie: new FormControl({ value: producto?.has_serial_number, disabled: true }, []),
      trazable: new FormControl({ value: producto?.traceable, disabled: !this.isEdicion }, [Validators.required]),
      vendible: new FormControl({ value: producto?.salable, disabled: !this.isEdicion }, [Validators.required]),
      descripcionControl: new FormControl({ value: producto?.control_description, disabled: !this.isEdicion }, []),
      comentarios: new FormControl({ value: producto?.comments, disabled: !this.isEdicion }, []),
      nombreVenta: new FormControl({ value: producto?.sales_name, disabled: !this.isEdicion }, []),
      stock_initial: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.initial_amount), disabled: true }, []),
      stock_available: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.available_amount), disabled: true }, []),
      stock_reserved: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.reserved_amount), disabled: true }, []),
      stock_samples: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.samples_amount), disabled: true }, []),
      stock_observed: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.observed_amount), disabled: true }, []),
      stock_minimum: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.minimum), disabled: this.isFieldDisabled(producto) }, []),
      stock_optimum: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.optimum), disabled: this.isFieldDisabled(producto) }, []),
      stock_quantity_sold: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.quantity_sold), disabled: true }, []),
    });
    // Habilitar todos los controles si es edición
    if (this.isEdicion) {
      Object.keys(this.productoForm.controls).forEach(key => {
        if (key !== 'stock_available' && key !== 'stock_initial' && key !== 'stock_minimum' && key !== 'stock_observed' &&
          key !== 'stock_optimum' && key !== 'stock_quantity_sold' && key !== 'stock_reserved' && key !== 'stock_samples' && key !== 'tieneNumSerie') {
          this.productoForm.controls[key].enable();
        }
      });
    }
    this.onFormEditChange();
  }
  onFormEditChange() {

    this.productoForm.get('tipoProducto')!.valueChanges.subscribe(
      (value) => {
        if (value && value.stock_controlled === 1) {
          this.productoForm.get('stock_minimum')?.enable();
          this.productoForm.get('stock_optimum')?.enable();
          this.productoForm.get('stock_minimum')?.setValidators(Validators.required)
          this.productoForm.get('stock_optimum')?.setValidators(Validators.required)
        } else {
          this.placeholderStocks = '';
          this.productoForm.get('stock_minimum')?.setValue(null);
          this.productoForm.get('stock_optimum')?.setValue(null);
          this.productoForm.get('stock_minimum')?.disable();
          this.productoForm.get('stock_optimum')?.disable();
          this.productoForm.get('stock_minimum')?.clearValidators();
          this.productoForm.get('stock_optimum')?.clearValidators();
        }
        ['stock_minimum', 'stock_optimum'].forEach((field) => {
          this.productoForm.get(field)?.updateValueAndValidity({ emitEvent: false });
        });
      });
  }

  isFieldDisabled(producto: any) {
    // Solo se habilita si es edicion y es stock controlled
    return !this.isEdicion || producto.product_type?.stock_controlled !== 1;
  }

  mostrarCantidad(data: any, stock: string) {
    if (data?.measure?.is_integer === 1) {
      return (+stock)?.toFixed(0);
    } else {
      return (+stock)?.toFixed(2);
    }
  }

  inicializarFormNew() {
    this.newProductoForm = new FormGroup({
      nombre: new FormControl({ value: null, disabled: false }, [Validators.required]),
      codigo: new FormControl({ value: null, disabled: false }, []),
      tipoProducto: new FormControl({ value: null, disabled: false }, [Validators.required]),
      categoria: new FormControl({ value: null, disabled: false }, [Validators.required]),
      estado: new FormControl({ value: null, disabled: false }, [Validators.required]),
      estadoComentario: new FormControl({ value: null, disabled: false }, []),
      nomenclatura: new FormControl({ value: null, disabled: false }, []),
      pais: new FormControl({ value: null, disabled: false }, [Validators.required]),
      unidad: new FormControl({ value: null, disabled: false }, [Validators.required]),
      iva: new FormControl({ value: null, disabled: false }, [Validators.required]),
      comentarios: new FormControl({ value: null, disabled: false }, []),
      nombreVenta: new FormControl({ value: null, disabled: false }, []),
      descripcionControl: new FormControl({ value: null, disabled: false }, []),
      asignaNumSerie: new FormControl({ value: false, disabled: false }, [Validators.required]),
      tieneNumSerie: new FormControl({ value: false, disabled: true }, []),
      trazable: new FormControl({ value: false, disabled: false }, [Validators.required]),
      vendible: new FormControl({ value: false, disabled: false }, [Validators.required]),
      stock_minimum: new FormControl({ value: null, disabled: true }, []),
      stock_optimum: new FormControl({ value: null, disabled: true }, [])
    });
    this.onNewForm();
  }
  onNewForm() {
    this.newProductoForm.get('tipoProducto')!.valueChanges.subscribe(
      (value) => {
        if (value && value.stock_controlled === 1) {
          this.newProductoForm.get('stock_minimum')?.enable();
          this.newProductoForm.get('stock_optimum')?.enable();
          this.newProductoForm.get('stock_minimum')?.setValidators(Validators.required)
          this.newProductoForm.get('stock_optimum')?.setValidators(Validators.required)
        } else {
          this.placeholderStocks = '';
          this.newProductoForm.get('stock_minimum')?.setValue(null);
          this.newProductoForm.get('stock_optimum')?.setValue(null);
          this.newProductoForm.get('stock_minimum')?.disable();
          this.newProductoForm.get('stock_optimum')?.disable();
          this.newProductoForm.get('stock_minimum')?.clearValidators();
          this.newProductoForm.get('stock_optimum')?.clearValidators();
        }
        ['stock_minimum', 'stock_optimum'].forEach((field) => {
          this.newProductoForm.get(field)?.updateValueAndValidity({ emitEvent: false });
        });
      });

    this.newProductoForm.get('unidad')!.valueChanges.subscribe(
      (value) => {
        if (value) {
          this.placeholderStocks = 'Cantidad en ' + value.name;
        } else {
          this.placeholderStocks = '';
        }
      });
  }

  get tieneNumSerieNewCtrl() {
    return this.newProductoForm.get('tieneNumSerie') as FormControl;
  }

  showDataProducto(producto: any, updateTab: boolean = true) {
    this.productoAnterior = [];
    this.isEdicion = false;
    this.uuidFromUrl = producto.uuid;
    if (updateTab) {
      this.tab1 = 'datos-generales';
    }
    this.updateTabQueryParam(this.tab1, this.uuidFromUrl);
    this.inicializarFormEdit(producto);
  }

  cancelarEdicion() {
    this.isEdicion = false;
    this.inicializarFormEdit(this.selectedProducto);
  }

  openSwalEliminar(producto: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el producto ${producto.name}?`,
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
        this.eliminarProducto(producto);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarProducto(producto: any) {
    this.spinner.show();
    this.subscription.add(
      this._productoService.deleteProducto(producto.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          if (this.uuidFromUrl === producto.uuid) {
            // Se blanquea para que si elimina en el que está parado no tire error al recargar, ya que no existe el uuid.
            this.uuidFromUrl = '';
          }
          this.obtenerProductos();
          this.tokenService.setToken(res.token);
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

  cerrarModal() {
    this.isSubmit = false;
    this.modalProducto.close();
  }


  openModalProducto(type: string, producto?: any) {
    if (type === 'NEW') {
      if (this.isEdicion) {
        this.isEdicion = false;
        this.inicializarFormEdit(this.selectedProducto); // Esto es para que no quede inconsistente cuando edita, da de alta y cerra el modal de alta.
      }
      this.tituloModal = 'Nuevo producto';
      this.inicializarFormNew();
      this.modalProducto.options = this.modalOptions;
      this.modalProducto.open();
    } else {
      this.tab1 = 'datos-generales';
      this.isEdicion = true;
      this.tituloModal = 'Edición producto';
      this.inicializarFormEdit(producto);
    }
  }

  confirmarProducto(form: FormGroup) {
    this.isSubmit = true;
    if (form.valid) {
      if ((form.get('asignaNumSerie')?.value === 1 || form.get('asignaNumSerie')?.value === true) &&
        (form.get('tieneNumSerie')?.value === 1 || form.get('tieneNumSerie')?.value === true)) {
        this.swalService.toastError('top-right', 'No es posible asignar y tener número de serie al mismo tiempo.');
        return;
      }
      this.spinner.show();
      let producto = new ProductoDTO();
      this.armarDTOProducto(producto, form);
      if (!this.isEdicion) {
        this.subscription.add(
          this._productoService.saveProducto(producto).subscribe({
            next: res => {
              this.spinner.hide();
              this.obtenerProductos(true);
              this.cerrarModal();
              this.showDataProducto(res.data);
            },
            error: error => {
              this.spinner.hide();
              this.swalService.toastError('top-right', error.error.message)
              console.error(error);
            }
          })
        )
      } else {
        this.subscription.add(
          this._productoService.editProducto(this.selectedProducto.uuid, producto).subscribe({
            next: res => {
              this.productos = [...this.productos.map(p =>
                p.uuid === res.data.uuid ? res.data : p
              )];
              this.isEdicion = false;
              this.inicializarFormEdit(res.data);
              this.swalService.toastSuccess('top-right', "Producto actualizado.");
              this.spinner.hide();
            },
            error: error => {
              this.spinner.hide();
              this.swalService.toastError('top-right', error.error.message);
              console.error(error);
            }
          })
        )
      }
    }
  }

  armarDTOProducto(producto: ProductoDTO, form: FormGroup) {
    producto.actual_role = this.actual_role;
    producto.with = ["productType", "productCategory", "currentState", "productStates", "measure", "country", "stocks"];
    producto.name = form.get('nombre')?.value;
    producto.code = form.get('codigo')?.value;
    producto.product_type_uuid = form.get('tipoProducto')?.value.uuid;
    producto.product_category_uuid = form.get('categoria')?.value;
    let estadoProducto = new ProductState();
    estadoProducto.possible_product_state_uuid = form.get('estado')?.value;
    estadoProducto.comments = form.get('estadoComentario')?.value;
    producto.product_state = estadoProducto;
    producto.comments = form.get('comentarios')?.value;
    producto.measure_uuid = form.get('unidad')?.value.uuid;
    producto.vat_percent = form.get('iva')?.value;
    producto.country_uuid = form.get('pais')?.value;
    producto.mercosur_nomenclature = form.get('nomenclatura')?.value;
    producto.assign_serial_number = form.get('asignaNumSerie')?.value;
    producto.has_serial_number = form.get('tieneNumSerie')?.value;
    producto.traceable = form.get('trazable')?.value;
    producto.salable = form.get('vendible')?.value;
    producto.sales_name = form.get('nombreVenta')?.value;
    producto.control_description = form.get('descripcionControl')?.value;
    if (form.get('tipoProducto')?.value?.stock_controlled === 1) {
      if (form.get('unidad')?.value?.is_integer === 1) {
        producto.minimum = +(+form.get('stock_minimum')?.value)?.toFixed(0);
        producto.optimum = +(+form.get('stock_optimum')?.value)?.toFixed(0);
      } else {
        producto.minimum = +(+form.get('stock_minimum')?.value)?.toFixed(2);
        producto.optimum = +(+form.get('stock_optimum')?.value)?.toFixed(2);
      }
    }
    if (!this.isEdicion) {
      this.cleanObject(producto);
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

  getDropdownClass(index: number) {
    let mitad = this.productos.length / 2;
    return index < mitad ? 'ltr:right-0 rtl:left-0' : 'bottom-full !mt-0 mb-1 whitespace-nowrap ltr:right-0 rtl:left-0';
  }

  obtenerProductosPorFiltroSimple() {
    this.filtros['code'].value = '';
    this.filtros['productType.uuid'].value = '';
    this.filtros['productCategory.uuid'].value = '';
    this.filtros['mercosur_nomenclature'].value = '';
    this.filtros['measure.uuid'].value = '';
    this.filtros['stocks.batch.batch_identification'].value = '';
    this.filtros['suppliers.uuid'].value = '';
    this.filtros['traceable'].value = '';
    this.filtros['assign_serial_number'].value = '';
    this.filtros['productStates.possibleProductState.uuid'].value = '';
    delete this.filtros['productStates.datetime_to'];
    this.obtenerProductos();
  }

  obtenerProductosPorFiltroAvanzado() {
    if (this.filtros['productStates.possibleProductState.uuid'].value !== null && this.filtros['productStates.possibleProductState.uuid'].value !== '') {
      this.filtros['productStates.datetime_to'] = { value: 'null', op: '=', contiene: false };
    } else {
      delete this.filtros['productStates.datetime_to'];
    }
    this.obtenerProductos();
  }

  limpiarFiltros() {
    this.filtros['name'].value = '';
    this.filtros['code'].value = '';
    this.filtros['productType.uuid'].value = '';
    this.filtros['productType.can_be_produced'].value = '';
    this.filtros['productCategory.uuid'].value = '';
    this.filtros['mercosur_nomenclature'].value = '';
    this.filtros['measure.uuid'].value = '';
    this.filtros['stocks.batch.batch_identification'].value = '';
    this.filtros['suppliers.uuid'].value = '';
    this.filtros['traceable'].value = '';
    this.filtros['assign_serial_number'].value = '';
    this.filtros['productStates.possibleProductState.uuid'].value = '';
    delete this.filtros['productStates.datetime_to'];
    this.activeFilters = [];
    this.obtenerProductos();
  }

  irAlProducto(data: { data: any, event: MouseEvent }) {
    if (data.event.ctrlKey || data.event.metaKey) {
      const baseUrl = window.location.origin + window.location.pathname;
      const url = this.router.serializeUrl(
        this.router.createUrlTree([`/dashboard/productos/${data.data.uuid}`])
      );
      window.open(`${baseUrl}#${url}`, '_blank');
    } else {
      this.productoAnterior.push(this.selectedProducto);
      this.location.replaceState(`/dashboard/productos/${data.data.uuid}`);
      this.inicializarFormEdit(data.data);
      this.tab1 = 'datos-generales';
    }
  }

  volverAlProductoAnterior() {
    let p = this.productoAnterior.pop();
    this.location.replaceState(`/dashboard/productos/${p.uuid}`);
    this.isEdicion = false;
    this.inicializarFormEdit(p);
    this.tab1 = 'datos-generales';
  }

  openModalProduccion(data: any) {
    this.productoAProducir = data;
    this.tituloModal = `Nueva producción de '${this.productoAProducir.name}'`;
    this.inicializarFormProduccion();
    this.modalProduccion.options = this.modalOptions;
    this.modalProduccion.open();
  }
  cerrarModalProduccion() {
    this.isSubmit = false;
    this.modalProduccion.close();
  }

  inicializarFormProduccion() {
    this.produccionForm = this.formBuilder.group({
      cantidad: new FormControl({ value: null, disabled: false }, [Validators.required]),
      fecha: new FormControl({ value: new Date(), disabled: false }, [Validators.required]),
      responsable: new FormControl({ value: null, disabled: false }, [Validators.required]),
      series: this.formBuilder.array([])
    });
    this.onChangeFormProduccion();
  }
  onChangeFormProduccion() {
    this.produccionForm.get('cantidad')!.valueChanges.subscribe(
      (value) => {
        if (this.productoAProducir.assign_serial_number === 1) {
          this.series.clear();
          if (value && value > 0) {
            for (let i = 0; i < value; i++) {
              this.agregarSerie();
            }
          }
        }
      });
  }

  get series(): FormArray {
    return this.produccionForm.get('series') as FormArray;
  }

  agregarSerie() {
    const fieldGroup = this.formBuilder.group({
      value: ['', Validators.required]
    });
    this.series.push(fieldGroup);
  }

  generarSecuencia() {
    const cantidad = this.series.length;
    const base = Number(this.series.at(0).get('value')?.value);

    if (!base || isNaN(base)) {
      this.swalService.toastError('top-right', "Los números de serie debe ser numéricos.")
      return;
    }

    for (let i = 1; i < cantidad; i++) {
      this.series.at(i).get('value')?.setValue((base + i).toString());
    }
  }

  esProducible(producto: any) {
    return producto?.product_type?.can_be_produced === 1 && producto.current_state?.state?.name === 'Vigente';
  }

  confirmarProduccion() {
    this.isSubmit = true;
    this.produccionForm.markAllAsTouched();
    this.series.markAllAsTouched();
    if (this.produccionForm.valid) {
      this.spinner.show();
      let produccionDTO = new ProduccionDTO();
      produccionDTO.actual_role = this.actual_role;
      produccionDTO.product_uuid = this.productoAProducir.uuid;
      const fechaFormateada = this.produccionForm.get('fecha')?.value instanceof Date
        ? format(this.produccionForm.get('fecha')?.value, 'dd-MM-yyyy')
        : this.produccionForm.get('fecha')?.value;
      produccionDTO.production_datetime = this.convertirFechaADateBackend(fechaFormateada);
      produccionDTO.quantity = this.produccionForm.get('cantidad')?.value;
      produccionDTO['user->responsible_uuid'] = this.produccionForm.get('responsable')?.value;
      const seriesNumeros: [] = this.series.value.map((s: any) => s.value.toString());
      produccionDTO.serial_numbers = seriesNumeros;
      this.subscription.add(
        this._produccionService.saveProduccion(produccionDTO).subscribe({
          next: res => {
            this.tokenService.setToken(res.token);
            this.cerrarModalProduccion();
            this.spinner.hide();
            this.router.navigate([`/dashboard/producciones/${res.data?.uuid}`])
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

  convertirFechaADateBackend(fechaStr: string): string {
    const [dia, mes, anio] = fechaStr.split('-');
    return `${anio}-${mes}-${dia}`;
  }

  cambiarTab(tab: string) {
    this.cancelarEdicion();
    this.tab1 = tab;
    this.updateTabQueryParam(this.tab1, this.uuidFromUrl);
  }

  updateTabQueryParam(tab: string, uuid: string) {
    if (!uuid) return;
    const mergedQueryParams = {
      ...this.route.snapshot.queryParams,
      tab
    };
    const tree = this.router.createUrlTree(
      ['/dashboard/productos', uuid],
      { queryParams: mergedQueryParams }
    );
    const url = this.router.serializeUrl(tree);
    this.location.replaceState(url);
  }

  buildActiveFilters(): void {
    const list: Array<{ key: string; label: string; display: string }> = [];

    const pushIf = (key: string, label: string, value: any, extra: string = '') => {
      if (value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)) {
        list.push({ key, label, display: `${value}${extra}` });
      }
    };

    pushIf('name', 'Nombre', this.filtros['name'].value, this.filtros['name'].contiene ? ' (contiene)' : '');
    pushIf('code', 'Código', this.filtros['code'].value);
    pushIf('mercosur_nomenclature', 'Nomenclatura', this.filtros['mercosur_nomenclature'].value, this.filtros['mercosur_nomenclature'].contiene ? ' (contiene)' : '');
    pushIf('stocks.batch.batch_identification', 'Lote', this.filtros['stocks.batch.batch_identification'].value, this.filtros['stocks.batch.batch_identification'].contiene ? ' (contiene)' : '');
    pushIf('assign_serial_number', 'Asigna n° serie', this.sendValueSiNo(this.filtros['assign_serial_number'].value));
    pushIf('traceable', 'Trazable', this.sendValueSiNo(this.filtros['traceable'].value));
    pushIf('productType.can_be_produced', 'Producible', this.sendValueSiNo(this.filtros['productType.can_be_produced'].value));

    // Estados (convertir UUID a nombre)
    const estados = this.filtros['productStates.possibleProductState.uuid'].value;
    if (estados) {
      this.pushById(estados, 'productStates.possibleProductState.uuid', 'Estados', this.estados, list);
    }

    // Tipos de producto (convertir UUID a nombre)
    const tiposProducto = this.filtros['productType.uuid'].value;
    if (tiposProducto) {
      this.pushById(tiposProducto, 'productType.uuid', 'Tipos de producto', this.tipoProductos, list);
    }

    // Categorias (convertir UUID a nombre)
    const categoria = this.filtros['productCategory.uuid'].value;
    if (categoria) {
      this.pushById(categoria, 'productCategory.uuid', 'Categorías', this.categorias, list);
    }

    // Unidades (convertir UUID a nombre)
    const unidad = this.filtros['measure.uuid'].value;
    if (unidad) {
      this.pushById(unidad, 'measure.uuid', 'Unidad', this.measures, list);
    }

    const proveedor = this.filtros['suppliers.uuid'].value;
    if (proveedor) {
      this.pushById(proveedor, 'suppliers.uuid', 'Proveedor', this.proveedores, list);
    }

    this.activeFilters = list;
  }

  sendValueSiNo(value: any) {
    if (!value) {
      return value;
    }
    if (value === '1') {
      return 'Si'
    }
    return 'No';
  }

  pushWhenArray(filtroValue: any, filtroName: string, label: string, array: any, list: Array<{ key: string; label: string; display: string }>) {
    if (Array.isArray(filtroValue) && filtroValue.length > 0) {
      const nombres = (array || [])
        .filter((e: any) => filtroValue.includes(e.uuid))
        .map((e: any) => e.name)
        .join(', ');
      list.push({ key: filtroName, label: label, display: nombres });
    }
  }

  pushById(filtroValue: any, filtroName: string, label: string, array: any, list: Array<{ key: string; label: string; display: string }>) {
    if (filtroName === 'suppliers.uuid') {
      const item = array.find((e: any) => e.uuid === filtroValue);
      const nombre = item.person?.human ? item.person.human.firstname + ' ' + item.person.human.lastname : item.person.legal_entity.company_name;
      list.push({ key: filtroName, label: label, display: nombre });

    } else {
      const item = array.find((e: any) => e.uuid === filtroValue);
      list.push({ key: filtroName, label: label, display: item.name });
    }
  }

  clearFilter(key: string): void {
    switch (key) {
      case 'name':
      case 'code':
      case 'mercosur_nomenclature':
      case 'stocks.batch.batch_identification':
        this.filtros[key].value = '';
        this.filtros[key].contiene = true;
        break;
      case 'productStates.possibleProductState.uuid':
      case 'productType.uuid':
      case 'user->responsible.uuid':
      case 'productCategory.uuid':
      case 'measure.uuid':
      case 'suppliers.uuid':
      case 'productType.can_be_produced':
      case 'assign_serial_number':
      case 'traceable':
        this.filtros[key].value = '';
        break;
    }

    this.buildActiveFilters();
    this.obtenerProductosPorFiltroAvanzado();
  }

}
