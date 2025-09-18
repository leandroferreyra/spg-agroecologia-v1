import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
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
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconEditComponent } from 'src/app/shared/icon/icon-edit';
import { IconHorizontalDotsComponent } from 'src/app/shared/icon/icon-horizontal-dots';
import { IconMenuComponent } from 'src/app/shared/icon/icon-menu';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconExpandComponent } from 'src/app/shared/icon/icon-expand';
import { IconCollapseComponent } from 'src/app/shared/icon/icon-collapse';
import { IconExpandAllComponent } from 'src/app/shared/icon/icon-expand-all';
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
import { EstadoProduccion } from 'src/app/core/models/enum/estadoProduccion';
import { TimelineComponent } from './timeline/timeline.component';
import { ComponentesProduccionComponent } from './componentes-produccion/componentes-produccion.component';
import { TrazabilidadComponent } from './trazabilidad/trazabilidad.component';
import { FaltantesComponent } from './faltantes/faltantes.component';
import { ProduccionEstadoDTO } from 'src/app/core/models/request/produccionEstadoDTO';
import { ProduccionDTO } from 'src/app/core/models/request/produccionDTO';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { IconExpandAllComponent2 } from 'src/app/shared/icon/icon-expand-all2';
import { IconExpandItemComponent } from 'src/app/shared/icon/icon-expand-item';
import { IconCollapseItemComponent } from 'src/app/shared/icon/icon-collapse-item';

