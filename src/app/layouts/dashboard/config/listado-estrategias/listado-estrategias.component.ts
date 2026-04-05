import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { ModalOptions, NgxCustomModalComponent } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { forkJoin, Subscription } from 'rxjs';
import { EstrategiaDTO } from 'src/app/core/models/request/estrategiaDTO';
import { EstrategiaResponse } from 'src/app/core/models/response/estrategiaResponse';
import { EstrategiasService } from 'src/app/core/services/estrategias.service';
import { PrincipioService } from 'src/app/core/services/principio.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { IconInfoCircleComponent } from 'src/app/shared/icon/icon-info-circle';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-estrategias',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, NgxTippyModule, DataTableModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule,
    IconPlusComponent, IconPencilComponent, IconTrashLinesComponent, IconInfoCircleComponent, NgbPagination, IconSearchComponent, FontAwesomeModule, NgSelectModule],
  templateUrl: './listado-estrategias.component.html',
  styleUrl: './listado-estrategias.component.css'
})
export class ListadoEstrategiasComponent {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';

  estrategias: any[] = [];
  principios: any[] = [];
  estrategiaForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;
  originalCheckedState: boolean = false;

  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;

  // Filtro
  filtros: any = {};
  MIN_FILTER_SIZE = 3;
  showFilter: boolean = false;

