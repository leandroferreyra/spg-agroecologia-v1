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

  busqueda_contiene: boolean = true;
  isEdicion: boolean = false;
  isShowMailMenu = false;

  // Orden y filtro para datos listado proveedores.
  filtros: any = {
    'tipoPersona': 'todos'
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
  showFilterPersonas: boolean = false;
  MAX_ITEMS_PER_PAGE_buscar = 5;
  currentPage_buscar = 1;
  last_page_buscar = 1;
  itemsPerPage_buscar = this.MAX_ITEMS_PER_PAGE_buscar;
  itemsInPage_buscar = this.itemsPerPage_buscar;
  pageSize_buscar: number = 0;
  total_rows_buscar: number = 0;
  filtrosContactos_buscar: any = {
    'firstname': { value: '', op: 'LIKE', contiene: true },
    'lastname': { value: '', op: 'LIKE', contiene: true },
    'document_number': { value: '', op: 'LIKE', contiene: true },
    'cuit': { value: '', op: 'LIKE', contiene: true },
    'company_name': { value: '', op: 'LIKE', contiene: true }
  };
  ordenamiento_buscar: any = {
  };

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _proveedoresService: ProveedoresService, private spinner: NgxSpinnerService, private tokenService: TokenService,
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
    // this.inicializarFormEdit();
    this.obtenerProductos();
    // this.obtenerCatalogos();
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


  // inicializarForm(producto?: any) {
  //   console.log(producto);
  //   if (producto) {
  //     this.selectedProducto = producto;
  //   }
  //   if (this.isEdicion) {
  //     this.inicializarFormEdit(producto);
  //   } else {
  //     this.inicializarFormNew();
  //   }
  // }
  inicializarFormEdit(producto: any) {
    this.selectedProducto = producto;
    this.productoForm = new FormGroup({
      nombre: new FormControl({ value: producto?.name, disabled: !this.isEdicion }, [Validators.required]),
      codigo: new FormControl({ value: producto?.code, disabled: !this.isEdicion }, [Validators.required]),
    });
  }
  inicializarFormNew() {
    this.productoForm = new FormGroup({
      nombre: new FormControl({ value: null, disabled: true }, [Validators.required]),
      codigo: new FormControl({ value: null, disabled: true }, [Validators.required]),
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

  confirmarEdicion() {
    if (this.productoForm.valid) {
      this.spinner.show();
      let proveedor = new ProveedorDTO();
      this.armarDTOEdicion(proveedor);
      // console.log(proveedor);
      this.subscription.add(
        this._proveedoresService.editProveedor(this.selectedProducto.uuid, proveedor).subscribe({
          next: res => {
            // console.log(res);
            this.productos = [...this.productos.map(p =>
              p.uuid === res.data.uuid ? res.data : p
            )];
            this.productosFiltrados = this.productos;
            this.inicializarFormEdit(res.data);
            this.isEdicion = false;
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
  armarDTOEdicion(proveedor: ProveedorDTO) {
    // console.log(this.newProveedorForm);
    proveedor.actual_role = this.actual_role;
    proveedor.with = ["person.city", "person.city.district", "person.city.district.country", "person.human", "person.human.gender",
      "person.human.documentType", "person.legalEntity"];
    proveedor.batch_prefix = this.productoForm.get('sigla')?.value;
    proveedor.comments = this.productoForm.get('comentarios')?.value;
    proveedor.perception = !!this.productoForm.get('percepcionRG3337')?.value;
    proveedor.vat_percent = this.productoForm.get('percepcionIVA')?.value;
    proveedor.withholding = !!this.productoForm.get('percepcionIIBB')?.value;
    let person = new Person();
    person.street_name = this.productoForm.get('calle')?.value;
    person.door_number = this.productoForm.get('numero')?.value;
    person.address_detail = this.productoForm.get('detalleDireccion')?.value;
    person.city_uuid = this.productoForm.get('ciudad')?.value;
    person.possible_person_state_uuid = this.productoForm.get('estado')?.value;
    person.state_comments = this.productoForm.get('estadoComentario')?.value;
    proveedor.person = person;
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
      if (this.filtros.tipoPersona === 'fisica') {
        resultados = this.productosFiltrados.filter(dato => {
          return dato.person?.human
        })

      } else if (this.filtros.tipoPersona === 'juridica') {
        resultados = this.productosFiltrados.filter(dato => {
          return dato.person?.legal_entity
        })
      } else {
        // todos
        resultados = this.productos;
      }
      if (this.filtros.nombre) {
        resultados = resultados.filter(dato => {
          return dato.person?.human?.firstname?.toLowerCase().includes(this.filtros.nombre.toLowerCase());
        })
      }
      if (this.filtros.apellido) {
        resultados = resultados.filter(dato => {
          return dato.person?.human?.lastname?.toLowerCase().includes(this.filtros.apellido.toLowerCase());
        })
      }
      if (this.filtros.razon) {
        resultados = resultados.filter(dato => {
          return dato.person?.legal_entity?.company_name?.toLowerCase().includes(this.filtros.razon.toLowerCase());
        })
      }
      if (this.filtros.sigla) {
        resultados = resultados.filter(dato => {
          return dato.batch_prefix?.toLowerCase().includes(this.filtros.sigla.toLowerCase());
        })
      }
      if (this.filtros.cuit) {
        // Acá filtra por cuit o dni, por lo que debe chequear dos cosas, primero con que filtro se está aplicando (todos, fisica o jurídica)
        // y luego, en caso de ser 'todos', chequear si es fisica o jurídica para poder saber de donde sacar la info.
        resultados = resultados.filter(dato => {
          if (this.filtros.tipoPersona === 'todos') {
            if (dato.person?.human) {
              return dato.person?.human?.document_number?.toLowerCase().includes(this.filtros.cuit.toLowerCase()) ||
                dato.person?.human?.cuit?.toLowerCase().includes(this.filtros.cuit.toLowerCase());
            } else {
              // Es juridica
              return dato.person?.legal_entity?.cuit?.toLowerCase().includes(this.filtros.cuit.toLowerCase());
            }
          } else if (this.filtros.tipoPersona === 'fisica') {
            return dato.person?.human?.document_number?.toLowerCase().includes(this.filtros.cuit.toLowerCase()) ||
              dato.person?.human?.cuit?.toLowerCase().includes(this.filtros.cuit.toLowerCase());
          } else {
            // Filtrado por jurídica
            return dato.person?.legal_entity?.cuit?.toLowerCase().includes(this.filtros.cuit.toLowerCase());
          }
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

  eliminarProducto(proveedor: any) {
    this.spinner.show();
    this.subscription.add(
      this._proveedoresService.eliminarProveedor(proveedor.uuid, this.actual_role.toUpperCase()).subscribe({
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

  confirmarNuevoProducto() {
    this.isSubmit = true;
    if (this.productoForm.valid) {
      this.spinner.show();
      let proveedor = new ProveedorDTO();
      this.armarDtoNuevoProveedor(proveedor);
      // console.log(proveedor);
      this.subscription.add(
        this._proveedoresService.saveProveedor(proveedor).subscribe({
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
    }
  }

  armarDtoNuevoProveedor(proveedor: ProveedorDTO) {
    proveedor.actual_role = this.actual_role;
    proveedor.with = ["person.city", "person.city.district", "person.city.district.country", "person.human", "person.human.gender",
      "person.human.documentType", "person.legalEntity"];
    // proveedor.batch_prefix = this.newProveedorForm.get('sigla')?.value;
    // proveedor.comments = this.newProveedorForm.get('comentarios')?.value;
    // proveedor.perception = !!this.newProveedorForm.get('percepcionRG3337')?.value;
    // proveedor.vat_percent = this.newProveedorForm.get('percepcionIVA')?.value;
    // proveedor.withholding = !!this.newProveedorForm.get('percepcionIIBB')?.value;
    // let person = new Person();
    // person.street_name = this.newProveedorForm.get('calle')?.value;
    // person.door_number = this.newProveedorForm.get('numero')?.value;
    // person.address_detail = this.newProveedorForm.get('detalleDireccion')?.value;
    // person.city_uuid = this.newProveedorForm.get('ciudad')?.value;
    // person.possible_person_state_uuid = this.newProveedorForm.get('estado')?.value;
    // person.state_comments = this.newProveedorForm.get('estadoComentario')?.value;

    // proveedor.person = person;
    this.cleanObject(proveedor);
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
      tipoPersona: 'todos'
    };
  }

  // toggleFilter() {
  //   this.showFilter = !this.showFilter;
  //   if (!this.showFilter) {
  //     this.filtros = {
  //       tipoPersona: 'todos'
  //     };
  //   }
  // }

  cleanFilters() {
    this.filtros.nombre = '';
    this.filtros.apellido = '';
    this.filtros.razon = '';
    this.filtros.sigla = '';
    this.filtros.cuit = '';
  }

  // modificarPaginacionBusqueda(res: any) {
  //   this.total_rows_buscar = res.meta.total;
  //   this.last_page_buscar = res.meta.last_page;
  //   if (this.personas.length <= this.itemsPerPage_buscar) {
  //     if (res.meta?.current_page === res.meta?.last_page) {
  //       this.itemsInPage_buscar = this.total_rows_buscar;
  //     } else {
  //       this.itemsInPage_buscar = this.currentPage_buscar * this.itemsPerPage_buscar;
  //     }
  //   }
  // }

  // altaNuevoProveedor() {
  //   this.altaPersona = true;
  // }

  toggleFilter() {
    this.showFilterPersonas = !this.showFilterPersonas;
    if (!this.showFilterPersonas) {
      this.filtrosContactos_buscar.firstname = { value: '', op: 'LIKE', contiene: true };
      this.filtrosContactos_buscar.lastname = { value: '', op: 'LIKE', contiene: true };
      this.filtrosContactos_buscar.company_name = { value: '', op: 'LIKE', contiene: true };
      this.filtrosContactos_buscar.document_number = { value: '', op: 'LIKE', contiene: true };
      this.filtrosContactos_buscar.cuit = { value: '', op: 'LIKE', contiene: true };
      // this.obtenerPersonas();
    }
  }

  agregarProveedorAFormulario(dato: any) {
    // if (!this.isProveedor(dato)) {
    //   this.inicializarNuevoFormularioProveedor(dato);
    //   this.altaPersona = true; // Muestra formulario
    // } else {
    //   this.swalService.toastError('top-right', 'La persona ya es proveedor');
    // }
  }


  getDropdownClass(index: number) {
    let mitad = this.productosFiltrados.length / 2;
    return index < mitad ? 'ltr:right-0 rtl:left-0' : 'bottom-full !mt-0 mb-1 whitespace-nowrap ltr:right-0 rtl:left-0';
  }

}
