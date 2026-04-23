import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { NgbCarouselModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { ModalOptions, NgxCustomModalComponent } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { imagenInfoVisita } from 'src/app/core/models/request/imagenInfoVisita';
import { ImagenQuintaService } from 'src/app/core/services/imagenQuinta.service';
import { ImagenVisitaService } from 'src/app/core/services/imagenVisita.service';
import { PrincipioService } from 'src/app/core/services/principio.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { VisitasService } from 'src/app/core/services/visitas.service';
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
    NgbPagination, IconSearchComponent, FontAwesomeModule, NgSelectModule, NgbCarouselModule],
  templateUrl: './listado-visitas.component.html',
  styleUrl: './listado-visitas.component.css'
})
export class ListadoVisitasComponent {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';

  quintaId: number | undefined;
  selectedImagenes: File[] = [];
  imagenesVisita: imagenInfoVisita[] = [];
  selectedVisita: any;
  // comentariosImagenes: string = '';

  visitas: any[] = [];
  principioForm!: FormGroup;
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

  constructor(public storeData: Store<any>, private swalService: SwalService, private _principioService: PrincipioService,
    private spinner: NgxSpinnerService, private imagenService: ImagenVisitaService, private _visitaService: VisitasService,
    private route: ActivatedRoute, private router: Router) {
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
          console.log("🚀 ~ ListadoVisitasComponent ~ obtenerVisitas ~ this.visitas:", this.visitas)
          this.modificarPaginacion(res);
        },
        error: error => {
          this.spinner.hide();
          console.error(error);
        }
      })
    )
  }

  // obtenerPrincipios() {
  //   this.spinner.show();
  //   this.subscription.add(
  //     this._principioService.getPrincipios().subscribe({
  //       next: res => {
  //         this.spinner.hide();
  //         this.principios = res;
  //         this.modificarPaginacion(res);
  //       },
  //       error: error => {
  //         this.spinner.hide();
  //         console.error(error);
  //       }
  //     })
  //   )
  // }

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

  openModalNuevaVisita(type: string, principio?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nueva posición';
      this.principioForm = new FormGroup({
        nombre: new FormControl(null, [Validators.required]),
      });
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición posición';
      this.principioForm = new FormGroup({
        id: new FormControl(principio?.id, []),
        nombre: new FormControl(principio?.nombre, [Validators.required])
      });
    }
    this.modalVisita.options = this.modalOptions;
    this.modalVisita.open();
  }

  // confirmarPrincipio() {
  //   this.isSubmit = true;
  //   if (this.principioForm.valid) {
  //     this.spinner.show();
  //     let principio = new PrincipioDTO();
  //     principio.nombre = this.principioForm.get('nombre')?.value;
  //     if (!this.isEdicion) {
  //       this.subscription.add(
  //         this._principioService.save(principio).subscribe({
  //           next: res => {
  //             this.obtenerPrincipios();
  //             this.cerrarModal();
  //             this.spinner.hide();
  //           },
  //           error: error => {
  //             this.swalService.toastError('top-right', error.error.message);
  //             console.error(error);
  //             this.spinner.hide();
  //           }
  //         })
  //       )
  //     } else {
  //       this.subscription.add(
  //         this._principioService.updatePrincipio(principio, this.principioForm.get('id')?.value).subscribe({
  //           next: res => {
  //             this.obtenerPrincipios();
  //             this.cerrarModal();
  //             this.spinner.hide();
  //           },
  //           error: error => {
  //             console.error(error);
  //             this.spinner.hide();
  //             this.swalService.toastError('top-right', error.error.message);
  //           }
  //         })
  //       )
  //     }
  //   }
  // }

  cerrarModal() {
    this.isSubmit = false;
    this.modalVisita.close();
  }

  openSwalCambiarEstadoPrincipio(principio: any, checkboxId: string) {
    this.originalCheckedState = principio.habilitado;
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
        this.cambiarEstadoPrincipio(principio, checkbox);
      } else if (result.isDenied) {
        checkbox.checked = this.originalCheckedState;
      }
    })
  }

  cambiarEstadoPrincipio(principio: any, checkbox: any) {
    this.spinner.show();
    this.subscription.add(
      this._principioService.updateStatus(principio.id).subscribe({
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

}
