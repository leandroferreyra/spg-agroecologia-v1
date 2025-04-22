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
import { NgbPagination, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent, IconTrashLinesComponent, NgxCustomModalComponent, NgxSpinnerModule,
    NgSelectModule, IconHorizontalDotsComponent, MenuModule, FontAwesomeModule, CuentasBancariasComponent, ComprasProveedorComponent,
    ContactosComponent, ContactosPersonaComponent, IconSettingsComponent, NgbPaginationModule
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
  proveedoresFiltrados: any[] = [];
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
        // Aquí puedes ejecutar cualquier acción adicional al cierre
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.spinner.show();
    this.inicializarForm();
    this.obtenerProveedores();
    this.obtenerCatalogos();
  }

  obtenerProveedores(alta: boolean = false) {
    // El booleano 'alta' es para que cuando da de alta un nuevo registro, no entre a inicializar, sino siempre muestra el primero de 
    // la lista y no el que acabo de agregar.
    this.subscription.add(
      this._indexService.getProveedores(this.actual_role).subscribe({
        next: res => {
          this.proveedores = res.data;
          this.proveedoresFiltrados = this.proveedores;
          if (!alta && this.proveedores.length > 0) {
            this.inicializarForm(this.proveedores[0]);
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

  showDataProveedor(proveedor: any) {
    this.isEdicion = false;
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
            this.proveedoresFiltrados = this.proveedores;
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

  filtroSimpleInput() {
    // Si ingresa acá es porque busca por búsqueda simple, por lo que se desactivas los filtros.
    this.filtroSimple = true;
    this.limpiarFiltros();
  }

  filtrarDatos() {
    let resultados = this.proveedoresFiltrados;

    if (this.filtroSimple) {
      // Escribió en el input simple
      resultados = this.proveedoresFiltrados.filter(dato => {
        let nombreCompleto;
        if (dato.person?.human) {
          nombreCompleto = (dato.person?.human?.firstname + ' ' + dato.person?.human?.lastname).toLocaleLowerCase();
        } else {
          nombreCompleto = dato.person?.legal_entity?.company_name.toLocaleLowerCase();
        }
        if (this.busqueda_contiene) {
          return nombreCompleto.includes(this.busquedaPorNombreSimple.toLowerCase());
        } else {
          return nombreCompleto.startsWith(this.busquedaPorNombreSimple.toLowerCase());
        }
      })
    } else if (this.showFilter) {
      // Es búsqueda avanzada
      if (this.filtros.tipoPersona === 'fisica') {
        resultados = this.proveedoresFiltrados.filter(dato => {
          return dato.person?.human
        })

      } else if (this.filtros.tipoPersona === 'juridica') {
        resultados = this.proveedoresFiltrados.filter(dato => {
          return dato.person?.legal_entity
        })
      } else {
        // todos
        resultados = this.proveedores;
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

    if (resultados.length === 0) {
      this.isTabDisabled = true;
      this.tab1 = 'datos-generales';
    } else {
      this.isTabDisabled = false;
    }
    return resultados;
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
    let mitad = this.proveedoresFiltrados.length / 2;
    return index < mitad ? 'ltr:right-0 rtl:left-0' : 'bottom-full !mt-0 mb-1 whitespace-nowrap ltr:right-0 rtl:left-0';
  }

}
