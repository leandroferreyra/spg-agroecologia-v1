import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbCarouselModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { ModalOptions, NgxCustomModalComponent } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { ImagenInfoQuinta } from 'src/app/core/models/request/imagenInfoQuinta';
import { QuintaDTO } from 'src/app/core/models/request/quintaDTO';
import { QuintaResponse } from 'src/app/core/models/response/quintaResponse';
import { QuintasService } from 'src/app/core/services/quintas.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { IconInfoCircleComponent } from 'src/app/shared/icon/icon-info-circle';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import { IconFileComponent } from 'src/app/shared/icon/icon-file';
import Swal from 'sweetalert2';
import { IconEyeComponent } from 'src/app/shared/icon/icon-eye';
import { Router } from '@angular/router';
import { ImagenQuintaService } from 'src/app/core/services/imagenQuinta.service';

@Component({
  selector: 'app-listado-quintas',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, NgxTippyModule, DataTableModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule,
    IconPlusComponent, IconPencilComponent, IconTrashLinesComponent, IconInfoCircleComponent, IconFileComponent,
    NgbPagination, IconSearchComponent, FontAwesomeModule, NgSelectModule, NgbCarouselModule, IconEyeComponent],
  templateUrl: './listado-quintas.component.html',
  styleUrl: './listado-quintas.component.css'
})
export class ListadoQuintasComponent {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role = '';

  selectedQuinta!: QuintaResponse;
  quintas: any[] = [];
  quintaForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;
  originalCheckedState: boolean = false;

