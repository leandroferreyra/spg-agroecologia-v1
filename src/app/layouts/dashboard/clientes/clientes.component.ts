import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
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
import { IconEditComponent } from 'src/app/shared/icon/icon-edit';
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
    NgSelectModule
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
      this._indexService.getProveedoresWithParam(this.actual_role).subscribe({
        next: res => {
          // console.log(res);
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

  inicializarForm(proveedor?: any) {
    if (proveedor) {
      this.selectedCliente = proveedor;
      this.isHuman = proveedor.person?.human ? true : false;
      this.obtenerProvinciaCiudadProveedor(proveedor);
    }
    this.clienteForm = new FormGroup({
      nombre: new FormControl({ value: proveedor?.person?.human?.firstname, disabled: true }, [Validators.required]),
      apellido: new FormControl({ value: proveedor?.person?.human?.lastname, disabled: true }, [Validators.required]),
      genero: new FormControl({ value: proveedor?.person?.human?.gender?.uuid, disabled: true }, [Validators.required]),
      documento: new FormControl({ value: proveedor?.person?.human?.document_number, disabled: true }, [Validators.required]),
      tipoDocumento: new FormControl({ value: proveedor?.person?.human?.document_type?.uuid, disabled: true }, [Validators.required]),
      cuit: new FormControl({ value: this.isHuman ? proveedor?.person?.human?.cuit : proveedor?.person?.legal_entity?.cuit, disabled: true }, [Validators.required]),
      razon: new FormControl({ value: proveedor?.person?.legal_entity?.company_name, disabled: true }, [Validators.required]),
      sigla: new FormControl({ value: proveedor?.batch_prefix, disabled: true }, [Validators.required]),
      comentarios: new FormControl({ value: proveedor?.comments, disabled: true }, [Validators.required]),
      calle: new FormControl({ value: proveedor?.person?.street_name, disabled: true }, [Validators.required]),
      numero: new FormControl({ value: proveedor?.person?.door_number, disabled: true }, [Validators.required]),
      detalleDireccion: new FormControl({ value: proveedor?.person?.address_detail, disabled: true }, [Validators.required]),
      pais: new FormControl({ value: proveedor?.person?.city?.district?.country?.uuid, disabled: true }, [Validators.required]),
      provincia: new FormControl({ value: proveedor?.person?.city?.district?.uuid, disabled: true }, [Validators.required]),
      ciudad: new FormControl({ value: proveedor?.person?.city?.uuid, disabled: true }, [Validators.required]),
    });

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


  getName(proveedor: any) {
    if (proveedor.person?.human) {
      return proveedor.person.human.firstname + ' ' + proveedor.person.human.lastname
    } else if (proveedor.person?.legal_entity) {
      return proveedor.person.legal_entity.company_name
    } else {
      return ' ';
    }
  }

  showDataCliente(proveedor: any) {
    this.isEdicion = false;
    this.inicializarForm(proveedor);
  }

  toggleEdicion() {
    this.isEdicion = !this.isEdicion;
    if (this.isEdicion) {
      this.modificarValidacionesForm();
    } else {
      this.cancelarEdicion();
    }
  }

  modificarValidacionesForm() {
    this.clienteForm.get('nombre')?.enable();
    this.clienteForm.get('apellido')?.enable();
    this.clienteForm.get('genero')?.enable();
    this.clienteForm.get('razon')?.enable();
    this.clienteForm.get('sigla')?.enable();
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
      let proveedor = new ProveedorDTO();
      this.armarDTOEdicion(proveedor);
      this.subscription.add(
        this._proveedoresService.editProveedor(this.selectedCliente.uuid, proveedor).subscribe({
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
  armarDTOEdicion(proveedor: ProveedorDTO) {
    // console.log(this.newProveedorForm);
    proveedor.actual_role = this.actual_role;
    proveedor.with = ["person.city", "person.city.district", "person.city.district.country", "person.human", "person.human.gender",
      "person.human.document_type", "person.legal_entity"];
    proveedor.batch_prefix = this.clienteForm.get('sigla')?.value;
    proveedor.comments = this.clienteForm.get('comentarios')?.value;
    proveedor.perception = '1'; // TODO
    proveedor.vat_percent = '1'; // TODO
    proveedor.withholding = '1'; // TODO
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
    proveedor.person = person;
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
    } else {
      // Busca solo por proveedor en la búsqueda simple
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
    this.inicializarNuevoFormularioProveedor();
    this.modalCliente.options = this.modalOptions;
    this.modalCliente.open();
  }

  inicializarNuevoFormularioProveedor() {
    this.newClienteForm = new FormGroup({
      tipoPersona: new FormControl('fisica', [Validators.required]),
      nombre: new FormControl(null, [Validators.required]),
      apellido: new FormControl(null, [Validators.required]),
      tipoDocumento: new FormControl(null, [Validators.required]),
      documento: new FormControl(null, [Validators.required]),
      cuit: new FormControl(null, []),
      genero: new FormControl(null, [Validators.required]),
      razon: new FormControl(null, []),
      sigla: new FormControl(null, [Validators.required]),
      calle: new FormControl(null, []),
      numero: new FormControl(null, []),
      detalleDireccion: new FormControl(null, []),
      comentarios: new FormControl(null, []),
      pais: new FormControl(null, [Validators.required]),
      provincia: new FormControl(null, [Validators.required]),
      ciudad: new FormControl(null, [Validators.required])
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
        this.modificarValidacionesNuevoProveedor(tipo);
      });
  }

  modificarValidacionesNuevoProveedor(tipo: string) {
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
      documentos: this._catalogoService.getDocumentos()
    }).subscribe({
      next: res => {
        // console.log(res);
        this.generos = res.generos.data;
        this.paises = res.paises.data;
        this.documentos = res.documentos.data;
      },
      error: error => {
        console.error('Error cargando catalogos:', error);
      }
    });
  }

  confirmarNuevoProveedor() {
    this.isSubmit = true;
    if (this.newClienteForm.valid) {
      this.spinner.show();
      let proveedor = new ProveedorDTO();
      this.armarDtoNuevoProveedor(proveedor);
      this.subscription.add(
        this._proveedoresService.saveProveedor(proveedor).subscribe({
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

  armarDtoNuevoProveedor(proveedor: ProveedorDTO) {
    // console.log(this.newProveedorForm);
    proveedor.actual_role = this.actual_role;
    proveedor.with = ["person.city", "person.city.district", "person.city.district.country", "person.human", "person.human.gender",
      "person.human.document_type", "person.legal_entity"];
    proveedor.batch_prefix = this.newClienteForm.get('sigla')?.value;
    proveedor.comments = this.newClienteForm.get('comentarios')?.value;
    proveedor.perception = '1'; // TODO
    proveedor.vat_percent = '1'; // TODO
    proveedor.withholding = '1'; // TODO
    let person = new Person();
    person.street_name = this.newClienteForm.get('calle')?.value;
    person.door_number = this.newClienteForm.get('numero')?.value;
    person.address_detail = this.newClienteForm.get('detalleDireccion')?.value;
    person.city_uuid = this.newClienteForm.get('ciudad')?.value;
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
    proveedor.person = person;
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
    this.filtros.sigla = '';
    this.filtros.cuit = '';
  }



}
