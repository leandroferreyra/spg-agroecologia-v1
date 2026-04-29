import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { NgbCarouselModule, NgbDatepicker, NgbDateStruct, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { FlatpickrDirective } from 'angularx-flatpickr';
import { ModalOptions, NgxCustomModalComponent } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { forkJoin, Subscription } from 'rxjs';
import { imagenInfoVisita } from 'src/app/core/models/request/imagenInfoVisita';
import { VisitaDTO } from 'src/app/core/models/request/visitaDTO';
import { VisitaParametroDTO } from 'src/app/core/models/request/visitaParametroDTO';
import { ParametroResponse } from 'src/app/core/models/response/parametroResponse';
import { UsuarioResponse } from 'src/app/core/models/response/usuarioResponse';
import { VisitaResponse } from 'src/app/core/models/response/visitaResponse';
import { EstrategiasService } from 'src/app/core/services/estrategias.service';
import { ImagenQuintaService } from 'src/app/core/services/imagenQuinta.service';
import { ImagenVisitaService } from 'src/app/core/services/imagenVisita.service';
import { PrincipioService } from 'src/app/core/services/principio.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { UserService } from 'src/app/core/services/user.service';
import { VisitasService } from 'src/app/core/services/visitas.service';
import { IconCheckComponent } from 'src/app/shared/icon/icon-check';
import { IconFileComponent } from 'src/app/shared/icon/icon-file';
import { IconInfoCircleComponent } from 'src/app/shared/icon/icon-info-circle';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-visitas',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, NgxTippyModule, DataTableModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule,
    IconPlusComponent, IconPencilComponent, IconInfoCircleComponent, IconFileComponent, IconTrashLinesComponent,
    NgbPagination, IconSearchComponent, FontAwesomeModule, NgSelectModule, NgbCarouselModule, FlatpickrDirective, IconCheckComponent],
  templateUrl: './listado-visitas.component.html',
  styleUrl: './listado-visitas.component.css'
})
export class ListadoVisitasComponent {

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

  visitas: any[] = [];
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
    // this.obtenerPrincipios();
    this.quintaId = this.route.snapshot.params['id'];
    this.obtenerVisitas();
    let $parametros = this._estrategiaService.getParametrosHabilitados();
    let $usuariosActivos = this._usuarioService.getUsuariosActivos();

