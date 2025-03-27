import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
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
import { ProveedorDTO, Person, Human, LegalEntity } from 'src/app/core/models/request/proveedorDTO';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { IndexService } from 'src/app/core/services/index.service';
import { ProveedoresService } from 'src/app/core/services/proveedores.service';
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
import { ProductoDTO } from 'src/app/core/models/request/productoDTO';
import { ProductoService } from 'src/app/core/services/producto.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent, IconTrashLinesComponent, NgxCustomModalComponent, NgxSpinnerModule,
    NgSelectModule, IconHorizontalDotsComponent, MenuModule, FontAwesomeModule, CuentasBancariasComponent, ComprasProveedorComponent,
    ContactosComponent, ContactosPersonaComponent, IconSettingsComponent, NgbPaginationModule
  ],
  animations: [toggleAnimation],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit, OnDestroy {
  toggleDropdown = false;

  store: any;
  private subscription: Subscription = new Subscription();
  actual_role: string = '';
  productos: any[] = [];
  productosFiltrados: any[] = [];
  selectedProducto: any;
  productoForm!: FormGroup;
  newProductoForm!: FormGroup;

  busqueda_contiene: boolean = true;
  isEdicion: boolean = false;
  isShowMailMenu = false;

  // Orden y filtro para datos listado proveedores.
  filtros: any = {
    'nombre_contiene': true,
    'nomenclatura_contiene': true,
    'lote_contiene': true
  };
  showFilter: boolean = false;
  filtroSimple: boolean = false;
  busquedaPorNombreSimple: string = '';
  isSubmit = false;

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;
  iconArrowLeft = faArrowLeft;


  tab1: string = 'datos-generales';

  // Referencia al modal para crear y editar países.
  @ViewChild('modalProducto') modalProducto!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };
  tituloModal: string = '';

  // Orden, filtro y paginación para buscar personas
  // showFilterPersonas: boolean = false;
  // MAX_ITEMS_PER_PAGE_buscar = 5;
  // currentPage_buscar = 1;
  // last_page_buscar = 1;
  // itemsPerPage_buscar = this.MAX_ITEMS_PER_PAGE_buscar;
  // itemsInPage_buscar = this.itemsPerPage_buscar;
  // pageSize_buscar: number = 0;
  // total_rows_buscar: number = 0;
  // filtrosContactos_buscar: any = {
  //   'firstname': { value: '', op: 'LIKE', contiene: true },
  //   'lastname': { value: '', op: 'LIKE', contiene: true },
  //   'document_number': { value: '', op: 'LIKE', contiene: true },
  //   'cuit': { value: '', op: 'LIKE', contiene: true },
  //   'company_name': { value: '', op: 'LIKE', contiene: true }
  // };
  // ordenamiento_buscar: any = {
  // };

  // Catalogos
  paises: any[] = [];
  categorias: any[] = [];
  estados: any[] = [];
  proveedores: any[] = [];
  tipoProductos: any[] = [];
  measures: any[] = [];

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _productoService: ProductoService, private spinner: NgxSpinnerService, private tokenService: TokenService,
    private _catalogoService: CatalogoService) {
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
    const offcanvasElement = document.getElementById('offcanvasRight');

    if (offcanvasElement) {
      offcanvasElement.addEventListener('hidden.bs.offcanvas', () => {
        // console.log('El offcanvas se ha cerrado');
        // Aquí puedes ejecutar cualquier acción adicional al cierre
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.spinner.show();
    this.obtenerProductos();
    this.obtenerCatalogos();
  }

  obtenerProductos(alta: boolean = false) {
    // El booleano 'alta' es para que cuando da de alta un nuevo registro, no entre a inicializar, sino siempre muestra el primero de 
    // la lista y no el que acabo de agregar.
    this.subscription.add(
      this._indexService.getProductos(this.actual_role).subscribe({
        next: res => {
          console.log(res);
          this.productos = res.data;
          this.productosFiltrados = this.productos;
          if (!alta && this.productos.length > 0) {
            this.inicializarFormEdit(this.productos[0]);
          }
          this.tokenService.setToken(res.token);
          this.spinner.hide();
        },
        error: error => {
          console.error(error);
          this.spinner.hide();
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
      proveedores: this._indexService.getProveedores(this.actual_role)
    }).subscribe({
      next: res => {
        this.paises = res.paises.data;
        this.categorias = res.categorias.data;
        this.estados = res.estados.data;
        this.tipoProductos = res.tipoProductos.data;
        this.measures = res.measures.data;
        this.proveedores = res.proveedores.data;
        this.proveedores = this.proveedores.map(proveedor => ({
          ...proveedor,
          nombreCompleto: this.getNombreProveedor(proveedor)
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
    this.selectedProducto = producto;
    this.productoForm = new FormGroup({
      nombre: new FormControl({ value: producto?.name, disabled: !this.isEdicion }, [Validators.required]),
      codigo: new FormControl({ value: producto?.code, disabled: !this.isEdicion }, [Validators.required]),
      tipoProducto: new FormControl({ value: producto?.product_type?.uuid, disabled: !this.isEdicion }, [Validators.required]),
      categoria: new FormControl({ value: producto?.product_category?.uuid, disabled: !this.isEdicion }, [Validators.required]),
      estado: new FormControl({ value: producto?.current_state?.state?.uuid, disabled: !this.isEdicion }, [Validators.required]),
      nomenclatura: new FormControl({ value: producto?.mercosur_nomenclature, disabled: !this.isEdicion }, [Validators.required]),
      unidad: new FormControl({ value: producto?.measure?.uuid, disabled: !this.isEdicion }, [Validators.required]),
      iva: new FormControl({ value: producto?.vat_percent, disabled: !this.isEdicion }, [Validators.required]),
      pais: new FormControl({ value: producto?.country?.uuid, disabled: !this.isEdicion }, [Validators.required]),
      asignaNumSerie: new FormControl({ value: producto?.assign_serial_number, disabled: !this.isEdicion }, [Validators.required]),
      tieneNumSerie: new FormControl({ value: producto?.has_serial_number, disabled: !this.isEdicion }, [Validators.required]),
      trazable: new FormControl({ value: producto?.traceable, disabled: !this.isEdicion }, [Validators.required]),
      vendible: new FormControl({ value: producto?.salable, disabled: !this.isEdicion }, [Validators.required]),
      controlable: new FormControl({ value: producto?.controllable, disabled: !this.isEdicion }, [Validators.required]),
      comentarios: new FormControl({ value: producto?.comments, disabled: !this.isEdicion }, [Validators.required]),
      nombreVenta: new FormControl({ value: producto?.sales_name, disabled: !this.isEdicion }, [Validators.required]),
      descripcionControl: new FormControl({ value: producto?.control_description, disabled: !this.isEdicion }, [Validators.required]),
      stock_available: new FormControl({ value: producto?.stock_data?.available, disabled: true }, []),
      stock_initial: new FormControl({ value: producto?.stock_data?.initial_stock, disabled: true }, []),
      stock_minimum: new FormControl({ value: producto?.stock_data?.minimum, disabled: true }, []),
      stock_observed: new FormControl({ value: producto?.stock_data?.observed, disabled: true }, []),
      stock_optimum: new FormControl({ value: producto?.stock_data?.optimum, disabled: true }, []),
      stock_quantity_sold: new FormControl({ value: producto?.stock_data?.quantity_sold, disabled: true }, []),
      stock_reserved: new FormControl({ value: producto?.stock_data?.reserved, disabled: true }, []),
      stock_samples: new FormControl({ value: producto?.stock_data?.samples, disabled: true }, []),
    });
    // Habilitar todos los controles si es edición
    if (this.isEdicion) {
      Object.keys(this.productoForm.controls).forEach(key => {
        if (key !== 'stock_available' && key !== 'stock_initial' && key !== 'stock_minimum' && key !== 'stock_observed' &&
          key !== 'stock_optimum' && key !== 'stock_quantity_sold' && key !== 'stock_reserved' && key !== 'stock_samples') {
          this.productoForm.controls[key].enable();
        }
      });
    }
  }
  inicializarFormNew() {
    this.newProductoForm = new FormGroup({
      nombre: new FormControl({ value: null, disabled: false }, [Validators.required]),
      codigo: new FormControl({ value: null, disabled: false }, [Validators.required]),
      tipoProducto: new FormControl({ value: null, disabled: false }, [Validators.required]),
      categoria: new FormControl({ value: null, disabled: false }, [Validators.required]),
      estado: new FormControl({ value: null, disabled: false }, [Validators.required]),
      nomenclatura: new FormControl({ value: null, disabled: false }, [Validators.required]),
      pais: new FormControl({ value: null, disabled: false }, [Validators.required]),
      unidad: new FormControl({ value: null, disabled: false }, [Validators.required]),
      iva: new FormControl({ value: null, disabled: false }, [Validators.required]),
      comentarios: new FormControl({ value: null, disabled: false }, [Validators.required]),
      nombreVenta: new FormControl({ value: null, disabled: false }, [Validators.required]),
      descripcionControl: new FormControl({ value: null, disabled: false }, [Validators.required]),
      asignaNumSerie: new FormControl({ value: false, disabled: false }, [Validators.required]),
      tieneNumSerie: new FormControl({ value: false, disabled: false }, [Validators.required]),
      trazable: new FormControl({ value: false, disabled: false }, [Validators.required]),
      vendible: new FormControl({ value: false, disabled: false }, [Validators.required]),
      controlable: new FormControl({ value: false, disabled: false }, [Validators.required])
    });
  }

  showDataProducto(producto: any) {
    this.isEdicion = false;
    this.inicializarFormEdit(producto);
  }

  cancelarEdicion() {
    this.isEdicion = false;
    this.inicializarFormEdit(this.selectedProducto);
  }


  filtroSimpleInput() {
    // Si ingresa acá es porque busca por búsqueda simple, por lo que se desactivas los filtros.
    this.filtroSimple = true;
    this.limpiarFiltros();
  }

  filtrarDatos() {
    let resultados = this.productosFiltrados;

    if (this.filtroSimple) {
      // Escribió en el input simple
      resultados = this.productosFiltrados.filter(dato => {
        let nombre = dato.name?.toLowerCase();
        if (this.busqueda_contiene) {
          return nombre.includes(this.busquedaPorNombreSimple.toLowerCase());
        } else {
          return nombre.startsWith(this.busquedaPorNombreSimple.toLowerCase());
        }
      })
    } else if (this.showFilter) {
      // Es búsqueda avanzada
      if (this.filtros.nombre) {
        resultados = resultados.filter(dato => {
          if (this.filtros.nombre_contiene) {
            return dato.name?.toLowerCase().includes(this.filtros.nombre.toLowerCase());
          } else {
            return dato.name?.toLowerCase().startsWith(this.filtros.nombre.toLowerCase());
          }
        })
      }
      if (this.filtros.codigo) {
        resultados = resultados.filter(dato => {
          return dato.code.toLowerCase().includes(this.filtros.codigo.toLowerCase());
        })
      }
    }

    return resultados;
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
      this.isEdicion = false;
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
      this.spinner.show();
      let producto = new ProductoDTO();
      this.armarDTOProducto(producto, form);
      // console.log(producto);
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
              // console.log(res);
              this.productos = [...this.productos.map(p =>
                p.uuid === res.data.uuid ? res.data : p
              )];
              this.productosFiltrados = this.productos;
              this.isEdicion = false;
              this.inicializarFormEdit(res.data);
              this.swalService.toastSuccess('top-right', "Usuario actualizado.");
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
    producto.with = ["productType", "productCategory", "productStates", "measure", "country", "stocks"];
    producto.name = form.get('nombre')?.value;
    producto.code = form.get('codigo')?.value;
    producto.product_type_uuid = form.get('tipoProducto')?.value;
    producto.product_category_uuid = form.get('categoria')?.value;
    producto.possible_product_state_uuid = form.get('estado')?.value;
    producto.comments = form.get('comentarios')?.value;
    producto.measure_uuid = form.get('unidad')?.value;
    producto.vat_percent = form.get('iva')?.value;
    producto.country_uuid = form.get('pais')?.value;
    producto.mercosur_nomenclature = form.get('nomenclatura')?.value;
    producto.assign_serial_number = form.get('asignaNumSerie')?.value;
    producto.has_serial_number = form.get('tieneNumSerie')?.value;
    producto.traceable = form.get('trazable')?.value;
    producto.salable = form.get('vendible')?.value;
    producto.sales_name = form.get('nombreVenta')?.value;
    producto.controllable = form.get('controlable')?.value;
    producto.control_description = form.get('descripcionControl')?.value;

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

  mostrarFiltros() {
    this.showFilter = true;
    // Desactivo filtros simples
    this.filtroSimple = false;
    this.busquedaPorNombreSimple = '';
    this.busqueda_contiene = false;
  }

  limpiarFiltros() {
    // this.showFilter = false;
    this.filtros = {
      'nombre_contiene': true,
      'nomenclatura_contiene': true,
      'lote_contiene': true
    };
  }

  cleanFilters() {
    this.filtros.nombre = '';
    this.filtros.apellido = '';
    this.filtros.razon = '';
    this.filtros.sigla = '';
    this.filtros.cuit = '';
  }

  getDropdownClass(index: number) {
    let mitad = this.productosFiltrados.length / 2;
    return index < mitad ? 'ltr:right-0 rtl:left-0' : 'bottom-full !mt-0 mb-1 whitespace-nowrap ltr:right-0 rtl:left-0';
  }

}
