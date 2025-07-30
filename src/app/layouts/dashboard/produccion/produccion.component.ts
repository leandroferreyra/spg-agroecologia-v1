import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
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
import { ProductoDTO, ProductState } from 'src/app/core/models/request/productoDTO';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { IndexService } from 'src/app/core/services/index.service';
import { ProductoService } from 'src/app/core/services/producto.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconEditComponent } from 'src/app/shared/icon/icon-edit';
import { IconHorizontalDotsComponent } from 'src/app/shared/icon/icon-horizontal-dots';
import { IconMenuComponent } from 'src/app/shared/icon/icon-menu';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconSettingsComponent } from 'src/app/shared/icon/icon-settings';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import { IconUserComponent } from 'src/app/shared/icon/icon-user';
import Swal from 'sweetalert2';
import { Location } from '@angular/common';
import { ProduccionService } from 'src/app/core/services/produccion.service';
import { toggleAnimation } from 'src/app/shared/animations';
import { ParametrosIndex } from 'src/app/core/models/request/parametrosIndex';
import { FlatpickrDirective } from 'angularx-flatpickr';


@Component({
  selector: 'app-produccion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent, IconPencilComponent, IconTrashLinesComponent, NgxCustomModalComponent, NgxSpinnerModule,
    NgSelectModule, IconHorizontalDotsComponent, MenuModule, FontAwesomeModule, IconSettingsComponent, NgbPaginationModule, FlatpickrDirective],
  animations: [toggleAnimation],
  templateUrl: './produccion.component.html',
  styleUrl: './produccion.component.css'
})
export class ProduccionComponent implements OnInit, OnDestroy {
  toggleDropdown = false;
  @ViewChild('offcanvasRight', { static: false }) offcanvasElement!: ElementRef;

  store: any;
  private subscription: Subscription = new Subscription();
  actual_role: string = '';
  producciones: any[] = [];
  selectedProduccion: any;

  produccionAnterior: any[] = [];
  produccionForm!: FormGroup;
  newProduccionForm!: FormGroup;

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
  params = new ParametrosIndex();
  filtros: any = {
    'operator': { value: '' },
    'product.name': { value: '', op: 'LIKE', contiene: true },
    'batch.batch_identification': { value: '', op: 'LIKE', contiene: true },
    'frozenComponent.productInstance.serial_number': { value: '', op: 'LIKE', contiene: true },
    'productionStates.possibleProductionState.uuid': { value: '', op: 'in', contiene: false },
    'productionStates.datetime_to': { value: '', op: '=', contiene: false },
    'user->responsible.uuid': { value: '', op: 'in', contiene: false }
  };
  ordenamiento: any = {
    'production_datetime': 'desc',
    'product.name': 'asc'
  };
  filtroSimpleName: string = '';
  filtroSimpleContiene: boolean = true;
  filtroFechaProduccionDesde!: string;
  filtroFechaProduccionHasta!: string;

  isSubmit = false;
  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;
  iconArrowLeft = faArrowLeft;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalProduccion') modalProduccion!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };
  tituloModal: string = '';

  // Catalogos
  // paises: any[] = [];
  // categorias: any[] = [];
  estados: any[] = [];
  usuarios: any[] = [];
  // proveedores: any[] = [];
  // tipoProductos: any[] = [];
  // measures: any[] = [];

  uuidFromUrl: string = '';
  isLoadingProductos: boolean = true;

  placeholderStocks: string = '';

