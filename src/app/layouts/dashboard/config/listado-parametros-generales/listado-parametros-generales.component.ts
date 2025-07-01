import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { ParametrosDTO } from 'src/app/core/models/request/parametrosDTO';
import { BancosService } from 'src/app/core/services/bancos.service';
import { IndexService } from 'src/app/core/services/index.service';
import { ParametroService } from 'src/app/core/services/parametro.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';

@Component({
  selector: 'app-listado-parametros-generales',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, NgxTippyModule, FormsModule, ReactiveFormsModule, NgSelectModule, NgbPagination,
    IconPencilComponent, NgxCustomModalComponent
  ],
  templateUrl: './listado-parametros-generales.component.html',
  styleUrl: './listado-parametros-generales.component.css'
})
export class ListadoParametrosGeneralesComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();
  actual_role: string = '';

  // Referencia al modal para crear y editar bancos.
  @ViewChild('modalParametro') modalParametro!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

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
  };
  showFilter: boolean = false;
  ordenamiento: any = {
  };

  parametros: any[] = [];
  isEdicion: boolean = false;
  isSubmit: boolean = false;
  tituloModal: string = '';
  parametroForm: any = FormGroup;

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _parametrosService: ParametroService, private spinner: NgxSpinnerService, private tokenService: TokenService) {
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
    this.obtenerParametros();
  }

  obtenerParametros() {
    this.spinner.show();
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = [];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getParametrosWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.spinner.hide();
          this.parametros = res.data;
          console.log("🚀 ~ ListadoParametrosGeneralesComponent ~ this._indexService.getParametrosWithParam ~ this.parametros:", this.parametros)
          this.modificarPaginacion(res);
        },
        error: error => {
          this.spinner.hide();
          console.error(error);
        }
      })
    )
  }

  modificarPaginacion(res: any) {
    this.total_rows = res.meta.total;
    this.last_page = res.meta.last_page;
    if (this.parametros.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  openModalParametro(type: string, parametro?: any) {
    if (type === 'NEW') {
      // this.isEdicion = false;
      // this.tituloModal = 'Nuevo parametro';
      // this.parametroForm = new FormGroup({
      //   nombre: new FormControl(null, [Validators.required]),
      // });
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición parámetro';
      this.parametroForm = new FormGroup({
        uuid: new FormControl(parametro?.uuid, []),
        minimaDiferencia: new FormControl(parametro?.unit_price_minimum_difference_percent, [Validators.required]),
        maximaDiferencia: new FormControl(parametro?.unit_price_maximum_difference_percent, [Validators.required])
      });
    }
    this.modalParametro.options = this.modalOptions;
    this.modalParametro.open();
  }

  confirmarParametro() {
    this.isSubmit = true;
    if (this.parametroForm.valid) {
      this.spinner.show();
      let parametro = new ParametrosDTO();
      parametro.actual_role = this.actual_role;
      parametro.unit_price_minimum_difference_percent = +this.parametroForm.get('minimaDiferencia')?.value;
      parametro.unit_price_maximum_difference_percent = +this.parametroForm.get('maximaDiferencia')?.value;
      this.subscription.add(
        this._parametrosService.editParametros(this.parametroForm.get('uuid')?.value, parametro).subscribe({
          next: res => {
            console.log(res);
            this.obtenerParametros();
            this.spinner.hide();
            this.cerrarModal();
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

  cerrarModal() {
    this.isEdicion = false;
    this.isSubmit = false;
    this.modalParametro.close();
  }
}
