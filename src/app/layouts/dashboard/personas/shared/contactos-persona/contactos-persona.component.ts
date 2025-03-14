import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { ContactoPersonaDTO } from 'src/app/core/models/request/contactoPersonaDTO';
import { HumanDTO } from 'src/app/core/models/request/humanDTO';
import { LegalEntityDTO } from 'src/app/core/models/request/legalEntityDTO';
import { Human } from 'src/app/core/models/request/proveedorDTO';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { DatosContactoService } from 'src/app/core/services/datosContactos.service';
import { DatosContactoPersonaService } from 'src/app/core/services/datosContactosPersonas.service';
import { HumanService } from 'src/app/core/services/human.service';
import { IndexService } from 'src/app/core/services/index.service';
import { LegalEntityService } from 'src/app/core/services/legalentity.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contactos-persona',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgxSpinnerModule, NgxTippyModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule,
    NgSelectModule, IconTrashLinesComponent, IconPencilComponent, IconSearchComponent, IconPlusComponent, RouterOutlet,
    FontAwesomeModule],
  templateUrl: './contactos-persona.component.html',
  styleUrl: './contactos-persona.component.css'
})
export class ContactosPersonaComponent implements OnInit, OnDestroy {

  altaPersona: boolean = false;

  @Input() persona: any;
  @Input() rol!: string;
  @Input() generos!: string[];
  @Input() paises!: string[];
  @Input() documentos!: string[];
  provincias: string[] = [];
  ciudades: string[] = [];

  contactos: any[] = [];
  personas: any[] = [];

  private subscription: Subscription = new Subscription();

  // Orden, filtro y paginación para personas de contacto de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;
  filtrosContactos: any = {
    'person_uuid': { value: '', op: '=', contiene: false }
  };
  ordenamiento: any = {

  };

  // Orden, filtro y paginación para buscar personas de contacto de proveedor
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


  // Referencia al modal para crear y editar países.
  @ViewChild('modalContacto') modalContacto!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  contactoForm!: FormGroup;
  tipoPersonaForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;
  iconArrowLeft = faArrowLeft;

