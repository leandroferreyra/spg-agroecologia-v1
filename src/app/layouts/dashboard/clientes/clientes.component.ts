import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { MenuModule } from 'headlessui-angular';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription, forkJoin } from 'rxjs';
import { ClienteDTO, Human, LegalEntity, Person } from 'src/app/core/models/request/clienteDTO';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { ClientesService } from 'src/app/core/services/clientes.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconEditComponent } from 'src/app/shared/icon/icon-edit';
import { IconHorizontalDotsComponent } from 'src/app/shared/icon/icon-horizontal-dots';
import { IconMenuComponent } from 'src/app/shared/icon/icon-menu';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import { IconUserComponent } from 'src/app/shared/icon/icon-user';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent, IconTrashLinesComponent, NgxCustomModalComponent, NgxSpinnerModule,
    NgSelectModule, IconHorizontalDotsComponent, MenuModule
  ],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();
  actual_role: string = '';
  clientes: any[] = [];
  clientesFiltrados: any[] = [];
  selectedCliente: any;
  newClienteForm!: FormGroup;
  clienteForm!: FormGroup;

  isHuman: boolean = false;

  busqueda_contiene: boolean = false;
  isEdicion: boolean = false;
  lastSelectedPaisUuid: any = null;
  lastSelectedProvinciaUuid: any = null;

  isShowMailMenu = false;

  // Orden y filtro
  filtros: any = {
    tipoPersona: 'todos'
  };
  showFilter: boolean = false;
  ordenamiento: any = {
  };
  isSubmit = false;

  tab1: string = 'Datos generales';

  // Referencia al modal para crear y editar países.
  @ViewChild('modalCliente') modalCliente!: NgxCustomModalComponent;
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
  documentos: any[] = [];
  posiblesEstados: any[] = [];
  condicionesIva: any[] = [];

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _clienteService: ClientesService, private spinner: NgxSpinnerService, private tokenService: TokenService,
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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.spinner.show();
    this.inicializarForm();
    this.obtenerClientes();
    this.obtenerCatalogos();
  }

  obtenerClientes(alta: boolean = false) {
    // El booleano 'alta' es para que cuando da de alta un nuevo registro, no entre a inicializar, sino siempre muestra el primero de 
    // la lista y no el que acabo de agregar.
    this.subscription.add(
      this._indexService.getClientesWithParam(this.actual_role).subscribe({
        next: res => {
          console.log(res);
          this.clientes = res.data;
          this.clientesFiltrados = this.clientes;
          if (!alta && this.clientes.length > 0) {
            this.inicializarForm(this.clientes[0]);
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

  // filtrarClientes(clientes: any) {
  //   return clientes.filter((dato: any) => {
  //     // Caso 1: Si es humano, lo devolvemos solo si user es null y supplier es null
  //     if (dato.human) {
  //       return dato.human.user === null && dato.supplier === null;
  //     }
  //     // Caso 2: Si no es humano pero tiene legal_entity, lo devolvemos solo si supplier es null
  //     if (dato.legal_entity) {
  //       return dato.supplier === null;
  //     }
  //     return false;
  //   });
  // }

  inicializarForm(cliente?: any) {
    if (cliente) {
      this.selectedCliente = cliente;
      this.isHuman = (cliente.person?.human);
      if (cliente.person.uuid != this.selectedCliente?.person.uuid) {
        // Esto es para no llamar cuando hace el show y tambien hacerlo al editar. 
        this.obtenerProvinciaCiudadCliente(cliente);
      }
    }
    this.clienteForm = new FormGroup({
      nombre: new FormControl({ value: cliente?.person?.human?.firstname, disabled: true }, [Validators.required]),
      apellido: new FormControl({ value: cliente?.person?.human?.lastname, disabled: true }, [Validators.required]),
      genero: new FormControl({ value: cliente?.person?.human?.gender?.uuid, disabled: true }, [Validators.required]),
      documento: new FormControl({ value: cliente?.person?.human?.document_number, disabled: true }, [Validators.required]),
      tipoDocumento: new FormControl({ value: cliente?.person?.human?.document_type?.uuid, disabled: true }, [Validators.required]),
      cuit: new FormControl({ value: this.isHuman ? cliente?.person?.human?.cuit : cliente?.person?.legal_entity?.cuit, disabled: true }, [Validators.required]),
      razon: new FormControl({ value: cliente?.person?.legal_entity?.company_name, disabled: true }, [Validators.required]),
      estado: new FormControl({ value: cliente?.person?.current_state?.state?.uuid, disabled: true }, []),
      estadoComentario: new FormControl({ value: cliente?.person?.current_state?.comments, disabled: true }, []),
      comentarios: new FormControl({ value: cliente?.person?.comments, disabled: true }, [Validators.required]),
      calle: new FormControl({ value: cliente?.person?.street_name, disabled: true }, [Validators.required]),
      numero: new FormControl({ value: cliente?.person?.door_number, disabled: true }, [Validators.required]),
      detalleDireccion: new FormControl({ value: cliente?.person?.address_detail, disabled: true }, [Validators.required]),
      pais: new FormControl({ value: cliente?.person?.city?.district?.country?.uuid, disabled: true }, [Validators.required]),
      provincia: new FormControl({ value: cliente?.person?.city?.district?.uuid, disabled: true }, [Validators.required]),
      ciudad: new FormControl({ value: cliente?.person?.city?.uuid, disabled: true }, [Validators.required]),
      percepcionIVA: new FormControl({ value: cliente?.person?.vat_percent, disabled: true }, []),
    });
    this.lastSelectedPaisUuid = cliente?.person?.city?.district?.country?.uuid;
    this.lastSelectedProvinciaUuid = cliente?.person?.city?.district?.uuid;

    this.onChangeEdicion();

  }

  onChangeEdicion() {
    this.clienteForm.get('pais')!.valueChanges.subscribe(
      (uuid: string) => {
        // if ((uuid && uuid !== this.selectedProveedor.person.city.district.country.uuid) || (uuid && uuid !== this.lastSelectedPaisUuid)) {
        if ((uuid && uuid !== this.lastSelectedPaisUuid)) {

          this.lastSelectedPaisUuid = uuid;
          this._catalogoService.getProvinciasByCountry(uuid).subscribe({
            next: res => {
              this.clienteForm.get('provincia')?.setValue(null);
              this.clienteForm.get('provincia')?.enable();
              this.provincias = res.data.districts;
            },
            error: error => {
              this.swalService.toastError('center', 'Error al traer provincias del servidor.');
              console.error(error);
            }
          });
        } else if (!uuid) {
          this.lastSelectedPaisUuid = null;
          this.clienteForm.get('provincia')?.setValue(null);
          this.clienteForm.get('provincia')?.disable();
          this.clienteForm.get('ciudad')?.setValue(null);
          this.clienteForm.get('ciudad')?.disable();
          this.provincias = [];
          this.ciudades = [];
        }
      });

    this.clienteForm.get('provincia')!.valueChanges.subscribe(
      (uuid: string) => {
        // if ((uuid && uuid !== this.selectedProveedor.person.city.district.uuid)) {
        if (uuid && uuid !== this.lastSelectedProvinciaUuid) {
          this.lastSelectedProvinciaUuid = uuid;
          this._catalogoService.getCiudadesByProvincia(uuid).subscribe({
            next: res => {
              this.clienteForm.get('ciudad')?.setValue(null);
              this.clienteForm.get('ciudad')?.enable();
              this.ciudades = res.data.cities;
            },
            error: error => {
              this.swalService.toastError('center', 'Error al traer provincias del servidor.');
              console.error(error);
            }
          });
        } else if (!uuid) {
          this.lastSelectedProvinciaUuid = null;
          this.clienteForm.get('ciudad')?.setValue(null);
          this.clienteForm.get('ciudad')?.disable();
          this.ciudades = [];
        }
      });

  }

  obtenerProvinciaCiudadCliente(cliente: any) {
    if (cliente.city?.district?.country) {
      forkJoin({
        provincias: this._catalogoService.getProvinciasByCountry(cliente.city?.district?.country.uuid),
        ciudades: this._catalogoService.getCiudadesByProvincia(cliente.city?.district?.uuid),
      }).subscribe({
        next: res => {
          this.provincias = res.provincias.data.districts;
          this.ciudades = res.ciudades.data.cities;
        },
        error: error => {
          console.error('Error cargando catalogos para primer cliente: ', error);
        }
      });
    }
  }


  getName(cliente: any) {
    if (cliente.person?.human) {
      return cliente.person?.human.firstname + ' ' + cliente.person?.human.lastname
    } else if (cliente.person?.legal_entity) {
      return cliente.person?.legal_entity?.company_name
    } else {
      return ' ';
    }
  }

  showDataCliente(cliente: any) {
    this.isEdicion = false;
    this.inicializarForm(cliente);
  }

  editarUsuario(cliente: any) {
    this.isEdicion = true;
    this.inicializarForm(cliente);
    this.modificarValidacionesForm();
  }

  modificarValidacionesForm() {
    this.clienteForm.get('nombre')?.enable();
    this.clienteForm.get('apellido')?.enable();
    this.clienteForm.get('genero')?.enable();
    this.clienteForm.get('razon')?.enable();
    this.clienteForm.get('estado')?.enable();
    this.clienteForm.get('estadoComentario')?.enable();
    this.clienteForm.get('comentarios')?.enable();
    this.clienteForm.get('calle')?.enable();
    this.clienteForm.get('numero')?.enable();
    this.clienteForm.get('cuit')?.enable();
    this.clienteForm.get('documento')?.enable();
    this.clienteForm.get('tipoDocumento')?.enable();
    this.clienteForm.get('detalleDireccion')?.enable();
    this.clienteForm.get('pais')?.enable();
    this.clienteForm.get('provincia')?.enable();
    this.clienteForm.get('ciudad')?.enable();
    this.clienteForm.get('percepcionIVA')?.enable();
    if (this.isHuman) {
      this.clienteForm.get('nombre')?.setValidators([Validators.required]);
      this.clienteForm.get('apellido')?.setValidators([Validators.required]);
      this.clienteForm.get('genero')?.setValidators([Validators.required]);
      this.clienteForm.get('documento')?.setValidators([Validators.required]);
      this.clienteForm.get('razon')?.clearValidators();
    } else {
      this.clienteForm.get('razon')?.setValidators([Validators.required]);
      this.clienteForm.get('nombre')?.clearValidators();
      this.clienteForm.get('apellido')?.clearValidators();
      this.clienteForm.get('genero')?.clearValidators();
      this.clienteForm.get('documento')?.clearValidators();
    }
    ['nombre', 'apellido', 'genero', 'documento', 'razon'].forEach((field) => {
      this.clienteForm.get(field)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  cancelarEdicion() {
    this.isEdicion = false;
    this.inicializarForm(this.selectedCliente);
  }

  confirmarEdicion() {
    if (this.clienteForm.valid) {
      this.spinner.show();
      let cliente = new ClienteDTO();
      this.armarDTOEdicion(cliente);
      console.log(cliente);
      this.subscription.add(
        this._clienteService.editCliente(this.selectedCliente.uuid, cliente).subscribe({
          next: res => {
            // console.log(res);
            this.inicializarForm(res.data);
            this.isEdicion = false;
            this.swalService.toastSuccess('top-right', "Usuario actualizado.");
            this.spinner.hide();
          },
          error: error => {
            this.spinner.hide();
            console.error(error);
          }
        })
      )
    }
  }
  armarDTOEdicion(cliente: ClienteDTO) {
    // console.log(this.newclienteForm);
    cliente.actual_role = this.actual_role;
    cliente.with = ["person.city", "person.city.district", "person.city.district.country", "person.human", "person.human.gender",
      "person.human.documentType", "person.legalEntity"];
    // cliente.batch_prefix = this.clienteForm.get('sigla')?.value;
    cliente.comments = this.clienteForm.get('comentarios')?.value;
    // cliente.perception = true; // TODO
    cliente.vat_percent = this.clienteForm.get('percepcionIVA')?.value;
    // cliente.withholding = true; // TODO
    let person = new Person();
    person.street_name = this.clienteForm.get('calle')?.value;
    person.door_number = this.clienteForm.get('numero')?.value;
    person.address_detail = this.clienteForm.get('detalleDireccion')?.value;
    person.city_uuid = this.clienteForm.get('ciudad')?.value;
    if (this.isHuman) {
      let human = new Human();
      human.firstname = this.clienteForm.get('nombre')?.value;
      human.lastname = this.clienteForm.get('apellido')?.value;
      human.document_type_uuid = this.clienteForm.get('tipoDocumento')?.value;
      human.document_number = this.clienteForm.get('documento')?.value;
      human.cuit = this.clienteForm.get('cuit')?.value;
      human.gender_uuid = this.clienteForm.get('genero')?.value;
      person.human = human;
    } else {
      let legal_entity = new LegalEntity();
      legal_entity.cuit = this.clienteForm.get('cuit')?.value;
      legal_entity.company_name = this.clienteForm.get('razon')?.value;
      person.legal_entity = legal_entity;
    }
    cliente.person = person;
  }

  filtrarDatos() {
    let resultados = this.clientesFiltrados;
    if (this.showFilter) {
      // Es búsqueda avanzada
      if (this.filtros.tipoPersona === 'fisica') {
        resultados = this.clientesFiltrados.filter(dato => {
          return dato.person?.human
        })

      } else if (this.filtros.tipoPersona === 'juridica') {
        resultados = this.clientesFiltrados.filter(dato => {
          return dato.person?.legal_entity
        })
      } else {
        // todos
        resultados = this.clientes;
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
    } else {
      // Busca solo por cliente en la búsqueda simple
      if (this.filtros.name) {
        resultados = this.clientesFiltrados.filter(dato => {
          let nombreCompleto;
          if (dato.person?.human) {
            nombreCompleto = (dato.person?.human?.firstname + ' ' + dato.person?.human?.lastname).toLocaleLowerCase();
          } else {
            nombreCompleto = dato.person?.legal_entity?.company_name.toLocaleLowerCase();
          }
          if (this.busqueda_contiene) {
            return nombreCompleto.includes(this.filtros.name.toLowerCase());
          } else {
            return nombreCompleto.startsWith(this.filtros.name.toLowerCase());
          }
        })
      }
    }
    return resultados;
  }

  openSwalEliminar(cliente: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el cliente ${this.getName(cliente)}?`,
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
        this.eliminarCliente(cliente);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarCliente(cliente: any) {
    this.spinner.show();
    this.subscription.add(
      this._clienteService.eliminarCliente(cliente.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          this.obtenerClientes();
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
    this.modalCliente.close();
  }

  openModalNuevoCliente() {
    this.tituloModal = 'Nuevo cliente';
    this.inicializarNuevoFormularioCliente();
    this.modalCliente.options = this.modalOptions;
    this.modalCliente.open();
  }

  inicializarNuevoFormularioCliente() {
    this.newClienteForm = new FormGroup({
      tipoPersona: new FormControl('fisica', [Validators.required]),
      nombre: new FormControl(null, [Validators.required]),
      apellido: new FormControl(null, [Validators.required]),
      tipoDocumento: new FormControl(null, [Validators.required]),
      documento: new FormControl(null, [Validators.required]),
      cuit: new FormControl(null, []),
      genero: new FormControl(null, [Validators.required]),
      razon: new FormControl(null, []),
      estado: new FormControl(null, [Validators.required]),
      estadoComentario: new FormControl(null, [Validators.required]),
      calle: new FormControl(null, []),
      numero: new FormControl(null, []),
      detalleDireccion: new FormControl(null, []),
      comentarios: new FormControl(null, []),
      pais: new FormControl(null, []),
      provincia: new FormControl(null, []),
      ciudad: new FormControl(null, []),
      percepcionIVA: new FormControl(0, []),
      condicion: new FormControl(null, []),
    });
    this.provincias = [];
    this.ciudades = [];
    this.onChange();
  }

  onChange() {
    this.newClienteForm.get('pais')!.valueChanges.subscribe(
      (uuid: string) => {
        this._catalogoService.getProvinciasByCountry(uuid).subscribe({
          next: res => {
            this.newClienteForm.get('provincia')?.setValue(null);
            this.provincias = res.data.districts;
          },
          error: error => {
            this.swalService.toastError('center', 'Error al traer provincias del servidor.');
            console.error(error);
          }
        });
      });

    this.newClienteForm.get('provincia')!.valueChanges.subscribe(
      (uuid: string) => {
        if (uuid) {
          this._catalogoService.getCiudadesByProvincia(uuid).subscribe({
            next: res => {
              this.newClienteForm.get('ciudad')?.setValue(null);
              this.ciudades = res.data.cities;
            },
            error: error => {
              this.swalService.toastError('center', 'Error al traer ciudades del servidor.');
              console.error(error);
            }
          });
        }
      });


    this.newClienteForm.get('tipoPersona')!.valueChanges.subscribe(
      (tipo: string) => {
        this.modificarValidacionesNuevoCliente(tipo);
      });
  }

  modificarValidacionesNuevoCliente(tipo: string) {
    if (tipo === 'fisica') {
      this.newClienteForm.get('nombre')?.setValidators([Validators.required]);
      this.newClienteForm.get('apellido')?.setValidators([Validators.required]);
      this.newClienteForm.get('genero')?.setValidators([Validators.required]);
      this.newClienteForm.get('documento')?.setValidators([Validators.required]);
      this.newClienteForm.get('tipoDocumento')?.setValidators([Validators.required]);
      this.newClienteForm.get('razon')?.clearValidators();
    } else {
      this.newClienteForm.get('razon')?.setValidators([Validators.required]);
      this.newClienteForm.get('nombre')?.clearValidators();
      this.newClienteForm.get('apellido')?.clearValidators();
      this.newClienteForm.get('genero')?.clearValidators();
      this.newClienteForm.get('documento')?.clearValidators();
      this.newClienteForm.get('tipoDocumento')?.clearValidators();
    }

    ['nombre', 'apellido', 'genero', 'documento', 'tipoDocumento', 'razon'].forEach((field) => {
      this.newClienteForm.get(field)?.updateValueAndValidity({ emitEvent: false });
    });
  }


  obtenerCatalogos() {
    forkJoin({
      generos: this._catalogoService.getGeneros(),
      paises: this._catalogoService.getPaises(),
      documentos: this._catalogoService.getDocumentos(),
      posiblesEstados: this._catalogoService.getPosiblesEstados(this.actual_role),
      condicionIva: this._catalogoService.getCondicionIva(this.actual_role)
    }).subscribe({
      next: res => {
        // console.log(res);
        this.generos = res.generos.data;
        this.paises = res.paises.data;
        this.documentos = res.documentos.data;
        this.posiblesEstados = res.posiblesEstados.data;
        this.condicionesIva = res.condicionIva.data;
      },
      error: error => {
        console.error('Error cargando catalogos:', error);
      }
    });
  }

  confirmarNuevoCliente() {
    this.isSubmit = true;
    if (this.newClienteForm.valid) {
      this.spinner.show();
      let cliente = new ClienteDTO();
      this.armarDtoNuevoCliente(cliente);
      this.subscription.add(
        this._clienteService.saveCliente(cliente).subscribe({
          next: res => {
            // console.log(res);
            this.spinner.hide();
            this.obtenerClientes(true);
            this.cerrarModal();
            this.showDataCliente(res.data);
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

  armarDtoNuevoCliente(cliente: ClienteDTO) {
    cliente.actual_role = this.actual_role;
    cliente.with = ["person.city", "person.city.district", "person.city.district.country", "person.human", "person.human.gender",
      "person.human.documentType", "person.legalEntity"];
    // cliente.batch_prefix = this.newClienteForm.get('sigla')?.value;
    cliente.comments = this.newClienteForm.get('comentarios')?.value;
    // cliente.perception = true; // TODO
    cliente.vat_percent = this.newClienteForm.get('percepcionIVA')?.value;
    cliente.vat_condition_uuid = this.newClienteForm.get('condicion')?.value;
    // cliente.withholding = true; // TODO
    let person = new Person();
    person.street_name = this.newClienteForm.get('calle')?.value;
    person.door_number = this.newClienteForm.get('numero')?.value;
    person.address_detail = this.newClienteForm.get('detalleDireccion')?.value;
    person.city_uuid = this.newClienteForm.get('ciudad')?.value;
    person.possible_person_state_uuid = this.newClienteForm.get('estado')?.value;
    person.state_comments = this.newClienteForm.get('estadoComentario')?.value;
    if (this.newClienteForm.get('tipoPersona')?.value === 'fisica') {
      let human = new Human();
      human.firstname = this.newClienteForm.get('nombre')?.value;
      human.lastname = this.newClienteForm.get('apellido')?.value;
      human.document_type_uuid = this.newClienteForm.get('tipoDocumento')?.value;
      human.document_number = this.newClienteForm.get('documento')?.value;
      human.cuit = this.newClienteForm.get('cuit')?.value;
      human.gender_uuid = this.newClienteForm.get('genero')?.value;
      person.human = human;
    } else {
      let legal_entity = new LegalEntity();
      legal_entity.cuit = this.newClienteForm.get('cuit')?.value;
      legal_entity.company_name = this.newClienteForm.get('razon')?.value;
      person.legal_entity = legal_entity;
    }
    cliente.person = person;
    this.cleanObject(cliente);
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


  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        tipoPersona: 'todos'
      };
    }
  }

  cleanFilters() {
    this.filtros.nombre = '';
    this.filtros.apellido = '';
    this.filtros.razon = '';
    this.filtros.cuit = '';
  }



}