  // Manejo de imagenes
  selectedType!: string;
  selectedImagenes: File[] = [];
  imagenesQuinta: ImagenInfoQuinta[] = [];
  activeCarouselImage: any;

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
  @ViewChild('modalQuinta') modalQuinta!: NgxCustomModalComponent;
  @ViewChild('modalImagen') modalImagen!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private swalService: SwalService, private _quintasService: QuintasService,
    private spinner: NgxSpinnerService, private _userLogged: UserLoggedService, private _router: Router,
    private _imagenService: ImagenQuintaService) {
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
    this.obtenerQuintas();
  }

  obtenerQuintas() {
    this.subscription.add(
      this._quintasService.getQuintas().subscribe({
        next: res => {
          this.spinner.hide();
          this.quintas = res;
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
    if (this.quintas.length <= this.itemsPerPage) {
      this.itemsInPage = res.length;
    } else {
      this.itemsInPage = this.currentPage * this.itemsPerPage;
    }
  }

  public onPageChange(pageNum: number): void {
    this.pageSize = this.itemsPerPage * (pageNum - 1);
    this.itemsInPage = pageNum * this.itemsPerPage;
    if (this.itemsInPage > this.quintas.length) {
      this.itemsInPage = this.quintas.length;
    }
  }

  public changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  filtrarDatos(): QuintaResponse[] {
    let resultados = this.quintas;
    if (this.filtros.organizacion) {
      resultados = resultados.filter(dato =>
        dato.organizacion.toLocaleLowerCase().includes(this.filtros.organizacion.toLowerCase()))
    }
    if (this.filtros.productor) {
      resultados = resultados.filter(dato =>
        dato.nombreProductor.toLocaleLowerCase().includes(this.filtros.productor.toLowerCase()))
    }
    if (this.filtros.direccion) {
      resultados = resultados.filter(dato =>
        dato.direccion.toLocaleLowerCase().includes(this.filtros.direccion.toLowerCase()))
    }
    if (this.filtros.sello) {
      resultados = resultados.filter(dato =>
        dato.selloGarantia.toLocaleLowerCase().includes(this.filtros.sello.toLowerCase()))
    }
    return resultados;
  }

  openModalNuevaQuinta(type: string, quinta?: any) {
    this.selectedType = type;
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nueva quinta';
      this.quintaForm = new FormGroup({
        organizacion: new FormControl(null, [Validators.required]),
        direccion: new FormControl(null, [Validators.required]),
        productor: new FormControl(null, [Validators.required]),
        sello: new FormControl('No', [Validators.required]),
        superficieTotalInvernaculo: new FormControl(null, [Validators.required]),
        superficieTotalCampo: new FormControl(null, [Validators.required]),
        superficieAgroecologiaInvernaculo: new FormControl(null, [Validators.required]),
        superficieAgroecologiaCampo: new FormControl(null, [Validators.required]),
        comentarios: new FormControl(null, []),
      });
    } else if (type === 'EDIT') {
      this.isEdicion = true;
      this.tituloModal = 'Edición quinta';
      this.quintaForm = new FormGroup({
        id: new FormControl(quinta?.id, []),
        organizacion: new FormControl(quinta.organizacion, [Validators.required]),
        direccion: new FormControl(quinta.direccion, [Validators.required]),
        productor: new FormControl(quinta.nombreProductor, [Validators.required]),
        sello: new FormControl(quinta.selloGarantia, [Validators.required]),
        superficieTotalInvernaculo: new FormControl(quinta.superficieTotalInvernaculo, [Validators.required]),
        superficieTotalCampo: new FormControl(quinta.superficieTotalCampo, [Validators.required]),
        superficieAgroecologiaInvernaculo: new FormControl(quinta.superficieAgroecologiaInvernaculo, [Validators.required]),
        superficieAgroecologiaCampo: new FormControl(quinta.superficieAgroecologiaInvernaculo, [Validators.required]),
        comentarios: new FormControl(quinta.comentarios, []),
      });
    } else {
      this.isEdicion = false;
      this.tituloModal = 'Información de quinta';
      this.quintaForm = new FormGroup({
        organizacion: new FormControl({ value: quinta.organizacion, disabled: true }, [Validators.required]),
        direccion: new FormControl({ value: quinta.direccion, disabled: true }, [Validators.required]),
        productor: new FormControl({ value: quinta.nombreProductor, disabled: true }, [Validators.required]),
        sello: new FormControl({ value: quinta.selloGarantia, disabled: true }, [Validators.required]),
        superficieTotalInvernaculo: new FormControl({ value: quinta.superficieTotalInvernaculo, disabled: true }, [Validators.required]),
        superficieTotalCampo: new FormControl({ value: quinta.superficieTotalCampo, disabled: true }, [Validators.required]),
        superficieAgroecologiaInvernaculo: new FormControl({ value: quinta.superficieAgroecologiaInvernaculo, disabled: true }, [Validators.required]),
        superficieAgroecologiaCampo: new FormControl({ value: quinta.superficieAgroecologiaInvernaculo, disabled: true }, [Validators.required]),
        comentarios: new FormControl({ value: quinta.comentarios, disabled: true }, []),
      });
    }
    this.modalQuinta.options = this.modalOptions;
    this.modalQuinta.open();
  }

  confirmarQuinta() {
    this.isSubmit = true;
    if (this.quintaForm.valid) {

      if (this.selectedImagenes.length > 2) {
        this.swalService.toastInfo('top-right', 'No puede agregar mas de 2 fotos por quinta.');
        return;
      }

      this.spinner.show();
      let quinta = new QuintaDTO();
      quinta.organizacion = this.quintaForm.get('organizacion')?.value;
      quinta.direccion = this.quintaForm.get('direccion')?.value;
      quinta.nombreProductor = this.quintaForm.get('productor')?.value;
      quinta.comentarios = this.quintaForm.get('comentarios')?.value;
      quinta.selloGarantia = this.quintaForm.get('sello')?.value;
      quinta.usuarioOperacion = this._userLogged.getUsuarioLogueado?.usuario;
      quinta.superficieAgroecologiaCampo = this.quintaForm.get('superficieAgroecologiaCampo')?.value;
      quinta.superficieAgroecologiaInvernaculo = this.quintaForm.get('superficieAgroecologiaInvernaculo')?.value;
      quinta.superficieTotalCampo = this.quintaForm.get('superficieTotalCampo')?.value;
      quinta.superficieTotalInvernaculo = this.quintaForm.get('superficieTotalInvernaculo')?.value;

      //Imagenes

      const formData = new FormData();
      formData.append('quinta', new Blob([JSON.stringify(quinta)], {
        type: 'application/json'
      }));

      for (let i = 0; i < this.selectedImagenes.length; i++) {
        formData.append('files', this.selectedImagenes[i]);
      }

      if (!this.isEdicion) {
        this.subscription.add(
          this._quintasService.save(formData).subscribe({
            next: res => {
              this.obtenerQuintas();
              this.cerrarModal();
              this.spinner.hide();
            },
            error: error => {
              this.swalService.toastError('top-right', error.error.detalleError);
              console.error(error);
              this.spinner.hide();
            }
          })
        )
      } else {
        this.subscription.add(
          this._quintasService.updateQuinta(formData, this.quintaForm.get('id')?.value).subscribe({
            next: res => {
              this.obtenerQuintas();
              this.cerrarModal();
              this.spinner.hide();
            },
            error: error => {
              console.error(error);
              this.spinner.hide();
              this.swalService.toastError('top-right', error.error.detalleError);
            }
          })
        )
      }
    }
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalQuinta.close();
  }

  cerrarModalImagenes() {
    this.imagenesQuinta = [];
    this.modalImagen.close();
  }

  openSwalEliminar(compra: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar la quinta seleccionada?`,
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
        this.eliminarQuinta(compra);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarQuinta(quinta: any) {
    this.spinner.show();
    this.subscription.add(
      this._quintasService.deleteQuinta(quinta.id).subscribe({
        next: res => {
          this.obtenerQuintas();
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

  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        'organizacion': '',
        'productor': '',
        'direccion': '',
        'sello': ''
      };
      this.obtenerQuintas();
    }
  }

  siguienteVisita(fechaUltimaVisita: Date) {
    let fechaAdelantada = null;
    if (fechaUltimaVisita != null) {
      const ultimaVisita = new Date(fechaUltimaVisita);
      fechaAdelantada = new Date(ultimaVisita.getTime() + (365 * 24 * 60 * 60 * 1000));
    }
    return fechaAdelantada;
  }

  seleccionarImagen(event: any) {

    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;

    if (fileList) {
      const nuevosArchivos: File[] = Array.from(fileList);
      this.selectedImagenes = nuevosArchivos;
    }
  }

  agregarImagenes() {
    if (this.selectedImagenes.length === 0) {
      this.swalService.toastInfo('top-right', 'Debe seleccionar al menos una imágen');
      return;
    }
    if (this.selectedImagenes.length > 2) {
      this.swalService.toastInfo('top-right', 'No puede agregar mas de 2 fotos por quinta.');
      return;
    } else {
      let totalImagenes = this.selectedImagenes.length + this.imagenesQuinta.length;
      if (totalImagenes > 2) {
        this.swalService.toastInfo('top-right', 'No puede agregar mas de 2 fotos por quinta.');
        return;
      }
    }
    const formData = new FormData();
    for (let i = 0; i < this.selectedImagenes.length; i++) {
      formData.append('files', this.selectedImagenes[i]);
    }

    this.subscription.add(
      this._imagenService.save(formData, this.selectedQuinta.id).subscribe(
        res => {
          this.selectedImagenes = [];
          // this.obtenerQuintas();
          // this.
          let quinta = this.quintas.filter(elemento => elemento.id === this.selectedQuinta.id);
          res.forEach(element => {
            quinta[0].imagenes.push(element);
            let imagenInfo = new ImagenInfoQuinta();
            imagenInfo.id = element.id;
            imagenInfo.quintaId = this.selectedQuinta.id;
            imagenInfo.dato = 'data:' + element.tipo + ';base64,' + element.contenido;
            this.imagenesQuinta.push(imagenInfo);
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

  eliminarImagen(imagen: ImagenInfoQuinta, index: number) {
    this.spinner.show();
    this.subscription.add(
      this._imagenService.delete(imagen.id).subscribe(
        res => {
          this.imagenesQuinta.splice(index, 1);
          let quinta = this.quintas.filter(elemento => elemento.id === imagen.quintaId);
          quinta[0].imagenes = quinta[0].imagenes.filter((elemento: any) => elemento.id !== imagen.id);
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

  openModalImagenes(quinta: QuintaResponse) {
    this.selectedQuinta = quinta;
    this.imagenesQuinta = [];
    this.tituloModal = 'Imágenes'
    quinta.imagenes.forEach(element => {
      let imagenInfo = new ImagenInfoQuinta();
      imagenInfo.id = element.id;
      imagenInfo.quintaId = quinta.id;
      imagenInfo.dato = 'data:' + element.tipo + ';base64,' + element.contenido;
      this.imagenesQuinta.push(imagenInfo);
    });
    this.modalImagen.options = this.modalOptions;
    this.modalImagen.open();
  }

  visitas(quinta: any) {
    this._router.navigate(['dashboard', 'quintas', quinta.id, 'visitas']);
  }


}
