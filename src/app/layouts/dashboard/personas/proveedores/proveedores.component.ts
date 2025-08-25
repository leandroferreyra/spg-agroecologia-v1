import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown, faArrowUp, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { MenuModule } from 'headlessui-angular';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { forkJoin, Subscription } from 'rxjs';
import { Human, LegalEntity, Person, ProveedorDTO } from 'src/app/core/models/request/proveedorDTO';
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
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import { IconUserComponent } from 'src/app/shared/icon/icon-user';
import Swal from 'sweetalert2';
import { CuentasBancariasComponent } from './cuentas-bancarias/cuentas-bancarias.component';
import { ComprasProveedorComponent } from './compras-proveedor/compras-proveedor.component';
import { ContactosComponent } from '../shared/contactos/contactos.component';
import { ContactosPersonaComponent } from '../shared/contactos-persona/contactos-persona.component';
import { IconSettingsComponent } from 'src/app/shared/icon/icon-settings';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ParametrosIndex } from 'src/app/core/models/request/parametrosIndex';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent, IconTrashLinesComponent, NgxCustomModalComponent, NgxSpinnerModule,
    NgSelectModule, IconHorizontalDotsComponent, MenuModule, FontAwesomeModule, CuentasBancariasComponent, ComprasProveedorComponent,
    ContactosComponent, ContactosPersonaComponent, IconSettingsComponent, NgbPaginationModule, IconPencilComponent
  ],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css',
  animations: [toggleAnimation]
})
export class ProveedoresComponent implements OnInit, OnDestroy {
  toggleDropdown = false;

  store: any;
  private subscription: Subscription = new Subscription();
  actual_role: string = '';
  proveedores: any[] = [];
  // proveedoresFiltrados: any[] = [];
  selectedProveedor: any;
  newProveedorForm!: FormGroup;
  proveedorForm!: FormGroup;

  isHuman: boolean = false;

  busqueda_contiene: boolean = true;
  isEdicion: boolean = false;
  lastSelectedPaisUuid: any = null;
  lastSelectedProvinciaUuid: any = null;

  isShowMailMenu = false;
  isTabDisabled = false;

  // Orden y filtro para datos listado proveedores.
  filtroTipoPersona: string = 'todos';
  filtroSimpleName: string = '';
  // Orden y filtro
  filtros: any = {
    'operator': { value: '' },
    'batch_prefix': { value: '', op: 'LIKE', contiene: true },
    'person.human.uuid': { value: '', op: '!=', contiene: false },
    'person.human.firstname': { value: '', op: 'LIKE', contiene: true },
    'person.human.lastname': { value: '', op: 'LIKE', contiene: true },
    'person.human.cuit': { value: '', op: 'LIKE', contiene: true },
    'person.human.document_number': { value: '', op: 'LIKE', contiene: true },
    'person.legalEntity.uuid': { value: '', op: '!=', contiene: false },
    'person.legalEntity.company_name': { value: '', op: 'LIKE', contiene: true },
    'person.legalEntity.cuit': { value: '', op: 'LIKE', contiene: true },
  };
  ordenamiento: any = {

  };
  parametrosProvedores!: ParametrosIndex;

  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  showFilter: boolean = false;
  filtroSimple: boolean = false;
  busquedaPorNombreSimple: string = '';
  isSubmit = false;

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;
  iconArrowLeft = faArrowLeft;

  tab1: string = 'datos-generales';

