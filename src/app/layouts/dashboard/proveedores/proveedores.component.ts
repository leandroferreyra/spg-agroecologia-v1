import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { type } from 'os';
import { forkJoin, Subscription } from 'rxjs';
import { ProveedorDTO } from 'src/app/core/models/request/proveedorDTO';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { CategoriasService } from 'src/app/core/services/categorias.service';
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
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent, IconTrashLinesComponent, NgxCustomModalComponent, NgxSpinnerModule,
    NgSelectModule
  ],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();
  actual_role: string = '';
  proveedores: any[] = [];
  proveedoresFiltrados: any[] = [];
  selectedProveedor: any;
  newProveedorForm!: FormGroup;
  proveedorForm!: FormGroup;

  isHuman: boolean = false;
  // newTipoPersona = 'fisica';

  busqueda_contiene: boolean = false;
  isEdicion: boolean = false;


  isShowMailMenu = false;

  // Orden y filtro
  filtros: any = {
    name: ''
  };
  showFilter: boolean = false;
  ordenamiento: any = {
  };
  isSubmit = false;

  tab1: string = 'Datos generales';

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
    this.obtenerProveedores();
  }

  obtenerProveedores() {
    const params: any = {};
    params.with = ["person.city", "person.city.district", "person.city.district.country", "person.human", "person.human.gender", "person.legal_entity"];
    params.paging = null;
    params.page = null;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getProveedoresWithParam(params, this.actual_role).subscribe({
        next: res => {
          console.log(res);
          this.proveedores = res.data;
          this.proveedoresFiltrados = this.proveedores;
          if (this.proveedores.length > 0) {
            this.inicializarForm(this.proveedores[0]);
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
      this.selectedProveedor = proveedor;
      this.isHuman = proveedor.person?.human ? true : false;
    }
    this.proveedorForm = new FormGroup({
      nombre: new FormControl({ value: proveedor?.person?.human?.firstname, disabled: true }, [Validators.required]),
      apellido: new FormControl({ value: proveedor?.person?.human?.lastname, disabled: true }, [Validators.required]),
      documento: new FormControl({ value: proveedor?.person?.human?.document_number, disabled: true }, [Validators.required]),
      cuit: new FormControl({ value: this.isHuman ? proveedor?.person?.human?.cuit : proveedor?.person?.legal_entity?.cuit, disabled: true }, [Validators.required]),
      razon: new FormControl({ value: proveedor?.person?.legal_entity?.company_name, disabled: true }, [Validators.required]),
      sigla: new FormControl({ value: proveedor?.batch_prefix, disabled: true }, [Validators.required]),
      comentarios: new FormControl({ value: proveedor?.comments, disabled: true }, [Validators.required]),
      calle: new FormControl({ value: proveedor?.person?.street_name, disabled: true }, [Validators.required]),
      numero: new FormControl({ value: proveedor?.person?.door_number, disabled: true }, [Validators.required]),
      detalleDireccion: new FormControl({ value: proveedor?.person?.address_detail, disabled: true }, [Validators.required]),
    });
  }

  agregarProveedor() {
    console.log('Add provedor');
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
    // console.log(proveedor);
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
    this.proveedorForm.get('nombre')?.enable();
    this.proveedorForm.get('apellido')?.enable();
    this.proveedorForm.get('razon')?.enable();
    this.proveedorForm.get('sigla')?.enable();
    this.proveedorForm.get('comentarios')?.enable();
    this.proveedorForm.get('calle')?.enable();
    this.proveedorForm.get('numero')?.enable();
    this.proveedorForm.get('cuit')?.enable();
    this.proveedorForm.get('documento')?.enable();
    this.proveedorForm.get('detalleDireccion')?.enable();
  }

  cancelarEdicion() {
    this.isEdicion = false;
    this.inicializarForm(this.selectedProveedor);
  }

  confirmarEdicion() {
    console.log('Confirmar edicion');
  }

  filtrarDatos() {
    let resultados = this.proveedoresFiltrados;
    if (this.filtros.name) {
      resultados = this.proveedoresFiltrados.filter(dato => {
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
    this.modalProveedor.close();
  }

  openModalNuevoProveedor() {
    this.obtenerCatalogos();
    this.tituloModal = 'Nuevo proveedor';
    this.inicializarNuevoFormularioProveedor();
    this.modalProveedor.options = this.modalOptions;
    this.modalProveedor.open();
  }

  inicializarNuevoFormularioProveedor() {
    this.newProveedorForm = new FormGroup({
      tipoPersona: new FormControl('fisica', [Validators.required]),
      nombre: new FormControl(null, [Validators.required]),
      apellido: new FormControl(null, [Validators.required]),
      documento: new FormControl(null, [Validators.required]),
      cuit: new FormControl(null, [Validators.required]),
      genero: new FormControl(null, [Validators.required]),
      razon: new FormControl(null, [Validators.required]),
      sigla: new FormControl(null, [Validators.required]),
      calle: new FormControl(null, []),
      numero: new FormControl(null, []),
      detalleDireccion: new FormControl(null, []),
      comentarios: new FormControl(null, []),
      pais: new FormControl(null, [Validators.required]),
      provincia: new FormControl(null, [Validators.required]),
      ciudad: new FormControl(null, [Validators.required])
    });
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


    this.newProveedorForm.get('tipoPersona')!.valueChanges.subscribe(
      (tipo: string) => {
        this.modificarValidacionesForm
      });
  }

  obtenerCatalogos() {
    forkJoin({
      generos: this._catalogoService.getGeneros(),
      paises: this._catalogoService.getPaises(),
      // documentos: this._catalogoService.getDocumentos()
    }).subscribe({
      next: res => {
        // console.log(res);
        this.generos = res.generos.data;
        this.paises = res.paises.data;
        // this.documentos = res.documentos.data;
      },
      error: error => {
        console.error('Error cargando catalogos:', error);
      }
    });
  }

  confirmarProveedor() {
    this.isSubmit = true;
    if (this.newProveedorForm.valid) {
      let proveedor = new ProveedorDTO();
      this.armarDtoNuevoProveedor(proveedor);
      this.subscription.add(
        this._proveedoresService.saveProveedor(proveedor).subscribe({
          next: res => {
            console.log(res);
          },
          error: error => {
            console.error(error);
          }
        })
      )
    }
  }

  armarDtoNuevoProveedor(proveedor: any) {
    console.log(this.newProveedorForm);
  }





}