  // Referencia al modal para crear y editar bancos.
  @ViewChild('modalEstrategia') modalEstrategia!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private swalService: SwalService, private _principioService: PrincipioService,
    private spinner: NgxSpinnerService, private _estrategiasService: EstrategiasService) {
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
    this.obtenerEstrategiasAndPrincipios();
  }

  obtenerEstrategiasAndPrincipios() {
    let $parametros = this._estrategiasService.getEstrategias();
    let $principios = this._principioService.getPrincipiosHabilitados();

    this.subscription.add(
      forkJoin([$parametros, $principios]).subscribe(
        ([respuesta1, respuesta2]) => {
          this.estrategias = respuesta1.sort((a, b) => a.principioAgroecologico.nombre.localeCompare(b.principioAgroecologico.nombre));
          this.modificarPaginacion(respuesta1);
          // if (this.estrategias.length <= this.MAX_ITEMS_PER_PAGE) {
          //   this.itemsInPage = this.estrategias.length;
          // }
          this.principios = respuesta2;
          this.spinner.hide();
        },
        error => {
          this.spinner.hide();
          console.error(error);
        }
      )
    );
  }

  modificarPaginacion(res: any) {
    if (this.estrategias.length <= this.itemsPerPage) {
      this.itemsInPage = res.length;
    } else {
      this.itemsInPage = this.currentPage * this.itemsPerPage;
    }
  }

  public onPageChange(pageNum: number): void {
    this.pageSize = this.itemsPerPage * (pageNum - 1);
    this.itemsInPage = pageNum * this.itemsPerPage;
    if (this.itemsInPage > this.estrategias.length) {
      this.itemsInPage = this.estrategias.length;
    }
  }

  public changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  filtrarDatos(): EstrategiaResponse[] {
    let resultados = this.estrategias;
    if (this.filtros.nombre && this.filtros.nombre.length >= this.MIN_FILTER_SIZE) {
      resultados = resultados.filter(dato =>
        dato.nombre.toLocaleLowerCase().includes(this.filtros.nombre.toLowerCase()))
    }
    if (this.filtros.principio && this.filtros.principio.length >= this.MIN_FILTER_SIZE) {
      resultados = resultados.filter(dato =>
        dato.principioAgroecologico.nombre.toLocaleLowerCase().includes(this.filtros.principio.toLowerCase()))
    }
    return resultados;
  }

  openModalNuevoEstrategia(type: string, estrategia?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nueva estrategia';
      this.estrategiaForm = new FormGroup({
        nombre: new FormControl(null, [Validators.required]),
        situacionEsperable: new FormControl(null, []),
        principio: new FormControl(null, [Validators.required])
      });
    } else if (type === 'EDIT') {
      this.isEdicion = true;
      this.tituloModal = 'Edición estrategia';
      this.estrategiaForm = new FormGroup({
        id: new FormControl(estrategia?.id, []),
        nombre: new FormControl(estrategia?.nombre, [Validators.required]),
        situacionEsperable: new FormControl(estrategia?.situacionEsperable, [Validators.required]),
        principio: new FormControl(estrategia?.principioAgroecologico?.id, [Validators.required])
      });
    } else {
      this.isEdicion = false;
      this.tituloModal = 'Información de estrategia';
      this.estrategiaForm = new FormGroup({
        id: new FormControl({ value: estrategia?.id, disabled: true }, []),
        nombre: new FormControl({ value: estrategia?.nombre, disabled: true }, [Validators.required]),
        situacionEsperable: new FormControl({ value: estrategia?.situacionEsperable, disabled: true }, [Validators.required]),
        principio: new FormControl({ value: estrategia?.principioAgroecologico?.id, disabled: true }, [Validators.required])
      });
    }
    this.modalEstrategia.options = this.modalOptions;
    this.modalEstrategia.open();
  }

  confirmarEstrategia() {
    this.isSubmit = true;
    if (this.estrategiaForm.valid) {
      this.spinner.show();
      let estrategia = new EstrategiaDTO();
      estrategia.nombre = this.estrategiaForm.get('nombre')?.value;
      estrategia.situacionEsperable = this.estrategiaForm.get('situacionEsperable')?.value;
      estrategia.principioAgroecologico = this.estrategiaForm.get('principio')?.value;
      if (!this.isEdicion) {
        this.subscription.add(
          this._estrategiasService.save(estrategia).subscribe({
            next: res => {
              this.obtenerEstrategiasAndPrincipios();
              this.cerrarModal();
              this.spinner.hide();
            },
            error: error => {
              this.swalService.toastError('top-right', error.error.message);
              console.error(error);
              this.spinner.hide();
            }
          })
        )
      } else {
        this.subscription.add(
          this._estrategiasService.updateEstrategia(estrategia, this.estrategiaForm.get('id')?.value).subscribe({
            next: res => {
              this.obtenerEstrategiasAndPrincipios();
              this.cerrarModal();
              this.spinner.hide();
            },
            error: error => {
              console.error(error);
              this.spinner.hide();
              this.swalService.toastError('top-right', error.error.message);
            }
          })
        )
      }
    }
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalEstrategia.close();
  }

  openSwalCambiarEstadoEstrategia(estrategia: any, checkboxId: string) {
    this.originalCheckedState = estrategia.habilitado;
    Swal.fire({
      title: '',
      text: '¿Desea habilitar/deshabilitar la posición?',
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
      const checkbox = document.getElementById(checkboxId) as HTMLInputElement;
      if (result.isConfirmed) {
        this.cambiarEstadoEstrategia(estrategia, checkbox);
      } else if (result.isDenied) {
        checkbox.checked = this.originalCheckedState;
      }
    })
  }

  cambiarEstadoEstrategia(estrategia: any, checkbox: any) {
    this.spinner.show();
    this.subscription.add(
      this._estrategiasService.updateStatus(estrategia.id).subscribe({
        next: res => {
          this.swalService.toastSuccess('top-right', 'Estado modificado con éxito.');
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          this.swalService.toastError('top-right', error.error.detalleError);
          checkbox.checked = this.originalCheckedState;
          console.error(error);
        }
      })
    )
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        'nombre': ''
      };
      this.obtenerEstrategiasAndPrincipios();
    }
  }

  // cambiarOrdenamiento(column: string) {
  //   // si el ordenamiento es asc, lo cambiamos a desc y si es desc, lo cambiamos a sin ordenamiento
  //   if (this.ordenamiento[column] === 'asc') {
  //     this.ordenamiento[column] = 'desc';
  //   } else if (this.ordenamiento[column] === 'desc') {
  //     this.ordenamiento[column] = 'asc';
  //   }
  //   this.obtenerBancos();
  // }


}
