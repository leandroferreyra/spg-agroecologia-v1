import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { forkJoin, Subscription } from 'rxjs';
import { ComponenteDTO } from 'src/app/core/models/request/componenteDTO';
import { ComponentesService } from 'src/app/core/services/componentes.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconCircleCheckComponent } from 'src/app/shared/icon/icon-circle-check';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-componentes',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgxSpinnerModule, NgxTippyModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule,
    NgSelectModule, IconTrashLinesComponent, IconPencilComponent, IconSearchComponent, IconPlusComponent, IconCircleCheckComponent],
  templateUrl: './componentes.component.html',
  styleUrl: './componentes.component.css'
})
export class ComponentesComponent implements OnInit, OnDestroy {

  @Input() producto: any;
  @Input() rol!: string;
  componentes: any[] = [];

  private subscription: Subscription = new Subscription();

  // Orden, filtro y paginación para compras de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  filtros: any = {
    'product->parent_product_uuid': { value: '', op: '=', contiene: false },
    'product->childProduct.productType.name': { value: 'Procesos IP LADIE', op: '!=', contiene: false },
  };
  showFilterCompras: boolean = false;
  ordenamiento: any = {
  };

  componenteForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalComponente') modalComponente!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  // Catalogos
  proveedores: any[] = [];
  productos: any[] = [];
  procesos: any[] = [];
  componenteProceso: any[] = [];

  placeholderCantidad: string = '';

  procesoActivo: any;
  isEdicionProceso: boolean = false;

  constructor(private _indexService: IndexService, private _swalService: SwalService, private spinner: NgxSpinnerService,
    private _tokenService: TokenService, private _componenteService: ComponentesService) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['producto'] && changes['producto'].currentValue) {
      this.spinner.show();
      this.isEdicionProceso = false;
      // Si el producto cambia, actualizamos los filtros y obtenemos los componentes
      this.filtros['product->parent_product_uuid'].value = this.producto.uuid;
      this.obtenerComponentes();
    }
  }

  obtenerComponentes() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["childProduct.productType", "supplier.person.human", "supplier.person.legalEntity"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getComponentesWithParam(params, this.rol).subscribe({
        next: res => {
          this.componentes = res.data;
          if (this.componentes.length === 0) {
            this._swalService.toastSuccess('center', 'El producto no posee componentes.');
          }
          // console.log(this.componentes);
          // this.orderProcesosPrimero();
          this.modificarPaginacion(res);
          this._tokenService.setToken(res.token);
          this.obtenerCatalogos();
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
    if (this.componentes.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  disableProducto = (item: any): boolean => {
    return (item.uuid === this.producto.uuid) || this.esComponente(item);
  };

  esComponente(item: any) {
    if (this.componentes.length > 0) {
      const idsComponentes = new Set(this.componentes.map(c => c.child_product.uuid));
      return idsComponentes.has(item.uuid)
    }
    return false;
  }


  obtenerCatalogos() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["productType", "measure"];
    params.paging = null;
    params.page = null;
    params.order_by = {};
    params.filters = {};

    const paramsProcesos: any = {};
    paramsProcesos.with = [];
    paramsProcesos.paging = null;
    paramsProcesos.page = null;
    paramsProcesos.order_by = {};
    paramsProcesos.filters = {
      'productType.name': { value: 'Procesos IP LADIE', op: '=', contiene: false }
    };

    const paramsComponenteProceso: any = {};
    paramsComponenteProceso.with = ["childProduct.productType", "supplier.person.human", "supplier.person.legalEntity"];
    paramsComponenteProceso.paging = null;
    paramsComponenteProceso.page = null;
    paramsComponenteProceso.order_by = {};
    paramsComponenteProceso.filters = {
      'product->childProduct.productType.name': { value: 'Procesos IP LADIE', op: '=', contiene: false }
    };

    forkJoin({
      proveedores: this._indexService.getProveedores(this.rol),
      productos: this._indexService.getProductosPosiblesWithParam(params, this.rol, this.producto.uuid),
      procesos: this._indexService.getProductosWithParam(paramsProcesos, this.rol),
      componenteProceso: this._indexService.getComponentesWithParam(paramsComponenteProceso, this.rol),
    }).subscribe({
      next: res => {
        this.proveedores = res.proveedores.data;
        this.proveedores = this.proveedores.map(proveedor => ({
          ...proveedor,
          nombreCompleto: this.bindName(proveedor)
        }));
        this.productos = res.productos.data;
        this.productos = this.productos.map(p => ({
          ...p,
          disabled: this.disableProducto(p) // Solo deshabilita el que coincide
        }));
        this.procesos = res.procesos.data;
        this.componenteProceso = res.componenteProceso.data;
        if (this.componenteProceso.length > 0) {
          this.procesoActivo = this.componenteProceso[0].child_product?.uuid;
        }
        console.log(this.procesos);
        console.log(this.componenteProceso);
      },
      error: error => {
        console.error('Error cargando catalogos:', error);
      }
    });
  }

  openModalComponente(type: string, dato?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nuevo componente';
      this.componenteForm = new FormGroup({
        child_product_uuid: new FormControl(null, Validators.required),
        quantity: new FormControl({ value: null, disabled: true }, Validators.required),
        supplier_uuid: new FormControl(null, [])
      });
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición componente';
      this.placeholderCantidad = 'Cantidad en ' + dato.child_product.measure?.name;
      this.componenteForm = new FormGroup({
        uuid: new FormControl(dato.uuid),
        parent_product_uuid: new FormControl(this.producto.uuid, Validators.required),
        child_product_uuid: new FormControl(dato.child_product?.uuid, []),
        quantity: new FormControl(this.mostrarCantidad(dato), Validators.required),
        supplier_uuid: new FormControl(dato.supplier?.uuid, [])
      });
    }
    this.onFormChange();
    this.modalComponente.options = this.modalOptions;
    this.modalComponente.open();
  }

  onFormChange() {
    this.componenteForm.get('child_product_uuid')!.valueChanges.subscribe(
      (value) => {
        if (value) {
          let producto = this.productos.find(p => p.uuid === value);
          this.componenteForm.get('quantity')?.enable();
          this.componenteForm.get('quantity')?.setValue('');
          this.placeholderCantidad = 'Cantidad en ' + producto.measure?.name;
        } else {
          this.componenteForm.get('quantity')?.disable();
          this.placeholderCantidad = '';
        }
      });
  }


  cerrarModal() {
    this.isSubmit = false;
    this.placeholderCantidad = '';
    this.modalComponente.close();
  }

  confirmarComponente() {
    this.isSubmit = true;
    if (this.componenteForm.valid) {
      this.spinner.show();
      let componente = new ComponenteDTO();
      this.armarDTOComponente(componente);
      if (!this.isEdicion) {
        this.subscription.add(
          this._componenteService.saveComponente(componente).subscribe({
            next: res => {
              this.spinner.hide();
              this.obtenerComponentes();
              this.cerrarModal();
            },
            error: error => {
              this.spinner.hide();
              this._swalService.toastError('top-right', error.error.message)
              console.error(error);
            }
          })
        )
      } else {
        this.subscription.add(
          this._componenteService.editComponente(this.componenteForm.get('uuid')?.value, componente).subscribe({
            next: res => {
              this.obtenerComponentes();
              this.isEdicion = false;
              this.cerrarModal();
              this._swalService.toastSuccess('top-right', "Usuario actualizado.");
              this.spinner.hide();
            },
            error: error => {
              this.spinner.hide();
              this._swalService.toastError('top-right', error.error.message);
              console.error(error);
            }
          })
        )
      }
    }
  }
  armarDTOComponente(componente: ComponenteDTO) {
    componente.actual_role = this.rol;
    componente.with = ["childProduct", "childProduct.productType", "childProduct.measure", "supplier.person.human", "supplier.person.legalEntity"];
    componente['product->child_product_uuid'] = this.componenteForm.get('child_product_uuid')?.value;
    componente['product->parent_product_uuid'] = this.producto.uuid;
    componente.quantity = this.componenteForm.get('quantity')?.value;
    componente.supplier_uuid = this.componenteForm.get('supplier_uuid')?.value;
    if (!this.isEdicion) {
      this.cleanObject(componente);
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

  openSwalEliminar(componente: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el componente ${componente.child_product.name}?`,
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
        this.eliminarComponente(componente);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarComponente(componente: any) {
    this.spinner.show();
    this.subscription.add(
      this._componenteService.deleteComponent(componente.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerComponentes();
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

  getNombreCompletoProveedor(data: any): string {
    if (!data.supplier?.person) return '';
    if (data.supplier.person.human) {
      return data.supplier.person.human.firstname + ' ' + data.supplier.person.human.lastname;
    } else if (data.supplier.person.legal_entity) {
      return data.supplier.person.legal_entity.company_name;
    }
    return '';
  }

  bindName(data: any): string {
    if (!data.person) return '';
    if (data.person.human) {
      return data.person.human.firstname + ' ' + data.person.human.lastname;
    } else if (data.person.legal_entity) {
      return data.person.legal_entity.company_name;
    }
    return '';
  }

  mostrarCantidad(data: any) {
    if (data.child_product?.measure?.is_integer === 1) {
      return (+data.quantity)?.toFixed(0);
    } else {
      return (+data.quantity)?.toFixed(2);
    }
  }

  editarProceso() {
    this.isEdicionProceso = true;
  }

  cancelarEdicion() {
    this.isEdicionProceso = false;
  }

  guardarProceso() {
    this.isEdicionProceso = false;
    let componente = new ComponenteDTO();
    componente.actual_role = this.rol;
    componente.with = [];
    componente['product->child_product_uuid'] = this.procesoActivo;
    componente['product->parent_product_uuid'] = this.producto.uuid;
    componente.quantity = 1;
    this.cleanObject(componente);
    this.subscription.add(
      this._componenteService.saveComponente(componente).subscribe({
        next: res => {
          console.log(res);
        },
        error: error => {
          this.spinner.hide();
          this._swalService.toastError('top-right', error.error.message)
          console.error(error);
        }
      })
    )
  }


  eliminarProcesoActivo() {
    if (this.componenteProceso.length > 0) {
      this.subscription.add(
        this._componenteService.deleteComponent(this.componenteProceso[0].uuid, this.rol.toUpperCase()).subscribe({
          next: res => {
            this.procesoActivo = '';
            this._tokenService.setToken(res.token);
          },
          error: error => {
            console.error(error);
            this._swalService.toastError('top-right', error.error.message);
          }
        })
      )
    }
  }

}