  constructor(private _indexService: IndexService, private _swalService: SwalService, private spinner: NgxSpinnerService,
    private legalentityService: LegalEntityService, private _personaContactoService: DatosContactoPersonaService,
    private _tokenService: TokenService, private _catalogoService: CatalogoService, private _router: Router,
    private humanService: HumanService) {

  }
  ngOnInit(): void {

  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['persona'] && changes['persona'].currentValue) {
      this.spinner.show();
      // Si el supplierUuid cambia, actualizamos los filtros y obtenemos las cuentas
      this.filtrosContactos['person_uuid'].value = this.persona.person?.uuid;
      this.obtenerContactos();
    }
  }

  cerrarModal() {
    this.modalContacto.close();
    if (this.contactoForm) {
      this.contactoForm.reset();
    }
    this.isSubmit = false;
    this.altaPersona = false;
  }

  confirmarContacto() {
    this.isSubmit = true;
    if (this.contactoForm.valid) {
      this.spinner.show();
      if (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') {
        // FISICA
        let contacto = new HumanDTO();
        contacto.actual_role = this.rol;
        contacto.with = ["person"];
        contacto.address_detail = this.contactoForm.get('address_detail')?.value;
        contacto.street_name = this.contactoForm.get('street_name')?.value;
        contacto.door_number = this.contactoForm.get('door_number')?.value;
        contacto.city_uuid = this.contactoForm.get('city_uuid')?.value;
        contacto.cuit = this.contactoForm.get('cuit')?.value;
        contacto.document_number = this.contactoForm.get('document_number')?.value;
        contacto.document_type_uuid = this.contactoForm.get('document_type_uuid')?.value;
        contacto.firstname = this.contactoForm.get('firstname')?.value;
        contacto.lastname = this.contactoForm.get('lastname')?.value;
        contacto.gender_uuid = this.contactoForm.get('gender_uuid')?.value;
        this.cleanObject(contacto);
        this.saveHuman(contacto);
      } else {
        // JURIDICA
        let contacto = new LegalEntityDTO();
        contacto.actual_role = this.rol;
        contacto.with = ["person"];
        contacto.address_detail = this.contactoForm.get('address_detail')?.value;
        contacto.street_name = this.contactoForm.get('street_name')?.value;
        contacto.door_number = this.contactoForm.get('door_number')?.value;
        contacto.city_uuid = this.contactoForm.get('city_uuid')?.value;
        contacto.cuit = this.contactoForm.get('cuit')?.value;
        contacto.company_name = this.contactoForm.get('company_name')?.value;
        this.cleanObject(contacto);
        this.saveLegalEntiy(contacto);
      }
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

  saveHuman(contacto: HumanDTO) {
    console.log(contacto);
    this.subscription.add(
      this.humanService.saveHuman(contacto).subscribe({
        next: res => {
          this.procesarRespuesta(res);
        },
        error: error => {
          this.spinner.hide();
          this._swalService.toastError('top-right', error.error.message);
          console.error(error);
        }
      })
    );
  }

  saveLegalEntiy(contacto: LegalEntityDTO) {
    this.subscription.add(
      this.legalentityService.saveLegalEntity(contacto).subscribe({
        next: res => {
          this.spinner.hide();
          this.procesarRespuesta(res);
        },
        error: error => {
          this.spinner.hide();
          this._swalService.toastError('top-right', error.error.message);
          console.error(error);
        }
      })
    );
  }

  procesarRespuesta(res: any) {
    console.log(res);
    this.cerrarModal();
    this._tokenService.setToken(res.token);
    // this.obtenerPersonas();
    //Acá hay que guardar el contacto.  
    // chequear si se puede usar el mismo método  agregarPersonaDeContacto
    this.agregarPersonaDeContacto(res.data);
  }

  obtenerContactos() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["person", "person.human", "person.legalEntity", "contact.human", "contact.legalEntity"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtrosContactos;
    this.subscription.add(
      this._indexService.getDetalleContactosPersonaWithParam(params, this.rol).subscribe({
        next: res => {
          this.contactos = res.data;
          this.modificarPaginacion(res);
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
    if (this.contactos.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
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


  openModalContacto(type: string, dato?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nueva persona de contacto';
      this.tipoPersonaForm = new FormGroup({
        tipoPersona: new FormControl('fisica', Validators.required),
      });
      this.obtenerPersonas();
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición dato';
    }
    this.modalContacto.options = this.modalOptions;
    this.modalContacto.open();
    this.onChanges();
  }

  onChanges() {
    this.tipoPersonaForm.get('tipoPersona')!.valueChanges.subscribe(
      (tipo: string) => {
        this.obtenerPersonas();
        if (this.contactoForm) {
          if (tipo === 'fisica') {
            this.contactoForm.get('firstname')?.setValidators([Validators.required]);
            this.contactoForm.get('lastname')?.setValidators([Validators.required]);
            this.contactoForm.get('document_number')?.setValidators([Validators.required]);
            this.contactoForm.get('document_type_uuid')?.setValidators([Validators.required]);
            this.contactoForm.get('company_name')?.clearValidators();
          } else {
            this.contactoForm.get('company_name')?.setValidators([Validators.required]);
            this.contactoForm.get('firstname')?.clearValidators();
            this.contactoForm.get('lastname')?.clearValidators();
            this.contactoForm.get('document_number')?.clearValidators();
            this.contactoForm.get('document_type_uuid')?.clearValidators();
          }
          ['firstname', 'lastname', 'document_number', 'document_type_uuid', 'company_name'].forEach((field) => {
            this.contactoForm.get(field)?.updateValueAndValidity({ emitEvent: false });
          });
        }
      });
  }




  obtenerPersonas() {
    this.spinner.show();
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["person"];
    params.paging = this.itemsPerPage_buscar;
    params.page = this.currentPage_buscar;
    params.order_by = this.ordenamiento_buscar;
    params.filters = this.filtrosContactos_buscar;

    if (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') {
      this.subscription.add(
        this._indexService.getHumansWithParam(params, this.rol).subscribe({
          next: res => {
            // console.log(res);
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
        this._indexService.getLegalEntitiesWithParam(params, this.rol).subscribe({
          next: res => {
            // console.log(res);
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

  openSwalEliminar(dato: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el contacto ${this.showName(dato)} ?`,
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
        this.eliminarDato(dato);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarDato(contacto: any) {
    this.spinner.show();
    this.subscription.add(
      this._personaContactoService.deleteContacto(contacto.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerContactos();
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

  showName(dato: any) {
    if (dato.contact?.human) {
      return dato.contact?.human.firstname + ' ' + dato.contact?.human.lastname
    } else if (dato.contact?.legal_entity) {
      return dato.contact?.legal_entity?.company_name
    } else {
      return ' ';
    }
  }

  showCuit(data: any) {
    if (data.contact?.human) {
      return data.contact?.human?.cuit;
    } else {
      return data.contact?.legal_entity?.cuit;
    }
  }

  agregarPersonaDeContacto(dato: any) {
    this.spinner.show();
    let contactoPersonaDTO = new ContactoPersonaDTO();
    contactoPersonaDTO.actual_role = this.rol;
    contactoPersonaDTO.person_uuid = this.persona.person?.uuid;
    contactoPersonaDTO['person->contact_uuid'] = dato.person.uuid;
    console.log(contactoPersonaDTO);
    this.subscription.add(
      this._personaContactoService.saveContactoPersona(contactoPersonaDTO).subscribe({
        next: res => {
          this._tokenService.setToken(res.token);
          this.cerrarModal();
          this.obtenerContactos();
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          this._swalService.toastError('top-right', error.error.message);
          console.error(error);
        }
      })
    );
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

  volver() {
    this.altaPersona = false;
    this.contactoForm.reset();
  }

  altaNuevaPersona() {
    this.altaPersona = true;
    this.contactoForm = new FormGroup({
      street_name: new FormControl(null, []),
      door_number: new FormControl(null, []),
      address_detail: new FormControl(null, []),
      pais: new FormControl(null, []),
      provincia: new FormControl({ value: null, disabled: true }, []),
      city_uuid: new FormControl({ value: null, disabled: true }, []),
      lastname: new FormControl(null, (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') ? [Validators.required] : []),
      firstname: new FormControl(null, (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') ? [Validators.required] : []),
      document_type_uuid: new FormControl(null, (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') ? [Validators.required] : []),
      document_number: new FormControl(null, (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') ? [Validators.required] : []),
      cuit: new FormControl(null, (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') ? [Validators.required] : []),
      gender_uuid: new FormControl(null, []),
      company_name: new FormControl(null, (this.tipoPersonaForm.get('tipoPersona')?.value === 'fisica') ? [] : [Validators.required])
    });
    this.onChange();
  }

  onChange() {
    this.contactoForm.get('pais')!.valueChanges.subscribe(
      (uuid: string) => {
        // if ((uuid && uuid !== this.selectedProveedor.person.city.district.country.uuid) || (uuid && uuid !== this.lastSelectedPaisUuid)) {
        if ((uuid)) {
          this._catalogoService.getProvinciasByCountry(uuid).subscribe({
            next: res => {
              this.contactoForm.get('provincia')?.setValue(null);
              this.contactoForm.get('provincia')?.enable();
              this.provincias = res.data.districts;
            },
            error: error => {
              this._swalService.toastError('center', 'Error al traer provincias del servidor.');
              console.error(error);
            }
          });
        } else {
          this.contactoForm.get('provincia')?.setValue(null);
          this.contactoForm.get('provincia')?.disable();
          this.contactoForm.get('city_uuid')?.setValue(null);
          this.contactoForm.get('city_uuid')?.disable();
          this.provincias = [];
          this.ciudades = [];
        }
      });

    this.contactoForm.get('provincia')!.valueChanges.subscribe(
      (uuid: string) => {
        // if ((uuid && uuid !== this.selectedProveedor.person.city.district.uuid)) {
        if (uuid) {
          this._catalogoService.getCiudadesByProvincia(uuid).subscribe({
            next: res => {
              this.contactoForm.get('city_uuid')?.setValue(null);
              this.contactoForm.get('city_uuid')?.enable();
              this.ciudades = res.data.cities;
            },
            error: error => {
              this._swalService.toastError('center', 'Error al traer provincias del servidor.');
              console.error(error);
            }
          });
        } else {
          this.contactoForm.get('city_uuid')?.setValue(null);
          this.contactoForm.get('city_uuid')?.disable();
          this.ciudades = [];
        }
      });

  }

}