    this.subscription.add(
      forkJoin([$usuariosActivos, $parametros]).subscribe(
        ([respuesta1, respuesta2]) => {
          this.usuariosActivos = respuesta1;
          this.parametros = respuesta2;
        },
        error => {
          console.error(error);
        }
      )
    );
  }

  obtenerVisitas() {
    if (this.quintaId === undefined) {
      console.error('quintaId es undefined');
      return;
    }
    this.spinner.show();
    this.subscription.add(
      this._visitaService.getVisitaByQuintaId(this.quintaId).subscribe({
        next: res => {
          this.spinner.hide();
          this.visitas = res;
          // console.log("🚀 ~ ListadoVisitasComponent ~ obtenerVisitas ~ this.visitas:", this.visitas)
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

  // filtrarDatos(): PrincipioResponse[] {
  //   let resultados = this.principios;
  //   if (this.filtros.nombre && this.filtros.nombre.length >= this.MIN_FILTER_SIZE) {
  //     resultados = resultados.filter(dato =>
  //       dato.nombre.toLocaleLowerCase().includes(this.filtros.nombre.toLowerCase()))
  //   }
  //   return resultados;
  // }

  openModalVisita(type: string, visita?: any) {
    this.selectedType = type;
    this.selectedVisita = visita;
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nueva visita';
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición visita';
    }
    this.inicializarForm(visita);
    this.modalVisita.options = this.modalOptions;
    this.modalVisita.open();
  }

  inicializarForm(visita?: VisitaResponse) {
    if (this.selectedType === 'NEW') {
      this.visitaForm = new FormGroup({
        integrantes: new FormControl(null, [Validators.required]),
        fechaVisita: new FormControl(null, [Validators.required]),
        comentarios: new FormControl(null, []),
        visitasParametros: new FormArray([])
      });
      // Arma de manera dinámica los forms según la cantidad de parámetros.
      for (let i = this.visitasParametros.length; i < this.parametros.length; i++) {
        let param = this.parametros[i];
        this.visitasParametros.push(new FormGroup({
          paramNombre: new FormControl(param.nombre, []),
          situacionEsperable: new FormControl(param.situacionEsperable, []),
          principioAgroecologico: new FormControl(param.principioAgroecologico.nombre, []),
          parametroId: new FormControl(param.id, [Validators.required]),
          cumple: new FormControl(false, [Validators.required]),
          sugerencias: new FormControl(null, []),
          comentarios: new FormControl(null, []),
          aspiracionesFamiliares: new FormControl(null, [])
        }));
      }
    } else if (this.selectedType === 'EDIT') {
      this.visitaForm = new FormGroup({
        integrantes: new FormControl(visita?.integrantes, [Validators.required]),
        comentarios: new FormControl(visita?.comentarios, []),
        fechaVisita: new FormControl(this.formatearFechaParaFlatpickr(visita!.fechaVisita), [Validators.required]),
        visitasParametros: new FormArray([])
      });
      let idsIntegrantes: number[] = [];
      visita!.integrantes.forEach(element => {
        idsIntegrantes.push(element.id);
      });
      this.visitaForm.get('integrantes')!.setValue(idsIntegrantes);
      for (let i = this.visitasParametros.length; i < visita!.visitaParametrosResponse.length; i++) {
        let param = visita!.visitaParametrosResponse[i].parametro;
        let visitaParametro = visita!.visitaParametrosResponse[i];
        this.visitasParametros.push(new FormGroup({
          paramNombre: new FormControl(param.nombre, []),
          situacionEsperable: new FormControl(param.situacionEsperable, []),
          principioAgroecologico: new FormControl(param.principioAgroecologico.nombre, []),
          parametroId: new FormControl(param.id, [Validators.required]),
          cumple: new FormControl(visitaParametro.cumple, [Validators.required]),
          sugerencias: new FormControl(visitaParametro.sugerencias, []),
          comentarios: new FormControl(visitaParametro.comentarios, []),
          aspiracionesFamiliares: new FormControl(visitaParametro.aspiracionesFamiliares, [])
        }));
      }
    } else {
      this.visitaForm = new FormGroup({
        integrantes: new FormControl({ value: visita?.integrantes, disabled: true }, [Validators.required]),
        comentarios: new FormControl({ value: visita?.comentarios, disabled: true }, []),
        fechaVisita: new FormControl({ value: this.formatearFechaParaFlatpickr(visita!.fechaVisita), disabled: true }, [Validators.required]),
        visitasParametros: new FormArray([])
      });
      let idsIntegrantes: number[] = [];
      visita?.integrantes?.forEach(element => {
        idsIntegrantes.push(element.id);
      });
      this.visitaForm.get('integrantes')!.setValue(idsIntegrantes);
      for (let i = this.visitasParametros.length; i < visita!.visitaParametrosResponse.length; i++) {
        let param = visita!.visitaParametrosResponse[i].parametro;
        let visitaParametro = visita!.visitaParametrosResponse[i];
        this.visitasParametros.push(new FormGroup({
          paramNombre: new FormControl(param.nombre, []),
          situacionEsperable: new FormControl(param.situacionEsperable, []),
          principioAgroecologico: new FormControl(param.principioAgroecologico.nombre, []),
          parametroId: new FormControl(param.id, [Validators.required]),
          cumple: new FormControl({ value: visitaParametro.cumple, disabled: true }, [Validators.required]),
          sugerencias: new FormControl({ value: visitaParametro.sugerencias, disabled: true }, []),
          comentarios: new FormControl({ value: visitaParametro.comentarios, disabled: true }, []),
          aspiracionesFamiliares: new FormControl({ value: visitaParametro.aspiracionesFamiliares, disabled: true }, [])
        }));
      }
    }
  }

  get params() { return this.visitaForm.controls; }
  get visitasParametros(): FormArray {
    return this.visitaForm.get('visitasParametros') as FormArray;
  }
  private formatearFechaParaFlatpickr(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}-${mes}-${anio}`;
  }

  confirmarVisita() {
    if (this.visitaForm.valid) {
      this.spinner.show();
      let visitaDTO = new VisitaDTO();
      // const [dia, mes, anio] = this.visitaForm.get('fechaVisita')!.value.split('-');
      // let fechaVisita = `${anio}-${mes}-${dia}`;
      // visitaDTO.fechaVisita = fechaVisita;
      visitaDTO.fechaVisita = this.visitaForm.get('fechaVisita')!.value;
      visitaDTO.integrantes = this.visitaForm.get('integrantes')!.value;
      visitaDTO.usuarioOperacion = localStorage.getItem('usuario')!;
      visitaDTO.quintaId = this.quintaId!;
      visitaDTO.comentarios = this.visitaForm.get('comentarios')!.value;
      this.visitasParametros.controls.forEach((element: any) => {
        let visitaParametroDTO = new VisitaParametroDTO();
        visitaParametroDTO.parametroId = element.get('parametroId').value;
        visitaParametroDTO.cumple = element.get('cumple').value;
        visitaParametroDTO.comentarios = element.get('comentarios').value;
        visitaParametroDTO.aspiracionesFamiliares = element.get('aspiracionesFamiliares').value;
        visitaParametroDTO.sugerencias = element.get('sugerencias').value;
        visitaDTO.parametros.push(visitaParametroDTO);
      });
      if (this.selectedType == 'NEW') {
        this.subscription.add(
          this._visitaService.save(visitaDTO).subscribe(
            res => {
              this.obtenerVisitas();
              this.cerrarModal();
              this.spinner.hide();
            },
            error => {
              // this._toastr.error('Error al guardar la visita.', '');
              console.error(error);
              this.spinner.hide();
            }
          )
        );
      } else {
        this.subscription.add(
          this._visitaService.update(visitaDTO, this.selectedVisita.id).subscribe(
            res => {
              this.obtenerVisitas();
              this.cerrarModal();
            },
            error => {
              this.spinner.hide();
              console.error(error);
            }
          )
        );
      }
    }
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalVisita.close();
  }

  openSwalEliminar(visita: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar la visita?`,
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
        this.eliminarVisita(visita);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarVisita(visita: any) {
    this.spinner.show();
    this.subscription.add(
      this._visitaService.delete(visita.id).subscribe({
        next: res => {
          this.obtenerVisitas();
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

  volver() {
    this.router.navigate(['/dashboard/quintas']);
  }

  openModalImagenes(visita: any) {
    this.selectedVisita = visita;
    this.imagenesVisita = [];
    this.tituloModal = 'Imágenes'
    visita.imagenes.forEach((element: any) => {
      let imagenInfo = new imagenInfoVisita();
      imagenInfo.id = element.id;
      imagenInfo.quintaId = element.quintaResponse?.id;
      imagenInfo.visitaId = visita.id;
      imagenInfo.dato = 'data:' + element.tipo + ';base64,' + element.contenido;
      this.imagenesVisita.push(imagenInfo);
    });
    this.modalImagen.options = this.modalOptions;
    this.modalImagen.open();
  }

  seleccionarImagen(event: any) {

    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;

    if (fileList) {
      const nuevosArchivos: File[] = Array.from(fileList);
      this.selectedImagenes = nuevosArchivos;
    }
  }

  cerrarModalImagenes() {
    this.imagenesVisita = [];
    this.modalImagen.close();
  }

  agregarImagenes() {
    if (this.selectedImagenes.length === 0) {
      this.swalService.toastInfo('top-right', 'Debe seleccionar al menos una imágen');
      return;
    }
    if (this.selectedImagenes.length > 5) {
      this.swalService.toastInfo('top-right', 'No puede agregar mas de 5 fotos por visita.');
      return;
    } else {
      let totalImagenes = this.selectedImagenes.length + this.imagenesVisita.length;
      if (totalImagenes > 2) {
        this.swalService.toastInfo('top-right', 'No puede agregar mas de 5 fotos por visita.');
        return;
      }
    }
    const formData = new FormData();
    for (let i = 0; i < this.selectedImagenes.length; i++) {
      formData.append('files', this.selectedImagenes[i]);
    }

    this.subscription.add(
      this.imagenService.save(formData, this.selectedVisita.id).subscribe(
        res => {
          this.selectedImagenes = [];
          let visita = this.visitas.filter(elemento => elemento.id === this.selectedVisita.id);
          res.forEach(element => {
            visita[0].imagenes.push(element);
            let imagenInfo = new imagenInfoVisita();
            imagenInfo.id = element.id;
            imagenInfo.quintaId = this.quintaId!;
            imagenInfo.visitaId = this.selectedVisita.id;
            imagenInfo.dato = 'data:' + element.tipo + ';base64,' + element.contenido;
            this.imagenesVisita.push(imagenInfo);
          });
          this.spinner.hide();
          // this._toastr.success('Imagen/es insertadas correctamente', '');
        },
        error => {
          console.error(error);
        }
      )
    );


  }

  eliminarImagen(imagen: imagenInfoVisita, index: number) {
    this.spinner.show();
    this.subscription.add(
      this.imagenService.delete(imagen.id).subscribe(
        res => {
          this.imagenesVisita.splice(index, 1);
          let visita = this.visitas.filter(elemento => elemento.id === imagen.visitaId);
          visita[0].imagenes = visita[0].imagenes.filter((elemento: any) => elemento.id !== imagen.id);
          this.spinner.hide();
        },
        error => {
          this.spinner.hide();
          console.error(error);
          // this._toastr.error('Error en la eliminación', '');
        }
      )
    );
  }

  cerrarVisita(visita: VisitaResponse) {
    this.subscription.add(
      this._visitaService.cerrarVisita(visita.id).subscribe(
        res => {
          visita.estadoVisita = res.estadoVisita;
        },
        error => {
          console.error(error);
        }
      )
    );
  }

}
