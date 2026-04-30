import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataTableModule, IconCheckComponent } from '@bhplugin/ng-datatable';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { NgbPagination, NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { FlatpickrDirective } from 'angularx-flatpickr';
import { ModalOptions, NgxCustomModalComponent } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { imagenInfoVisita } from 'src/app/core/models/request/imagenInfoVisita';
import { ParametroResponse } from 'src/app/core/models/response/parametroResponse';
import { UsuarioResponse } from 'src/app/core/models/response/usuarioResponse';
import { VisitaResponse } from 'src/app/core/models/response/visitaResponse';
import { EstrategiasService } from 'src/app/core/services/estrategias.service';
import { ImagenVisitaService } from 'src/app/core/services/imagenVisita.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { UserService } from 'src/app/core/services/user.service';
import { VisitasService } from 'src/app/core/services/visitas.service';
import { IconFileComponent } from 'src/app/shared/icon/icon-file';
import { IconInfoCircleComponent } from 'src/app/shared/icon/icon-info-circle';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';

@Component({
  selector: 'app-listado-proximas-visitas',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule, NgbPagination, IconSearchComponent, FontAwesomeModule, NgSelectModule, FlatpickrDirective],
  templateUrl: './listado-proximas-visitas.component.html',
  styleUrl: './listado-proximas-visitas.component.css'
})
export class ListadoProximasVisitasComponent {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';
  selectedType!: string;

  quintaId: number | undefined;
  selectedImagenes: File[] = [];
  imagenesVisita: imagenInfoVisita[] = [];
  selectedVisita: any;
  usuariosActivos: UsuarioResponse[] = [];
  parametros: ParametroResponse[] = [];

  visitas: VisitaResponse[] = [];
  visitaForm!: FormGroup;
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

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;


  // Referencia al modal para crear y editar bancos.
  @ViewChild('modalVisita') modalVisita!: NgxCustomModalComponent;
  @ViewChild('modalImagen') modalImagen!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private swalService: SwalService, private _estrategiaService: EstrategiasService,
    private spinner: NgxSpinnerService, private imagenService: ImagenVisitaService, private _visitaService: VisitasService,
    private route: ActivatedRoute, private router: Router, private _usuarioService: UserService) {
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
    this.obtenerVisitas();
  }

  obtenerVisitas() {
    this.subscription.add(
      this._visitaService.getVisitas().subscribe({
        next: res => {
          this.spinner.hide();
          this.visitas = res;
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
    if (res.length <= this.itemsPerPage) {
      this.itemsInPage = res.length;
    } else {
      this.itemsInPage = this.currentPage * this.itemsPerPage;
    }
  }

  public onPageChange(pageNum: number): void {
    this.pageSize = this.itemsPerPage * (pageNum - 1);
    this.itemsInPage = pageNum * this.itemsPerPage;
    if (this.itemsInPage > this.visitas.length) {
      this.itemsInPage = this.visitas.length;
    }
  }

  public changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  filtrarDatos(): VisitaResponse[] {
    let resultados = this.visitas;
    if (this.filtros.nombreProductor) {
      resultados = resultados.filter(dato =>
        dato.quintaResponse.nombreProductor.toLocaleLowerCase().includes(this.filtros.nombreProductor.toLowerCase()))
    }
    if (this.filtros.direccion) {
      resultados = resultados.filter(dato =>
        dato.quintaResponse.direccion.toLocaleLowerCase().includes(this.filtros.direccion.toLowerCase()))
    }
    return resultados;
  }

  siguienteVisita(fechaUltimaVisita: string) {
    let fechaAdelantada = null;
    if (fechaUltimaVisita != null) {
      const ultimaVisita = new Date(fechaUltimaVisita);
      fechaAdelantada = new Date(ultimaVisita.getTime() + (365 * 24 * 60 * 60 * 1000));
    }
    return fechaAdelantada;
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        'productor': '',
        'direccion': '',
      };
      this.obtenerVisitas();
    }
  }


}