@Component({
  selector: 'app-produccion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent, IconPencilComponent, IconTrashLinesComponent, NgxCustomModalComponent, NgxSpinnerModule,
    NgSelectModule, IconHorizontalDotsComponent, MenuModule, FontAwesomeModule, IconSettingsComponent, NgbPaginationModule, FlatpickrDirective,
    TimelineComponent, ComponentesProduccionComponent, TrazabilidadComponent, FaltantesComponent, IconExpandComponent, IconCollapseComponent,
    IconExpandAllComponent, IconExpandAllComponent2, IconExpandItemComponent, IconCollapseItemComponent],
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
  usuarioLogueado: any;
  produccionAnterior: any[] = [];
  produccionForm!: FormGroup;
  liberacionForm!: FormGroup;

  isEdicion: boolean = false;
  isShowMailMenu = false;
  isTabDisabled = false;

  //Paginación
  MAX_ITEMS_PER_PAGE = 20;
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

  tituloModal: string = '';

  // Catalogos
  estados: any[] = [];
  usuarios: any[] = [];
  usuariosParaFiltrar: any[] = [];

  uuidFromUrl: string = '';
  isLoadingProducciones: boolean = true;
  tab1: string = 'datos-generales';

  @ViewChild('modalLiberacion') modalLiberacion!: NgxCustomModalComponent;
  @ViewChild('modalCambioCantidad') modalCambioCantidad!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  // Manejo de filtros activos.
  activeFilters: Array<{ key: string; label: string; display: string }> = [];

  hayProductosTerceros: boolean = false;
  showMensajeIsMayor: boolean = false;
  showMensajeAsignaNumero: boolean = false;
  modificaCantidad: boolean = false;

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _userLogged: UserLoggedService, private _produccionService: ProduccionService, private spinner: NgxSpinnerService,
    private tokenService: TokenService, private _catalogoService: CatalogoService, private location: Location, private route: ActivatedRoute,
    private router: Router, private fb: FormBuilder
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
      const validTabs = ['datos-generales', 'componentes', 'trazabilidad', 'faltantes'];
      if (tab && validTabs.includes(tab)) {
        this.tab1 = tab;
      } else {
        this.tab1 = 'datos-generales';
      }
    });

    this.usuarioLogueado = this._userLogged.getUsuarioLogueado;
    this.spinner.show();
    this.obtenerProducciones();
    this.obtenerCatalogos();
  }

  obtenerProducciones(alta: boolean = false) {
    // El booleano 'alta' es para que cuando da de alta un nuevo registro, no entre a inicializar, sino siempre muestra el primero de 
    // la lista y no el que acabo de agregar.

    // Inicializamos un objeto vacío para los parámetros
    this.params.with = ["product", "batch", "currentState"];
    this.params.paging = this.itemsPerPage;
    this.params.page = this.currentPage;
    this.params.order_by = this.ordenamiento;
    this.params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getProduccionesWithParam(this.params, this.actual_role).subscribe({
        next: res => {
          this.producciones = res.data;
          this.modificarPaginacion(res);
          this.tokenService.setToken(res.token);
          if (this.uuidFromUrl) {
            this.showProduccionByUuid(this.uuidFromUrl, false);
          } else {
            if (this.producciones.length === 0) {
              this.swalService.toastSuccess('center', 'No existen producciones.');
              this.isTabDisabled = true;
              this.tab1 = 'datos-generales';
              this.selectedProduccion = null;
            } else {
              this.isTabDisabled = false;
            }
            if (!alta && this.producciones.length > 0) {
              this.isEdicion = false;
              const first = this.producciones[0];
              this.uuidFromUrl = first.uuid;
              this.showProduccionByUuid(first.uuid, false);
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

  showProduccionByUuid(uuid: string, updateTab: boolean, event?: MouseEvent) {
    this.isSubmit = false; // Para que no quede en verde el input al editar
    this.showMensajeAsignaNumero = false;
    this.showMensajeIsMayor = false;
    if (event?.ctrlKey || event?.metaKey) {
      const baseUrl = window.location.origin + window.location.pathname;
      const urlTree = this.router.createUrlTree([`/dashboard/producciones/${uuid}`], {
        queryParams: updateTab ? { tab: 'datos-generales' } : {}
      });
      const finalUrl = this.router.serializeUrl(urlTree);
      window.open(`${baseUrl}#${finalUrl}`, '_blank');
      return;
    }

    this.subscription.add(
      this._produccionService.showProduccion(uuid, this.actual_role).subscribe({
        next: res => {
          this.showDataProduccion(res.data, updateTab);
          this.isLoadingProducciones = false;
          this.tokenService.setToken(res.token);
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
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  obtenerCatalogos() {
    forkJoin({
      estados: this._catalogoService.getPosiblesEstadosProduccion(this.actual_role),
      usuarios: this._indexService.getUsuariosWithParam(null, this.actual_role)
    }).subscribe({
      next: res => {
        this.estados = res.estados.data;
        this.usuariosParaFiltrar = res.usuarios.data.map((usuario: any) => ({
          ...usuario,
          disabled: usuario.production_count === 0
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

  inicializarForm(produccion: any) {
    this.selectedProduccion = produccion;
    this.setUsuariosConDisabled();
    this.produccionForm = new FormGroup({
      producto: new FormControl({ value: produccion?.product?.name, disabled: true }, [Validators.required]),
      fechaInicio: new FormControl({ value: this.convertirFechaConHora(produccion?.production_datetime), disabled: !this.isEdicion }, []),
      cantidad: new FormControl({ value: this.showCantidad(produccion?.quantity), disabled: this.allowEditCantidad() }, [Validators.required]),
      responsableCreacion: new FormControl({ value: produccion?.creator?.user_name, disabled: true }, []),
      responsableEjecucion: new FormControl({ value: produccion?.responsible?.uuid, disabled: !this.isEdicion }, [Validators.required]),
      movimientosEstado: new FormControl({ value: produccion?.production_states, disabled: true }, []),
      asignaNumSerie: new FormControl({ value: produccion?.product?.assign_serial_number, disabled: true }, []),
      tieneNumSerie: new FormControl({ value: produccion?.product?.has_serial_number, disabled: true }, []),
      lote: new FormControl({ value: produccion?.batch?.batch_identification, disabled: true }, []),
      numSerie: this.fb.array([])
    });
    const serials = this.obtenerSerialNumbers(produccion);
    this.setNumSerie(serials);
    this.onFormEditChange();
  }
  onFormEditChange() {
    this.produccionForm.get('cantidad')!.valueChanges.subscribe(
      (value) => {
        this.modificaCantidad = +value !== +this.selectedProduccion.quantity;
        if (this.modificaCantidad) {
          this.showMensajeIsMayor = (value && +value > +this.selectedProduccion.quantity);
          this.showMensajeAsignaNumero = this.selectedProduccion.product?.assign_serial_number === 1;
          if (this.selectedProduccion.product?.assign_serial_number === 1) {
            this.produccionForm.get('numSerie')?.enable();
            const nuevosControles = this.fb.array([]);
            for (let i = 0; i < this.produccionForm.get('cantidad')?.value; i++) {
              nuevosControles.push(this.fb.control('', [Validators.required]));
            }
            this.produccionForm.setControl('numSerie', nuevosControles);
          }
        } else {
          const serials = this.obtenerSerialNumbers(this.selectedProduccion);
          this.setNumSerie(serials);
          this.showMensajeAsignaNumero = false;
          this.showMensajeIsMayor = false;
        }

      });
  }
  get numSerieArray(): FormArray {
    return this.produccionForm.get('numSerie') as FormArray;
  }
  setNumSerie(serials: string[]) {
    this.numSerieArray.clear();
    serials.forEach(sn => {
      this.numSerieArray.push(new FormControl({ value: sn, disabled: true }));
    });
  }

  // onCantidadBlur() {
  //   const cantidad = this.produccionForm.get('cantidad')?.value;
  //   this.modificaCantidad = +cantidad !== +this.selectedProduccion.quantity;
  //   if (this.modificaCantidad) {
  //     this.isMayor = (cantidad && +cantidad > +this.selectedProduccion.quantity);
  //     this.asignaNumero = this.selectedProduccion.product?.assign_serial_number === 1;
  //     if (this.isMayor || this.asignaNumero) {
  //       this.openModalCambioCantidad();
  //     }
  //   } else {
  //     const serials = this.obtenerSerialNumbers(this.selectedProduccion);
  //     this.setNumSerie(serials);
  //   }
  // }

  generarSecuencia() {
    const cantidad = this.numSerieArray.length;
    const base = Number(this.numSerieArray.at(0)?.value);

    if (!base || isNaN(base)) {
      this.swalService.toastError('top-right', "Los números de serie debe ser numéricos.")
      return;
    }

    for (let i = 1; i < cantidad; i++) {
      this.numSerieArray.at(i)?.setValue((base + i).toString());
    }
  }

  // openModalCambioCantidad() {
  //   this.modalCambioCantidad.options = this.modalOptions;
  //   this.modalCambioCantidad.open();
  // }

  // cerrarModalCambioCantidad() {
  //   this.isSubmit = false;
  //   this.isMayor = false;
  //   this.asignaNumero = false;
  //   this.modificaCantidad = false;
  //   const cantidad = this.showCantidad(this.selectedProduccion.quantity);
  //   this.produccionForm.get('cantidad')?.setValue(cantidad);
  //   const serials = this.obtenerSerialNumbers(this.selectedProduccion);
  //   this.setNumSerie(serials);
  //   this.modalCambioCantidad.close();
  // }

  // confirmarCambioCantidad() {
  //   if (this.asignaNumero) {
  //     this.produccionForm.get('numSerie')?.enable();
  //     const nuevosControles = this.fb.array([]);
  //     for (let i = 0; i < this.produccionForm.get('cantidad')?.value; i++) {
  //       nuevosControles.push(this.fb.control('', [Validators.required]));
  //     }
  //     this.produccionForm.setControl('numSerie', nuevosControles);
  //   }
  //   this.modalCambioCantidad.close();
  // }

  allowEditCantidad() {
    return !(this.isEdicion && this.selectedProduccion?.current_state?.state?.name === 'Borrador');
  }

  obtenerSerialNumbers(produccion: any): string[] {
    if (!produccion?.batch?.stocks) return [];

    return produccion.batch.stocks
      .flatMap((stock: any) => stock.product_instances || [])
      .map((instance: any) => instance.serial_number)
      .filter((sn: any) => sn !== undefined && sn !== null);
  }

  private setUsuariosConDisabled() {
    if (!this.selectedProduccion) return;
    this.usuarios = this.usuarios.map(usuario => ({
      ...usuario,
      disabled: usuario.uuid === this.selectedProduccion.responsible?.uuid
    }));
  }

  isFieldDisabled(producto: any) {
    // Solo se habilita si es edicion y es stock controlled
    return !this.isEdicion || producto.product_type?.stock_controlled !== 1;
  }

  showCantidad(data: any) {
    if (!data) {
      return;
    }
    if (this.selectedProduccion?.product?.measure?.is_integer === 1) {
      return (+data)?.toFixed(0);
    } else {
      return (+data)?.toFixed(2);
    }
  }

  showDataProduccion(produccion: any, updateTab: boolean = true) {
    this.produccionAnterior = [];
    this.isEdicion = false;
    this.uuidFromUrl = produccion.uuid;
    if (updateTab) {
      this.tab1 = 'datos-generales';
    }
    this.updateTabQueryParam(this.tab1, this.uuidFromUrl);
    this.inicializarForm(produccion);
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
    // this.modalProduccion.close();
  }

  openModalProduccion(produccion: any) {
    this.isEdicion = !this.isEdicion;
    this.tab1 = 'datos-generales';
    this.inicializarForm(produccion);
  }

  cancelarEdicion() {
    this.isSubmit = false;
    this.isEdicion = false;
    this.modificaCantidad = false;
    this.showMensajeAsignaNumero = false;
    this.showMensajeIsMayor = false;
    this.inicializarForm(this.selectedProduccion);
  }

  convertirFechaConHora(fechaStr: string): string {
    if (!fechaStr) return '';

    const [fecha, hora] = fechaStr.split(' ');
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}-${mes}-${anio} ${hora}`;
  }

  confirmarProduccion(form: FormGroup) {
    this.isSubmit = true;
    if (form.valid) {
      if (!form.pristine) {
        this.spinner.show();
        let produccion = new ProduccionDTO();
        this.armarDTOProduccion(produccion, form);
        this.subscription.add(
          this._produccionService.editProduccion(this.selectedProduccion.uuid, produccion).subscribe({
            next: res => {
              this.isSubmit = false;
              this.isEdicion = false;
              this.showMensajeAsignaNumero = false;
              this.showMensajeIsMayor = false;
              this.modificaCantidad = false;
              this.obtenerProducciones(false);
              // this.spinner.hide();
            },
            error: error => {
              this.spinner.hide();
              this.swalService.toastError('top-right', error.error.message);
              console.error(error);
            }
          })
        )
      } else {
        this.swalService.toastInfo('top-right', 'El formulario no se modificó.');
      }
    } else {
      this.swalService.toastError('top-right', 'Formulario inválido.');
    }
  }

  armarDTOProduccion(produccion: ProduccionDTO, form: FormGroup) {
    produccion.actual_role = this.actual_role;
    !form.get('responsableEjecucion')?.pristine && (produccion['user->responsible_uuid'] = form.get('responsableEjecucion')?.value);
    !form.get('cantidad')?.pristine && (produccion.quantity = form.get('cantidad')?.value);
    if (!form.get('fechaInicio')?.pristine) {
      produccion.production_datetime = this.convertirFechaADateBackend(form.get('fechaInicio')?.value);
    }
    if (this.modificaCantidad && this.showMensajeAsignaNumero) {
      // Se envían los nuevos números de serie.
      produccion.serial_numbers = form.get('numSerie')?.value;
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
    const total = this.producciones.length;

    if (total <= 5) {
      return 'ltr:right-0 rtl:left-0';
    }
    const mitad = total / 2;
    return index < mitad
      ? 'ltr:right-0 rtl:left-0'
      : 'bottom-full !mt-0 mb-1 whitespace-nowrap ltr:right-0 rtl:left-0';
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
    this.activeFilters = [];
    this.obtenerProducciones();
  }

  async changeEstadoProduccion(event: any) {
    const pasaALiberado = this.selectedProduccion?.current_state?.state?.name === 'Terminado' && event === 'next';

    const requiereJustificacion = !pasaALiberado &&
      ((this.selectedProduccion?.responsible?.user_name !== this.usuarioLogueado.user_name) ||
        (this.selectedProduccion?.current_state?.state?.name === 'Liberado' && event === 'previous'));


    let text: string;
    let isConfirmed = false;

    if (this.selectedProduccion?.responsible?.user_name === this.usuarioLogueado.user_name &&
      this.selectedProduccion?.current_state?.state?.name === 'Terminado'
      && event === 'next') {
      this.swalService.toastError('top-right', 'Una producción no puede ser liberada por el responsable de la misma');
      return;
    }

    if (requiereJustificacion) {
      // Modal con input
      const result = await Swal.fire({
        input: "textarea",
        inputLabel: "Cambio de estado",
        inputPlaceholder: "Escriba la justificación acá de ser necesario...",
        inputAttributes: {
          "aria-label": "Escriba la justificación acá de ser necesario..."
        },
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Confirmar',
        inputValidator: (value) => {
          if (!value) {
            return 'La justificación es requerida';
          }
          return null;
        },
      });

      text = result.value;
      isConfirmed = result.isConfirmed;
    } else {
      // Modal solo de confirmación
      const result = await Swal.fire({
        title: "¿Confirmar cambio de estado?",
        icon: "question",
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Confirmar'
      });

      isConfirmed = result.isConfirmed;
      text = '';
    }

    if (isConfirmed) {
      if (pasaALiberado) {
        this.openModalLiberacion(event, text);
      } else {
        this.confirmarCambioEstado(event, text);
      }
    }
  }


  confirmarCambioEstado(event: any, justificacion: string) {
    this.spinner.show();
    let produccionEstadoDTO = new ProduccionEstadoDTO();
    produccionEstadoDTO.actual_role = this.actual_role;
    produccionEstadoDTO.justification = justificacion;
    produccionEstadoDTO.production_state = event;
    this.subscription.add(
      this._produccionService.editEstadoProduccion(this.selectedProduccion.uuid, produccionEstadoDTO).subscribe({
        next: res => {
          this.obtenerProducciones(false);
          this.tokenService.setToken(res.token);
          this.spinner.hide();
        },
        error: error => {
          console.error(error);
          this.spinner.hide();
          this.swalService.toastError('top-right', error.error.message);
        },
      })
    )
  }

  irAlProducto(event: MouseEvent, data: any) {
    const baseUrl = window.location.origin + window.location.pathname;
    const urlTree = this.router.createUrlTree([`/dashboard/productos/${data.product?.uuid}`]);
    const url = this.router.serializeUrl(urlTree);
    if (event.ctrlKey || event.metaKey) {
      window.open(`${baseUrl}#${url}`, '_blank');
    } else {
      this.router.navigate([`/dashboard/productos/${data.product?.uuid}`]);
    }
  }

  showJustificacion(justificacion: string) {
    if (!justificacion) return '';
    if (justificacion.length <= 21) {
      return justificacion;
    }
    return justificacion.slice(0, 18) + '...';
  }

  getTooltipJustificacion(justificacion: string) {
    const v = (justificacion ?? '').toString();
    return v.replace(/(\S{20})/g, '$1\u200B');
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
      ['/dashboard/producciones', uuid],
      { queryParams: mergedQueryParams }
    );
    const url = this.router.serializeUrl(tree);
    this.location.replaceState(url);
  }

  openModalLiberacion(evento: string, justificacion: string) {
    this.liberacionForm = new FormGroup({
      identificado: new FormControl({ value: null, disabled: false }, [Validators.required]),
      terceros: new FormControl({ value: null, disabled: false }, []),
      evento: new FormControl({ value: evento, disabled: true }, []),
      justificacion: new FormControl({ value: justificacion, disabled: true }, []),
    });
    this.hayProductosTerceros = this.selectedProduccion?.frozen_components?.some((frozen: any) => frozen.origin === 'Provisto por terceros');
    if (this.hayProductosTerceros) {
      this.liberacionForm.get('terceros')?.setValidators([Validators.required]);
      this.liberacionForm.get('terceros')?.updateValueAndValidity({ emitEvent: false });
    } else {
      this.liberacionForm.get('terceros')?.disable();
    }
    this.modalLiberacion.options = this.modalOptions;
    this.modalLiberacion.open();
  }

  confirmarLiberacion() {
    const identificado = this.liberacionForm.get('identificado')?.value;
    const terceros = this.liberacionForm.get('terceros')?.value;
    // let hayProductosTerceros = this.selectedProduccion?.frozen_components?.some((frozen: any) => frozen.origin === 'Provisto por terceros');
    // Validar campo obligatorio "identificado"
    if (!identificado) {
      this.swalService.toastError('top-right', 'Debés confirmar que los productos están identificados.');
      return;
    }
    // Si hay productos provistos por terceros, entonces también es obligatorio tildar el checkbox de terceros
    if (this.hayProductosTerceros && !terceros) {
      this.swalService.toastError('top-right', 'Debés aceptar que hay componentes provistos por terceros.');
      return;
    }
    const evento = this.liberacionForm.get('evento')?.value;
    const justificacion = this.liberacionForm.get('justificacion')?.value;
    this.cerrarModalLiberacion();
    this.confirmarCambioEstado(evento, justificacion);
  }

  cerrarModalLiberacion() {
    this.modalLiberacion.close();
  }

  buildActiveFilters(): void {
    const list: Array<{ key: string; label: string; display: string }> = [];

    const pushIf = (key: string, label: string, value: any, extra: string = '') => {
      if (value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)) {
        list.push({ key, label, display: `${value}${extra}` });
      }
    };

    pushIf('product.name', 'Nombre', this.filtros['product.name'].value, this.filtros['product.name'].contiene ? ' (contiene)' : '');
    pushIf('batch.batch_identification', 'Lote', this.filtros['batch.batch_identification'].value, this.filtros['batch.batch_identification'].contiene ? ' (contiene)' : '');
    pushIf('frozenComponent.productInstance.serial_number', 'N° de serie', this.filtros['frozenComponent.productInstance.serial_number'].value);
    pushIf('__fecha_desde__', 'Fecha desde', this.filtroFechaProduccionDesde);
    pushIf('__fecha_hasta__', 'Fecha hasta', this.filtroFechaProduccionHasta);

    // Estados (convertir UUID a nombre)
    const estados = this.filtros['productionStates.possibleProductionState.uuid'].value;
    if (Array.isArray(estados) && estados.length > 0) {
      const nombres = (this.estados || [])
        .filter(e => estados.includes(e.uuid))
        .map(e => e.name)
        .join(', ');
      list.push({ key: 'productionStates.possibleProductionState.uuid', label: 'Estados', display: nombres });
    }

    // Usuarios
    const users = this.filtros['user->responsible.uuid'].value;
    if (Array.isArray(users) && users.length > 0) {
      const nombres = (this.usuariosParaFiltrar || [])
        .filter(u => users.includes(u.uuid))
        .map(u => u.user_name)
        .join(', ');
      list.push({ key: 'user->responsible.uuid', label: 'Usuarios', display: nombres });
    }
    this.activeFilters = list;
  }

  clearFilter(key: string): void {
    switch (key) {
      case 'product.name':
      case 'batch.batch_identification':
        this.filtros[key].value = '';
        this.filtros[key].contiene = true;
        break;
      case 'frozenComponent.productInstance.serial_number':
        this.filtros[key].value = '';
        break;
      case 'productionStates.possibleProductionState.uuid':
      case 'user->responsible.uuid':
        this.filtros[key].value = [];
        break;
      case '__fecha_desde__':
        this.filtroFechaProduccionDesde = '';
        break;
      case '__fecha_hasta__':
        this.filtroFechaProduccionHasta = '';
        break;
    }

    this.buildActiveFilters();
    this.obtenerProduccionesPorFiltroAvanzado();
  }

  busquedaComponenteNoLiberado(data: any) {
    this.filtroSimpleName = data.name;
    this.filtroSimpleContiene = false;
    this.obtenerProduccionesPorFiltroSimple();
  }


}