  // Referencia al modal para crear y editar países.
  @ViewChild('modalProveedor') modalProveedor!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };
  tituloModal: string = '';

  // Catalogos
  paises: any[] = [];
  provincias: any[] = [];
  ciudades: any[] = [];
  generos: any[] = [];
  posiblesEstados: any[] = [];
  documentos: any[] = [];
  personas: any[] = [];
  cuentasBancarias: any[] = [];

  altaPersona: boolean = false;
  tipoPersonaForm!: FormGroup;

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

  inputCuitRef?: HTMLInputElement;
  uuidFromUrl: string = '';
  isLoadingProveedores: boolean = true;

  // Manejo de filtros activos.
  activeFilters: Array<{ key: string; label: string; display: string }> = [];

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _proveedoresService: ProveedoresService, private spinner: NgxSpinnerService, private tokenService: TokenService,
    private _catalogoService: CatalogoService, private route: ActivatedRoute, private location: Location, private router: Router) {
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
        // Aquí puedes ejecutar cualquier acción adicional al cierre
      });
      offcanvasElement.addEventListener('shown.bs.offcanvas', () => {
        this.setInputCuitRef();
      });
    }
  }

  // Este método agarra el input una vez que el offcanvas está abierto
  setInputCuitRef() {
    const input = document.getElementById('inputCuit') as HTMLInputElement;
    if (input) {
      this.inputCuitRef = input;
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
      const validTabs = ['datos-generales', 'datos-de-contacto', 'personas-de-contacto', 'cuentas-bancarias', 'compras'];
      if (tab && validTabs.includes(tab)) {
        this.tab1 = tab;
      } else {
        this.tab1 = 'datos-generales';
      }
    });
    this.spinner.show();
    this.inicializarForm();
    this.obtenerProveedores();
    this.obtenerCatalogos();
  }

  obtenerProveedores(alta: boolean = false) {
    // El booleano 'alta' es para que cuando da de alta un nuevo registro, no entre a inicializar, sino siempre muestra el primero de 
    // la lista y no el que acabo de agregar.

    this.parametrosProvedores = new ParametrosIndex();
    this.parametrosProvedores.with = ["person.city", "person.city.district", "person.city.district.country", "person.human", "person.human.gender", "person.human.documentType", "person.human.user", "person.legalEntity"];
    this.parametrosProvedores.page = this.currentPage;
    this.parametrosProvedores.paging = this.itemsPerPage;
    this.parametrosProvedores.order_by = this.ordenamiento;
    this.parametrosProvedores.filters = this.filtros;

    this.subscription.add(
      this._indexService.getProveedoresWithParam(this.parametrosProvedores, this.actual_role).subscribe({
        next: res => {
          this.proveedores = res.data;
          this.modificarPaginacion(res);
          this.tokenService.setToken(res.token);
          if (this.uuidFromUrl) {
            this.showProveedorByUuid(false);
          } else {
            this.isLoadingProveedores = false;
            if (this.proveedores.length === 0) {
              this.swalService.toastSuccess('center', 'No existen clientes.');
              this.isTabDisabled = true;
              this.tab1 = 'datos-generales';
              this.selectedProveedor = null;
            } else {
              this.isTabDisabled = false;
            }
            if (!alta && this.proveedores.length > 0) {
              this.isEdicion = false;
              const first = this.proveedores[0];
              this.uuidFromUrl = first.uuid;
              this.inicializarForm(first);
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

  showProveedorByUuid(updateTab: boolean = true) {
    this.subscription.add(
      this._proveedoresService.showProveedor(this.uuidFromUrl, this.actual_role).subscribe({
        next: res => {
          this.showDataProveedor(res.data, updateTab);
          this.tokenService.setToken(res.token);
          this.isLoadingProveedores = false;
        },
        error: error => {
          console.error(error);
        }
      })
    )
  }

  modificarPaginacion(res: any) {
    this.total_rows = res.meta.total;
    this.last_page = res.meta.last_page;
    if (this.proveedores.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  inicializarForm(proveedor?: any) {
    if (proveedor) {
      if (proveedor.person.uuid != this.selectedProveedor?.person.uuid) {
        // Esto es para no llamar cuando hace el show y tambien hacerlo al editar. 
        this.obtenerProvinciaCiudadProveedor(proveedor);
      }
      this.selectedProveedor = proveedor;
      this.isHuman = proveedor.person?.human ? true : false;
    }
    this.proveedorForm = new FormGroup({
      nombre: new FormControl({ value: proveedor?.person?.human?.firstname, disabled: true }, [Validators.required]),
      apellido: new FormControl({ value: proveedor?.person?.human?.lastname, disabled: true }, [Validators.required]),
      genero: new FormControl({ value: proveedor?.person?.human?.gender?.uuid, disabled: true }, [Validators.required]),
      documento: new FormControl({ value: proveedor?.person?.human?.document_number, disabled: true }, [Validators.required]),
      tipoDocumento: new FormControl({ value: proveedor?.person?.human?.document_type?.uuid, disabled: true }, [Validators.required]),
      cuit: new FormControl({ value: this.isHuman ? proveedor?.person?.human?.cuit : proveedor?.person?.legal_entity?.cuit, disabled: true }, [Validators.required]),
      razon: new FormControl({ value: proveedor?.person?.legal_entity?.company_name, disabled: true }, [Validators.required]),
      sigla: new FormControl({ value: proveedor?.batch_prefix, disabled: true }, [Validators.required]),
      estado: new FormControl({ value: proveedor?.person?.current_state?.state?.uuid, disabled: true }, []),
      estadoComentario: new FormControl({ value: proveedor?.person?.current_state?.comments, disabled: true }, []),
      comentarios: new FormControl({ value: proveedor?.comments, disabled: true }, []),
      calle: new FormControl({ value: proveedor?.person?.street_name, disabled: true }, []),
      numero: new FormControl({ value: proveedor?.person?.door_number, disabled: true }, []),
      detalleDireccion: new FormControl({ value: proveedor?.person?.address_detail, disabled: true }, []),
      pais: new FormControl({ value: proveedor?.person?.city?.district?.country?.uuid, disabled: true }, []),
      provincia: new FormControl({ value: proveedor?.person?.city?.district?.uuid, disabled: true }, []),
      ciudad: new FormControl({ value: proveedor?.person?.city?.uuid, disabled: true }, []),
      percepcionRG3337: new FormControl({ value: proveedor?.perception, disabled: true }, []),
      percepcionIIBB: new FormControl({ value: proveedor?.withholding, disabled: true }, []),
      percepcionIVA: new FormControl({ value: proveedor?.vat_percent, disabled: true }, []),
    });
    this.lastSelectedPaisUuid = proveedor?.person?.city?.district?.country?.uuid;
    this.lastSelectedProvinciaUuid = proveedor?.person?.city?.district?.uuid;

    this.onChangeEdicion();

  }

  obtenerProvinciaCiudadProveedor(proveedor: any) {
    if (proveedor.person?.city?.district?.country) {
      forkJoin({
        provincias: this._catalogoService.getProvinciasByCountry(proveedor.person?.city?.district?.country.uuid),
        ciudades: this._catalogoService.getCiudadesByProvincia(proveedor.person?.city?.district?.uuid),
      }).subscribe({
        next: res => {
          this.provincias = res.provincias.data.districts;
          this.ciudades = res.ciudades.data.cities;
        },
        error: error => {
          console.error('Error cargando catalogos para primer proveedor: ', error);
        }
      });
    }
  }

  onChangeEdicion() {
    this.proveedorForm.get('pais')!.valueChanges.subscribe(
      (uuid: string) => {
        // if ((uuid && uuid !== this.selectedProveedor.person.city.district.country.uuid) || (uuid && uuid !== this.lastSelectedPaisUuid)) {
        if ((uuid && uuid !== this.lastSelectedPaisUuid)) {

          this.lastSelectedPaisUuid = uuid;
          this._catalogoService.getProvinciasByCountry(uuid).subscribe({
            next: res => {
              this.proveedorForm.get('provincia')?.setValue(null);
              this.proveedorForm.get('provincia')?.enable();
              this.provincias = res.data.districts;
            },
            error: error => {
              this.swalService.toastError('center', 'Error al traer provincias del servidor.');
              console.error(error);
            }
          });
        } else if (!uuid) {
          this.lastSelectedPaisUuid = null;
          this.proveedorForm.get('provincia')?.setValue(null);
          this.proveedorForm.get('provincia')?.disable();
          this.proveedorForm.get('ciudad')?.setValue(null);
          this.proveedorForm.get('ciudad')?.disable();
          this.provincias = [];
          this.ciudades = [];
        }
      });

    this.proveedorForm.get('provincia')!.valueChanges.subscribe(
      (uuid: string) => {
        // if ((uuid && uuid !== this.selectedProveedor.person.city.district.uuid)) {
        if (uuid && uuid !== this.lastSelectedProvinciaUuid) {
          this.lastSelectedProvinciaUuid = uuid;
          this._catalogoService.getCiudadesByProvincia(uuid).subscribe({
            next: res => {
              this.proveedorForm.get('ciudad')?.setValue(null);
              this.proveedorForm.get('ciudad')?.enable();
              this.ciudades = res.data.cities;
            },
            error: error => {
              this.swalService.toastError('center', 'Error al traer provincias del servidor.');
              console.error(error);
            }
          });
        } else if (!uuid) {
          this.lastSelectedProvinciaUuid = null;
          this.proveedorForm.get('ciudad')?.setValue(null);
          this.proveedorForm.get('ciudad')?.disable();
          this.ciudades = [];
        }
      });

  }


  getName(proveedor: any) {
    if (proveedor.person?.human) {
      return proveedor.person.human.firstname + ' ' + proveedor.person.human.lastname
    } else if (proveedor.person?.legal_entity) {
      return proveedor.person.legal_entity.company_name
    } else {
      return ' ';
    }
  }

  showDataProveedor(proveedor: any, updateTab: boolean = true) {
    this.isEdicion = false;
    this.uuidFromUrl = proveedor.uuid;
    if (updateTab) {
      this.tab1 = 'datos-generales';
    }
    this.updateTabQueryParam(this.tab1, this.uuidFromUrl);
    this.inicializarForm(proveedor);
  }

  editarUsuario(proveedor: any) {
    this.tab1 = 'datos-generales';
    this.isEdicion = true;
    this.inicializarForm(proveedor);
    this.modificarValidacionesForm();
  }

  modificarValidacionesForm() {
    this.proveedorForm.get('nombre')?.enable();
    this.proveedorForm.get('apellido')?.enable();
    this.proveedorForm.get('genero')?.enable();
    this.proveedorForm.get('razon')?.enable();
    this.proveedorForm.get('sigla')?.enable();
    this.proveedorForm.get('estado')?.enable();
    this.proveedorForm.get('estadoComentario')?.enable();
    this.proveedorForm.get('comentarios')?.enable();
    this.proveedorForm.get('calle')?.enable();
    this.proveedorForm.get('numero')?.enable();
    this.proveedorForm.get('cuit')?.enable();
    this.proveedorForm.get('documento')?.enable();
    this.proveedorForm.get('tipoDocumento')?.enable();
    this.proveedorForm.get('detalleDireccion')?.enable();
    this.proveedorForm.get('pais')?.enable();
    this.proveedorForm.get('provincia')?.enable();
    this.proveedorForm.get('ciudad')?.enable();
    this.proveedorForm.get('percepcionRG3337')?.enable();
    this.proveedorForm.get('percepcionIIBB')?.enable();
    this.proveedorForm.get('percepcionIVA')?.enable();
    if (this.isHuman) {
      this.proveedorForm.get('nombre')?.setValidators([Validators.required]);
      this.proveedorForm.get('apellido')?.setValidators([Validators.required]);
      this.proveedorForm.get('genero')?.setValidators([Validators.required]);
      this.proveedorForm.get('tipoDocumento')?.setValidators([Validators.required]);
      this.proveedorForm.get('documento')?.setValidators([Validators.required]);
      this.proveedorForm.get('razon')?.clearValidators();
    } else {
      this.proveedorForm.get('razon')?.setValidators([Validators.required]);
      this.proveedorForm.get('nombre')?.clearValidators();
      this.proveedorForm.get('apellido')?.clearValidators();
      this.proveedorForm.get('genero')?.clearValidators();
      this.proveedorForm.get('tipoDocumento')?.clearValidators();
      this.proveedorForm.get('documento')?.clearValidators();
    }
    ['nombre', 'apellido', 'genero', 'tipoDocumento', 'documento', 'razon'].forEach((field) => {
      this.proveedorForm.get(field)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  cancelarEdicion() {
    this.isEdicion = false;
    this.inicializarForm(this.selectedProveedor);
  }

  confirmarEdicion() {
    if (this.proveedorForm.valid) {
      this.spinner.show();
      let proveedor = new ProveedorDTO();
      this.armarDTOEdicion(proveedor);
      this.subscription.add(
        this._proveedoresService.editProveedor(this.selectedProveedor.uuid, proveedor).subscribe({
          next: res => {
            this.proveedores = [...this.proveedores.map(p =>
              p.uuid === res.data.uuid ? res.data : p
            )];
            // this.proveedoresFiltrados = this.proveedores;
            this.inicializarForm(res.data);
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
    proveedor.actual_role = this.actual_role;
    proveedor.with = ["person.city", "person.city.district", "person.city.district.country", "person.human", "person.human.gender",
      "person.human.documentType", "person.legalEntity"];
    proveedor.batch_prefix = this.proveedorForm.get('sigla')?.value;
    proveedor.comments = this.proveedorForm.get('comentarios')?.value;
    proveedor.perception = !!this.proveedorForm.get('percepcionRG3337')?.value;
    proveedor.vat_percent = this.proveedorForm.get('percepcionIVA')?.value;
    proveedor.withholding = !!this.proveedorForm.get('percepcionIIBB')?.value;
    let person = new Person();
    person.street_name = this.proveedorForm.get('calle')?.value;
    person.door_number = this.proveedorForm.get('numero')?.value;
    person.address_detail = this.proveedorForm.get('detalleDireccion')?.value;
    person.city_uuid = this.proveedorForm.get('ciudad')?.value;
    person.possible_person_state_uuid = this.proveedorForm.get('estado')?.value;
    person.state_comments = this.proveedorForm.get('estadoComentario')?.value;
    if (this.isHuman) {
      let human = new Human();
      human.firstname = this.proveedorForm.get('nombre')?.value;
      human.lastname = this.proveedorForm.get('apellido')?.value;
      human.document_type_uuid = this.proveedorForm.get('tipoDocumento')?.value;
      human.document_number = this.proveedorForm.get('documento')?.value;
      human.cuit = this.proveedorForm.get('cuit')?.value;
      human.gender_uuid = this.proveedorForm.get('genero')?.value;
      person.human = human;
    } else {
      let legal_entity = new LegalEntity();
      legal_entity.cuit = this.proveedorForm.get('cuit')?.value;
      legal_entity.company_name = this.proveedorForm.get('razon')?.value;
      person.legal_entity = legal_entity;
    }
    proveedor.person = person;
  }

  openSwalEliminar(proveedor: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el proveedor ${this.getName(proveedor)}?`,
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
        this.eliminarProveedor(proveedor);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarProveedor(proveedor: any) {
    this.spinner.show();
    this.subscription.add(
      this._proveedoresService.eliminarProveedor(proveedor.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          if (this.uuidFromUrl === proveedor.uuid) {
            // Se blanquea para que si elimina en el que está parado no tire error al recargar, ya que no existe el uuid.
            this.uuidFromUrl = '';
          }
          this.obtenerProveedores();
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
    this.altaPersona = false;
    this.modalProveedor.close();
  }

  openModalNuevoProveedor() {
    this.tituloModal = 'Nuevo proveedor';
    this.tipoPersonaForm = new FormGroup({
      tipoPersona: new FormControl('fisica', Validators.required),
    });
    this.obtenerPersonas();
    this.onChangePersona();
    this.modalProveedor.options = this.modalOptions;
    this.modalProveedor.open();
  }

  onChangePersona() {
    this.tipoPersonaForm.get('tipoPersona')!.valueChanges.subscribe(
      (tipo: string) => {
        this.obtenerPersonas();
        if (this.newProveedorForm) {
          this.modificarValidacionesNuevoProveedor(tipo);
        }
      });
  }

  inicializarNuevoFormularioProveedor(dato?: any) {
    this.newProveedorForm = new FormGroup({
      nombre: new FormControl(dato ? dato.firstname : null, (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') ? [Validators.required] : []),
      apellido: new FormControl(dato ? dato.lastname : null, (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') ? [Validators.required] : []),
      tipoDocumento: new FormControl(dato ? dato.document_type?.uuid : null, (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') ? [Validators.required] : []),
      documento: new FormControl(dato ? dato.document_number : null, (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') ? [Validators.required] : []),
      cuit: new FormControl(dato ? dato.cuit : null, [Validators.required]),
      genero: new FormControl(dato ? dato.gender?.uuid : null, (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') ? [Validators.required] : []),
      razon: new FormControl(dato ? dato.company_name : null, (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') ? [] : [Validators.required]),
      sigla: new FormControl(null, [Validators.required]),
      estado: new FormControl(dato ? dato.person?.current_state?.state?.uuid : null, [Validators.required]),
      estadoComentario: new FormControl(dato ? dato.person?.current_state?.comments : null, []),
      calle: new FormControl(dato ? dato.person?.street_name : null, []),
      numero: new FormControl(dato ? dato.person?.door_number : null, []),
      detalleDireccion: new FormControl(dato ? dato.person?.address_detail : null, []),
      comentarios: new FormControl(null, []),
      pais: new FormControl(dato ? dato.person?.city?.district?.country?.uuid : null, []),
      provincia: new FormControl(dato ? dato.person?.city?.district?.uuid : null, []),
      ciudad: new FormControl(dato ? dato.person?.city?.uuid : null, []),
      percepcionRG3337: new FormControl(null, []),
      percepcionIIBB: new FormControl(null, []),
      percepcionIVA: new FormControl(0, []),
    });
    if (!dato) {
      this.provincias = [];
      this.ciudades = [];
    }
    this.onChange();
  }

  onChange() {
    this.newProveedorForm.get('pais')!.valueChanges.subscribe(
      (uuid: string) => {
        this._catalogoService.getProvinciasByCountry(uuid).subscribe({
          next: res => {
            this.newProveedorForm.get('provincia')?.setValue(null);
            this.provincias = res.data.districts;
          },
          error: error => {
            this.swalService.toastError('center', 'Error al traer provincias del servidor.');
            console.error(error);
          }
        });
      });

    this.newProveedorForm.get('provincia')!.valueChanges.subscribe(
      (uuid: string) => {
        if (uuid) {
          this._catalogoService.getCiudadesByProvincia(uuid).subscribe({
            next: res => {
              this.newProveedorForm.get('ciudad')?.setValue(null);
              this.ciudades = res.data.cities;
            },
            error: error => {
              this.swalService.toastError('center', 'Error al traer ciudades del servidor.');
              console.error(error);
            }
          });
        }
      });
  }

  modificarValidacionesNuevoProveedor(tipo: string) {
    if (tipo === 'fisica') {
      this.newProveedorForm.get('nombre')?.setValidators([Validators.required]);
      this.newProveedorForm.get('apellido')?.setValidators([Validators.required]);
      this.newProveedorForm.get('genero')?.setValidators([Validators.required]);
      this.newProveedorForm.get('documento')?.setValidators([Validators.required]);
      this.newProveedorForm.get('tipoDocumento')?.setValidators([Validators.required]);
      this.newProveedorForm.get('razon')?.clearValidators();
    } else {
      this.newProveedorForm.get('razon')?.setValidators([Validators.required]);
      this.newProveedorForm.get('nombre')?.clearValidators();
      this.newProveedorForm.get('apellido')?.clearValidators();
      this.newProveedorForm.get('genero')?.clearValidators();
      this.newProveedorForm.get('documento')?.clearValidators();
      this.newProveedorForm.get('tipoDocumento')?.clearValidators();
    }

    ['nombre', 'apellido', 'genero', 'documento', 'tipoDocumento', 'razon'].forEach((field) => {
      this.newProveedorForm.get(field)?.updateValueAndValidity({ emitEvent: false });
    });
  }


  obtenerCatalogos() {
    forkJoin({
      generos: this._catalogoService.getGeneros(),
      paises: this._catalogoService.getPaises(),
      documentos: this._catalogoService.getDocumentos(),
      posiblesEstados: this._catalogoService.getPosiblesEstados(this.actual_role)
    }).subscribe({
      next: res => {
        this.generos = res.generos.data;
        this.paises = res.paises.data;
        this.documentos = res.documentos.data;
        this.posiblesEstados = res.posiblesEstados.data;
      },
      error: error => {
        console.error('Error cargando catalogos:', error);
      }
    });
  }

  confirmarNuevoProveedor() {
    this.isSubmit = true;
    if (this.newProveedorForm.valid) {
      this.spinner.show();
      let proveedor = new ProveedorDTO();
      this.armarDtoNuevoProveedor(proveedor);
      this.subscription.add(
        this._proveedoresService.saveProveedor(proveedor).subscribe({
          next: res => {
            this.spinner.hide();
            this.obtenerProveedores(true);
            this.cerrarModal();
            this.showDataProveedor(res.data);
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
    proveedor.batch_prefix = this.newProveedorForm.get('sigla')?.value;
    proveedor.comments = this.newProveedorForm.get('comentarios')?.value;
    proveedor.perception = !!this.newProveedorForm.get('percepcionRG3337')?.value;
    proveedor.vat_percent = this.newProveedorForm.get('percepcionIVA')?.value;
    proveedor.withholding = !!this.newProveedorForm.get('percepcionIIBB')?.value;
    let person = new Person();
    person.street_name = this.newProveedorForm.get('calle')?.value;
    person.door_number = this.newProveedorForm.get('numero')?.value;
    person.address_detail = this.newProveedorForm.get('detalleDireccion')?.value;
    person.city_uuid = this.newProveedorForm.get('ciudad')?.value;
    person.possible_person_state_uuid = this.newProveedorForm.get('estado')?.value;
    person.state_comments = this.newProveedorForm.get('estadoComentario')?.value;
    if (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') {
      let human = new Human();
      human.firstname = this.newProveedorForm.get('nombre')?.value;
      human.lastname = this.newProveedorForm.get('apellido')?.value;
      human.document_type_uuid = this.newProveedorForm.get('tipoDocumento')?.value;
      human.document_number = this.newProveedorForm.get('documento')?.value;
      human.cuit = this.newProveedorForm.get('cuit')?.value;
      human.gender_uuid = this.newProveedorForm.get('genero')?.value;
      person.human = human;
    } else {
      let legal_entity = new LegalEntity();
      legal_entity.cuit = this.newProveedorForm.get('cuit')?.value;
      legal_entity.company_name = this.newProveedorForm.get('razon')?.value;
      person.legal_entity = legal_entity;
    }
    proveedor.person = person;
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
    this.filtroTipoPersona = 'todos';
    this.filtros['person.human.uuid'].value = '';
    this.filtros['person.human.firstname'].value = '';
    this.filtros['person.human.lastname'].value = '';
    this.filtros['person.human.document_number'].value = '';
    this.filtros['person.legalEntity.uuid'].value = '';
    this.filtros['person.legalEntity.company_name'].value = '';
    this.filtros['person.legalEntity.cuit'].value = '';
    this.filtros['batch_prefix'].value = '';
    this.filtros.operator.value = '';
    if (this.inputCuitRef) {
      this.inputCuitRef.value = '';
    }
    this.activeFilters = [];
    this.obtenerProveedores();
  }

  changeTipoPersona() {
    this.filtroSimpleName = '';
    if (this.inputCuitRef) {
      this.inputCuitRef.value = '';
    }
    this.filtros['batch_prefix'].value = '';
    this.filtros['person.human.firstname'].value = '';
    this.filtros['person.human.lastname'].value = '';
    this.filtros['person.human.cuit'].value = '';
    this.filtros['person.human.document_number'].value = '';
    this.filtros['person.legalEntity.company_name'].value = '';
    this.filtros['person.legalEntity.cuit'].value = '';
    this.filtros.operator.value = '';
    if (this.filtroTipoPersona === 'todos') {
      this.filtros['person.human.uuid'].value = '';
      this.filtros['person.legalEntity.uuid'].value = '';
    } else if (this.filtroTipoPersona === 'fisica') {
      this.filtros['person.human.uuid'].value = 'null';
      this.filtros['person.legalEntity.uuid'].value = '';
    } else {
      //jurídica
      this.filtros['person.legalEntity.uuid'].value = 'null';
      this.filtros['person.human.uuid'].value = '';
    }
    this.obtenerProveedores();
  }

  volver() {
    this.altaPersona = false;
    // this.contactoForm.reset();
  }

  obtenerPersonas() {
    this.spinner.show();
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    if (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') {
      params.with = ["person", "person.city", "person.city.district", "person.city.district.country", "person.personStates", "gender", "documentType", "person.supplier", "person.customer"];
    } else {
      params.with = ["person", "person.city", "person.city.district", "person.city.district.country", "person.personStates"];
    }
    params.paging = this.itemsPerPage_buscar;
    params.page = this.currentPage_buscar;
    params.order_by = this.ordenamiento_buscar;
    params.filters = this.filtrosContactos_buscar;

    if (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') {
      this.subscription.add(
        this._indexService.getHumansWithParam(params, this.actual_role).subscribe({
          next: res => {
            this.personas = res.data;
            this.modificarPaginacionBusqueda(res);
            this.spinner.hide();
          },
          error: error => {
            console.error(error);
            this.spinner.hide();
          }
        })
      )
    } else {
      this.subscription.add(
        this._indexService.getLegalEntitiesWithParam(params, this.actual_role).subscribe({
          next: res => {
            this.personas = res.data;
            this.modificarPaginacionBusqueda(res);
            this.spinner.hide();
          },
          error: error => {
            console.error(error);
            this.spinner.hide();
          }
        })
      )
    }
  }

  modificarPaginacionBusqueda(res: any) {
    this.total_rows_buscar = res.meta.total;
    this.last_page_buscar = res.meta.last_page;
    if (this.personas.length <= this.itemsPerPage_buscar) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage_buscar = this.total_rows_buscar;
      } else {
        this.itemsInPage_buscar = this.currentPage_buscar * this.itemsPerPage_buscar;
      }
    }
  }

  altaNuevoProveedor() {
    this.altaPersona = true;
    this.inicializarNuevoFormularioProveedor();
  }

  toggleFilter() {
    this.showFilterPersonas = !this.showFilterPersonas;
    if (!this.showFilterPersonas) {
      this.filtrosContactos_buscar.firstname = { value: '', op: 'LIKE', contiene: true };
      this.filtrosContactos_buscar.lastname = { value: '', op: 'LIKE', contiene: true };
      this.filtrosContactos_buscar.company_name = { value: '', op: 'LIKE', contiene: true };
      this.filtrosContactos_buscar.document_number = { value: '', op: 'LIKE', contiene: true };
      this.filtrosContactos_buscar.cuit = { value: '', op: 'LIKE', contiene: true };
      this.obtenerPersonas();
    }
  }

  agregarProveedorAFormulario(dato: any) {
    if (!this.isProveedor(dato)) {
      this.inicializarNuevoFormularioProveedor(dato);
      this.altaPersona = true; // Muestra formulario
    } else {
      this.swalService.toastError('top-right', 'La persona ya es proveedor');
    }
  }

  isProveedor(data: any) {
    return data.person?.supplier ? true : false;
  }

  isCliente(data: any) {
    return data.person?.customer ? true : false;
  }

  getDropdownClass(index: number) {
    let mitad = this.proveedores.length / 2;
    return index < mitad ? 'ltr:right-0 rtl:left-0' : 'bottom-full !mt-0 mb-1 whitespace-nowrap ltr:right-0 rtl:left-0';
  }

  obtenerProveedoresPorFiltroSimple() {
    this.filtroTipoPersona = 'todos';
    this.filtros['batch_prefix'].value = '';
    this.filtros['person.human.uuid'].value = '';
    this.filtros['person.human.firstname'].value = '';
    this.filtros['person.human.lastname'].value = '';
    this.filtros['person.human.document_number'].value = '';
    this.filtros['person.legalEntity.uuid'].value = '';
    this.filtros['person.legalEntity.cuit'].value = '';

    if (this.filtroSimpleName) {
      this.filtros['person.human.firstname'].value = this.filtroSimpleName;
      this.filtros['person.human.lastname'].value = this.filtroSimpleName;
      this.filtros['person.legalEntity.company_name'].value = this.filtroSimpleName;
      this.filtros.operator.value = 'OR';
    } else {
      this.filtros['person.human.firstname'].value = '';
      this.filtros['person.human.lastname'].value = '';
      this.filtros['person.legalEntity.company_name'].value = '';
      this.filtros.operator.value = '';
    }
    this.obtenerProveedores();
  }

  obtenerProveedoresPorFiltroAvanzado() {
    this.filtroSimpleName = '';
    if (this.filtroTipoPersona === 'todos') {
      if (this.filtros['person.legalEntity.cuit'].value) { // Si buscó por cuit y es todos se asigna el OR
        this.filtros['person.human.cuit'].value = this.filtros['person.legalEntity.cuit'].value;
        this.filtros.operator.value = 'OR';
      }
    } else if (this.filtroTipoPersona === 'fisica') {
      this.filtros['person.human.cuit'].value = this.filtros['person.legalEntity.cuit'].value;
      this.filtros['person.legalEntity.cuit'].value = '';
      this.filtros.operator.value = '';
    } else {
      // Nada porque es jurídica y ya se le asigna al cuit de la entidad legal.
      this.filtros.operator.value = '';
    } this.obtenerProveedores();
  }

  updateTabQueryParam(tab: string, uuid: string) {
    if (!uuid) return;
    const mergedQueryParams = {
      ...this.route.snapshot.queryParams,
      tab
    };
    const tree = this.router.createUrlTree(
      ['/dashboard/proveedores', uuid],
      { queryParams: mergedQueryParams }
    );
    const url = this.router.serializeUrl(tree);
    this.location.replaceState(url);
  }

  cambiarTab(tab: string) {
    this.cancelarEdicion();
    this.tab1 = tab;
    this.updateTabQueryParam(this.tab1, this.uuidFromUrl);
  }


  buildActiveFilters(): void {
    const list: Array<{ key: string; label: string; display: string }> = [];

    const pushIf = (key: string, label: string, value: any, extra: string = '') => {
      if (value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)) {
        list.push({ key, label, display: `${value}${extra}` });
      }
    };

    if (this.filtroTipoPersona && this.filtroTipoPersona !== 'todos') {
      pushIf(
        '__tipo_persona__',
        'Tipo de persona',
        this.filtroTipoPersona
      );
    }

    pushIf('person.human.firstname', 'Nombre', this.filtros['person.human.firstname'].value);
    pushIf('person.human.lastname', 'Apellido', this.filtros['person.human.lastname'].value);
    pushIf('person.human.document_number', 'Documento', this.filtros['person.human.document_number'].value);
    if (this.filtroTipoPersona && this.filtroTipoPersona !== 'fisica') {
      pushIf('person.legalEntity.cuit', 'Cuit', this.filtros['person.legalEntity.cuit'].value);
    } else {
      pushIf('person.human.cuit', 'Cuit', this.filtros['person.human.cuit'].value);
    }
    pushIf('person.legalEntity.company_name', 'Razón social', this.filtros['person.legalEntity.company_name'].value);
    pushIf('batch_prefix', 'Sigla', this.filtros['batch_prefix'].value);

    this.activeFilters = list;
  }

  clearFilter(key: string): void {
    switch (key) {
      case 'person.human.firstname':
        this.filtros[key].value = '';
        this.filtros[key].contiene = true;
        break;
      case 'person.human.lastname':
        this.filtros[key].value = '';
        this.filtros[key].contiene = true;
        break;
      case 'person.human.document_number':
        this.filtros[key].value = '';
        this.filtros[key].contiene = true;
        break;
      case 'person.legalEntity.company_name':
        this.filtros[key].value = '';
        this.filtros[key].contiene = true;
        break;
      case 'person.legalEntity.cuit':
        this.filtros[key].value = '';
        this.filtros['person.human.cuit'].value = '';
        this.filtros[key].contiene = true;
        break;
      case '__tipo_persona__':
        this.filtroTipoPersona = 'todos';
        this.filtros['person.human.uuid'].value = ''
        this.filtros['person.legalEntity.uuid'].value = ''
        break;
      case 'batch_prefix':
        this.filtros[key].value = ''
        break;
    }

    this.buildActiveFilters();
    this.obtenerProveedoresPorFiltroAvanzado();
  }

}
