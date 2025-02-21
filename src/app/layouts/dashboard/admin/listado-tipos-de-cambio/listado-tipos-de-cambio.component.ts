import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faArrowDown, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { NgbDateStruct, NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { FlatpickrDirective } from 'angularx-flatpickr';
import { FlatpickrDefaultsInterface } from 'angularx-flatpickr';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { TipoCambioDTO } from 'src/app/core/models/request/tipoCambioDTO';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TiposCambioService } from 'src/app/core/services/tiposCambio.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';
import { Spanish } from "flatpickr/dist/l10n/es.js"

@Component({
  selector: 'app-listado-tipos-de-cambio',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, NgbPaginationModule, FontAwesomeModule, FormsModule, ReactiveFormsModule, NgxCustomModalComponent,
    IconTrashLinesComponent, IconPencilComponent, IconSearchComponent, IconPlusComponent, NgSelectComponent, NgbModule,
    FlatpickrDirective
  ],
  templateUrl: './listado-tipos-de-cambio.component.html',
  styleUrl: './listado-tipos-de-cambio.component.css'
})
export class ListadoTiposDeCambioComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';

  tiposCambio: any[] = [];
  tipoCambioForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;
  monedas: any[] = [];

  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  // Orden y filtro
  filtros: any = {
    currency_name: ''
  };
  showFilter: boolean = false;
  ordenamiento: any = {
    datetime_from: 'desc'
  };

  selectedDate: any;
  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;
  iconCalendar = faCalendar;

  dateTime: FlatpickrDefaultsInterface;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalTipoCambio') modalTipoCambio!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _tiposCambioService: TiposCambioService, private spinner: NgxSpinnerService, private tokenService: TokenService) {
    this.initStore();
    this.dateTime = {
      enableTime: true,
      enableSeconds: true,
      defaultSeconds: 0,
      defaultMinute: 0,
      defaultHour: 0,
      locale: Spanish,
      allowInput: true,
      convertModelValue: true,
      dateFormat: 'Y-m-d H:i:S',
    };
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
    this.obtenerTiposCambio();
    this.obtenerMonedas();
  }

  obtenerTiposCambio() {
    this.spinner.show();

    const params: any = {};
    params.with = ["currency"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getTiposCambioWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.spinner.hide();
          this.tiposCambio = res.data;
          this.modificarPaginacion(res);
        },
        error: error => {
          this.spinner.hide();
          console.error(error);
        }
      })
    )
  }

  obtenerMonedas() {
    this.subscription.add(
      this._indexService.getMonedas(this.actual_role).subscribe({
        next: res => {
          this.monedas = res.data;
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
    if (this.tiposCambio.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  openModalNuevoTipo(type: string, tipo?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nuevo tipo de cambio';
      this.tipoCambioForm = new FormGroup({
        moneda: new FormControl(null, [Validators.required]),
        valor: new FormControl(null, [Validators.required]),
        datetime_from: new FormControl(this.formatDate(new Date), []),
      });
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición tipo de cambio';
      this.tipoCambioForm = new FormGroup({
        uuid: new FormControl(tipo?.uuid, []),
        moneda: new FormControl(tipo?.currency?.uuid, [Validators.required]),
        valor: new FormControl(tipo?.rate, [Validators.required]),
        datetime_from: new FormControl(tipo?.datetime_from, []),
        datetime_to: new FormControl(tipo?.datetime_to, []),
      });
      if (!tipo.datetime_to) {
        this.tipoCambioForm.get('datetime_to')?.disable();
      }
    }
    this.modalTipoCambio.options = this.modalOptions;
    this.modalTipoCambio.open();
  }
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses van de 0 a 11
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  confirmarTipoCambio() {
    this.isSubmit = true;
    if (this.tipoCambioForm.valid) {
      this.spinner.show();
      let tipo = new TipoCambioDTO();
      tipo.currency_uuid = this.tipoCambioForm.get('moneda')?.value;
      tipo.rate = this.tipoCambioForm.get('valor')?.value;
      tipo.datetime_from = this.tipoCambioForm.get('datetime_from')?.value;
      tipo.actual_role = this.actual_role;
      if (!this.isEdicion) {
        this.subscription.add(
          this._tiposCambioService.saveTipo(tipo).subscribe({
            next: res => {
              this.obtenerTiposCambio();
              this.cerrarModal();
              this.swalService.toastSuccess('top-right', res.message);
              this.tokenService.setToken(res.token);
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
        tipo.datetime_to = this.tipoCambioForm.get('datetime_to')?.value;
        this.subscription.add(
          this._tiposCambioService.editTipo(this.tipoCambioForm.get('uuid')?.value, tipo).subscribe({
            next: res => {
              // const index = this.tiposCambio.findIndex(p => p.uuid === (this.tipoCambioForm.get('uuid')?.value));
              // if (index !== -1) {
              //   this.tiposCambio[index] = {
              //     ...this.tiposCambio[index],
              //     name: this.tipoCambioForm.get('nombre')?.value,
              //     datetime_from: this.tipoCambioForm.get('datetime_from')?.value,
              //     datetime_to: this.tipoCambioForm.get('datetime_to')?.value
              //   };
              //   this.tiposCambio = [...this.tiposCambio];
              // }
              this.obtenerTiposCambio();
              this.cerrarModal();
              this.swalService.toastSuccess('top-right', res.message)
              this.tokenService.setToken(res.token);
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
    this.modalTipoCambio.close();
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        currency_name: ''
      };
      this.obtenerTiposCambio();
    }
  }

  cambiarOrdenamiento(column: string) {
    if (this.ordenamiento[column] === 'asc') {
      this.ordenamiento[column] = 'desc';
    } else if (this.ordenamiento[column] === 'desc') {
      this.ordenamiento[column] = 'asc';
    }
    this.obtenerTiposCambio();
  }

}