  hoveredUuid: string | null = null;

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _productoService: ProductoService, private _produccionService: ProduccionService, private spinner: NgxSpinnerService,
    private tokenService: TokenService, private _catalogoService: CatalogoService, private location: Location, private route: ActivatedRoute,
    private router: Router
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
    this.spinner.show();
    this.obtenerProducciones();
    this.obtenerCatalogos();
  }

  obtenerProducciones(alta: boolean = false) {
    // El booleano 'alta' es para que cuando da de alta un nuevo registro, no entre a inicializar, sino siempre muestra el primero de 
    // la lista y no el que acabo de agregar.

    // Inicializamos un objeto vacío para los parámetros
    this.params.with = ["product", "batch", "productionStates", "frozenComponents","currentState"];
    this.params.paging = this.itemsPerPage;
    this.params.page = this.currentPage;
    this.params.order_by = this.ordenamiento;
    this.params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getProduccionesWithParam(this.params, this.actual_role).subscribe({
        next: res => {
          this.producciones = res.data;
          console.log("🚀 ~ ProduccionComponent ~ obtenerProducciones ~ this.producciones:", this.producciones)
          this.modificarPaginacion(res);
          this.tokenService.setToken(res.token);
          if (this.uuidFromUrl) {
            this.showProduccionByUuid();
          } else {
            this.isLoadingProductos = false;
            if (this.producciones.length === 0) {
              this.swalService.toastSuccess('center', 'No existen producciones.');
              this.isTabDisabled = true;
              this.selectedProduccion = null;
            } else {
              this.isTabDisabled = false;
            }
            if (!alta && this.producciones.length > 0) {
              this.isEdicion = false;
              this.inicializarFormEdit(this.producciones[0]);
              this.location.replaceState(`/dashboard/producciones/${this.producciones[0].uuid}`);
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
    if (this.producciones.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  showName(dato: any) {
    return dato.product?.name;
  }

  showBatch(dato: any) {
    if (dato.batch) {
      return dato.batch?.batch_identification;
    }
    return 'Sin lote';
  }

  showFecha(dato: any) {
    const date = new Date(dato.production_datetime.replace(' ', 'T'));
    return date.toLocaleDateString('es-AR');
  }

  showProduccionByUuid() {
    this.subscription.add(
      this._produccionService.showProduccion(this.uuidFromUrl, this.actual_role).subscribe({
        next: res => {
          this.showDataProduccion(res.data);
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
      estados: this._catalogoService.getPosiblesEstadosProduccion(this.actual_role),
      usuarios: this._indexService.getUsuariosWithParam(null, this.actual_role)
    }).subscribe({
      next: res => {
        this.estados = res.estados.data;
        this.usuarios = res.usuarios.data;
        this.usuarios = this.usuarios.map(usuario => ({
          ...usuario,
          disabled: usuario.production_count === 0
        }));
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
    this.selectedProduccion = producto;
    this.produccionForm = new FormGroup({
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
      tieneNumSerie: new FormControl({ value: producto?.has_serial_number, disabled: !this.isEdicion }, [Validators.required]),
      trazable: new FormControl({ value: producto?.traceable, disabled: !this.isEdicion }, [Validators.required]),
    });
    this.onFormEditChange();
  }
  onFormEditChange() {
   
  }

  isFieldDisabled(producto: any) {
    // Solo se habilita si es edicion y es stock controlled
    return !this.isEdicion || producto.product_type?.stock_controlled !== 1;
  }

  mostrarCantidad(data: any, stock: string) {
    if (data.measure?.is_integer === 1) {
      return (+stock)?.toFixed(0);
    } else {
      return (+stock)?.toFixed(2);
    }
  }

  inicializarFormNew() {
    this.newProduccionForm = new FormGroup({
      nombre: new FormControl({ value: null, disabled: false }, [Validators.required]),
      codigo: new FormControl({ value: null, disabled: false }, []),
      tipoProducto: new FormControl({ value: null, disabled: false }, [Validators.required]),
      categoria: new FormControl({ value: null, disabled: false }, []),
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
      tieneNumSerie: new FormControl({ value: false, disabled: false }, [Validators.required]),
      trazable: new FormControl({ value: false, disabled: false }, [Validators.required]),
      vendible: new FormControl({ value: false, disabled: false }, [Validators.required]),
      stock_minimum: new FormControl({ value: null, disabled: true }, []),
      stock_optimum: new FormControl({ value: null, disabled: true }, [])
    });
    this.onNewForm();
  }
  onNewForm() {
    this.newProduccionForm.get('tipoProducto')!.valueChanges.subscribe(
      (value) => {
        if (value && value.stock_controlled === 1) {
          this.newProduccionForm.get('stock_minimum')?.enable();
          this.newProduccionForm.get('stock_optimum')?.enable();
          this.newProduccionForm.get('stock_minimum')?.setValidators(Validators.required)
          this.newProduccionForm.get('stock_optimum')?.setValidators(Validators.required)
        } else {
          this.placeholderStocks = '';
          this.newProduccionForm.get('stock_minimum')?.setValue(null);
          this.newProduccionForm.get('stock_optimum')?.setValue(null);
          this.newProduccionForm.get('stock_minimum')?.disable();
          this.newProduccionForm.get('stock_optimum')?.disable();
          this.newProduccionForm.get('stock_minimum')?.clearValidators();
          this.newProduccionForm.get('stock_optimum')?.clearValidators();
        }
        ['stock_minimum', 'stock_optimum'].forEach((field) => {
          this.newProduccionForm.get(field)?.updateValueAndValidity({ emitEvent: false });
        });
      });

    this.newProduccionForm.get('unidad')!.valueChanges.subscribe(
      (value) => {
        if (value) {
          this.placeholderStocks = 'Cantidad en ' + value.name;
        } else {
          this.placeholderStocks = '';
        }
      });
  }

  showDataProduccion(producto: any) {
    this.produccionAnterior = [];
    this.isEdicion = false;
    this.location.replaceState(`/dashboard/producciones/${producto.uuid}`);
    this.inicializarFormEdit(producto);
  }

  cancelarEdicion() {
    this.isEdicion = false;
    this.inicializarFormEdit(this.selectedProduccion);
  }

  openSwalEliminar(data: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar la producción ${data.product?.name}?`,
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
        this.eliminarProduccion(data);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarProduccion(produccion: any) {
    this.spinner.show();
    this.subscription.add(
      this._produccionService.deleteProduccion(produccion.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          if (this.uuidFromUrl === produccion.uuid) {
            // Se blanquea para que si elimina en el que está parado no tire error al recargar, ya que no existe el uuid.
            this.uuidFromUrl = '';
          }
          this.obtenerProducciones();
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
    this.modalProduccion.close();
  }

  openModalProduccion(type: string, produccion?: any) {
    // if (type === 'NEW') {
    //   if (this.isEdicion) {
    //     this.isEdicion = false;
    //     this.inicializarFormEdit(this.selectedProduccion); // Esto es para que no quede inconsistente cuando edita, da de alta y cerra el modal de alta.
    //   }
    //   this.tituloModal = 'Nueva producción';
    //   this.inicializarFormNew();
    //   this.modalProduccion.options = this.modalOptions;
    //   this.modalProduccion.open();
    // } else {
    //   this.isEdicion = true;
    //   this.tituloModal = 'Edición de producción';
    //   this.inicializarFormEdit(produccion);
    // }
  }

  confirmarProduccion(form: FormGroup) {
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
              this.obtenerProducciones(true);
              this.cerrarModal();
              this.showDataProduccion(res.data);
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
          this._productoService.editProducto(this.selectedProduccion.uuid, producto).subscribe({
            next: res => {
              this.producciones = [...this.producciones.map(p =>
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
    // producto.actual_role = this.actual_role;
    // producto.with = ["productType", "productCategory", "productStates", "measure", "country", "stocks"];
    // producto.name = form.get('nombre')?.value;
    // producto.code = form.get('codigo')?.value;
    // producto.product_type_uuid = form.get('tipoProducto')?.value.uuid;
    // producto.product_category_uuid = form.get('categoria')?.value;
    // let estadoProducto = new ProductState();
    // estadoProducto.possible_product_state_uuid = form.get('estado')?.value;
    // estadoProducto.comments = form.get('estadoComentario')?.value;
    // producto.product_state = estadoProducto;
    // producto.comments = form.get('comentarios')?.value;
    // producto.measure_uuid = form.get('unidad')?.value.uuid;
    // producto.vat_percent = form.get('iva')?.value;
    // producto.country_uuid = form.get('pais')?.value;
    // producto.mercosur_nomenclature = form.get('nomenclatura')?.value;
    // producto.assign_serial_number = form.get('asignaNumSerie')?.value;
    // producto.has_serial_number = form.get('tieneNumSerie')?.value;
    // producto.traceable = form.get('trazable')?.value;
    // producto.salable = form.get('vendible')?.value;
    // producto.sales_name = form.get('nombreVenta')?.value;
    // producto.control_description = form.get('descripcionControl')?.value;
    // if (form.get('tipoProducto')?.value?.stock_controlled === 1) {
    //   if (form.get('unidad')?.value?.is_integer === 1) {
    //     producto.minimum = +(+form.get('stock_minimum')?.value)?.toFixed(0);
    //     producto.optimum = +(+form.get('stock_optimum')?.value)?.toFixed(0);
    //   } else {
    //     producto.minimum = +(+form.get('stock_minimum')?.value)?.toFixed(2);
    //     producto.optimum = +(+form.get('stock_optimum')?.value)?.toFixed(2);
    //   }
    // }
    // if (!this.isEdicion) {
    //   this.cleanObject(producto);
    // }
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
    let mitad = this.producciones.length / 2;
    return index < mitad ? 'ltr:right-0 rtl:left-0' : 'bottom-full !mt-0 mb-1 whitespace-nowrap ltr:right-0 rtl:left-0';
  }

  obtenerProduccionesPorFiltroSimple() {
    this.filtros['frozenComponent.productInstance.serial_number'].value = '';
    this.filtros['productionStates.possibleProductionState.uuid'].value = '';
    delete this.filtros['productionStates.datetime_to'];
    this.filtros['user->responsible.uuid'].value = '';
    this.filtroFechaProduccionDesde = '';
    this.filtroFechaProduccionHasta = '';
    this.params.extraDateFilters = [];

    this.filtros['product.name'].contiene = this.filtroSimpleContiene;
    this.filtros['batch.batch_identification'].contiene = this.filtroSimpleContiene;
    if (this.filtroSimpleName) {
      this.filtros['product.name'].value = this.filtroSimpleName;
      this.filtros['batch.batch_identification'].value = this.filtroSimpleName;
      this.filtros.operator.value = 'OR';
    } else {
      this.filtros['product.name'].value = '';
      this.filtros['batch.batch_identification'].value = '';
      this.filtros.operator.value = '';
    }
    this.obtenerProducciones();
  }

  obtenerProduccionesPorFiltroAvanzado() {
    this.filtroSimpleName = '';
    this.filtroSimpleContiene = true;
    this.filtros.operator.value = '';
    this.params.extraDateFilters = [];
    if (this.filtros['productionStates.possibleProductionState.uuid'].value !== null && this.filtros['productionStates.possibleProductionState.uuid'].value?.length > 0) {
      this.filtros['productionStates.datetime_to'] = { value: 'null', op: '=', contiene: false };
    } else {
      delete this.filtros['productionStates.datetime_to'];
    }
    // Manejar fechas
    if (this.filtroFechaProduccionDesde) {
      this.params.extraDateFilters.push(['production_datetime', '>=', this.convertirFechaADateBackend(this.filtroFechaProduccionDesde)]);
    }
    if (this.filtroFechaProduccionHasta) {
      this.params.extraDateFilters.push(['production_datetime', '<=', this.convertirFechaADateBackend(this.filtroFechaProduccionHasta)]);
    }
    this.obtenerProducciones();
  }

  convertirFechaADateBackend(fechaStr: string): string {
    const [dia, mes, anio] = fechaStr.split('-');
    return `${anio}-${mes}-${dia}`;
  }

  limpiarFiltros() {
    this.filtros['product.name'].value = '';
    this.filtros['product.name'].contiene = true;
    this.filtros['batch.batch_identification'].value = '';
    this.filtros['batch.batch_identification'].contiene = true;
    this.filtros['frozenComponent.productInstance.serial_number'].value = '';
    this.filtros['productionStates.possibleProductionState.uuid'].value = '';
    delete this.filtros['productionStates.datetime_to'];
    this.filtros['user->responsible.uuid'].value = '';
    this.filtroFechaProduccionDesde = '';
    this.filtroFechaProduccionHasta = '';
    this.params.extraDateFilters = [];

    this.obtenerProducciones();
  }

  irAlProducto(data: { data: any, event: MouseEvent }) {
    if (data.event.ctrlKey || data.event.metaKey) {
      const baseUrl = window.location.origin + window.location.pathname;
      const url = this.router.serializeUrl(
        this.router.createUrlTree([`/dashboard/producciones/${data.data.uuid}`])
      );
      window.open(`${baseUrl}#${url}`, '_blank');
    } else {
      this.produccionAnterior.push(this.selectedProduccion);
      this.location.replaceState(`/dashboard/producciones/${data.data.uuid}`);
      this.inicializarFormEdit(data.data);
    }
  }

  volverAProduccionAnterior() {
    let p = this.produccionAnterior.pop();
    this.location.replaceState(`/dashboard/producciones/${p.uuid}`);
    this.inicializarFormEdit(p);
  }

}
