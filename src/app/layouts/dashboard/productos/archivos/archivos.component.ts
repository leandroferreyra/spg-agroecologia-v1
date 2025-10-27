import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { ProductoService } from 'src/app/core/services/producto.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import { faFilePdf, faFileWord, faFileZipper, faFileImage, faFile, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { ArchivoDTO } from 'src/app/core/models/request/archivoDTO';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-archivos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxTippyModule, NgSelectModule, NgbPaginationModule, NgxSpinnerModule,
    IconTrashLinesComponent, FontAwesomeModule, IconPlusComponent, NgxCustomModalComponent
  ],
  templateUrl: './archivos.component.html',
  styleUrl: './archivos.component.css'
})
export class ArchivosComponent implements OnInit, OnDestroy {

  @Input() producto: any;
  @Input() rol!: string;

  @Output() eventArchivo = new EventEmitter<any>();

  private subscription: Subscription = new Subscription();

  // Orden, filtro y paginación para compras de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;
  filtros: any = {};
  showFilterCompras: boolean = false;
  ordenamiento: any = {};

  archivos: any[] = [];

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

  archivoForm!: FormGroup;
  archivoSeleccionado?: File;
  isSubmit = false;
  imagenPreview: string | null = null;
  isDragging = false;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;


  // Referencia al modal para crear y editar archivos.
  @ViewChild('modalArchivo') modalArchivo!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(private _productoService: ProductoService, private _swalService: SwalService, private spinner: NgxSpinnerService,
    private _tokenService: TokenService) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['producto'] && changes['producto'].currentValue) {
      this.spinner.show();
      this.obtenerArchivos();
    }
  }

  obtenerArchivos() {
    this.subscription.add(
      this._productoService.showProduct(this.producto.uuid, this.rol).subscribe({
        next: res => {
          this.archivos = res.data?.files;
          console.log("🚀 ~ ArchivosComponent ~ obtenerArchivos ~ this.archivos:", this.archivos)
          this._tokenService.setToken(res.token);
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

  getIconByType(tipo: string) {
    switch (tipo) {
      case 'application/pdf': return faFilePdf;
      case 'application/word': return faFileWord;
      case 'application/zip': return faFileZipper;
      case 'application/image': return faFileImage;
      default: return faFile;
    }
  }

  getImageByType(mimeType: string): string {
    if (!mimeType) return 'assets/images/files/other.png';
    mimeType = mimeType.toLowerCase();
    if (mimeType.includes('pdf')) {
      return 'assets/images/files/imagen-pdf.jpg';
    } else if (mimeType.includes('word') || mimeType.includes('doc')) {
      return 'assets/images/files/imagen-word.png';
    } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
      return 'assets/images/files/imagen-rar.jpg';
    } else {
      return 'assets/images/files/other.png';
    }
  }

  abrirArchivo(url: string) {
    if (!url) return;
    window.open(url, '_blank');
  }

  openModalArchivo() {
    this.archivoForm = new FormGroup({
      descripcion: new FormControl(null, Validators.required),
      archivo: new FormControl(null, Validators.required)
    });
    this.modalArchivo.options = this.modalOptions;
    this.modalArchivo.open();
    this.onFormChange();
  }
  onFormChange() {
  }

  cerrarModal() {
    this.isSubmit = false;
    this.archivoSeleccionado = undefined;
    this.modalArchivo.close();
  }

  confirmarArchivo() {
    this.isSubmit = true;
    if (this.archivoForm.valid) {
      this.spinner.show();
      let archivoDTO = new ArchivoDTO();
      archivoDTO.actual_role = this.rol;
      archivoDTO.description = this.archivoForm.get('descripcion')?.value;
      archivoDTO.file = this.archivoSeleccionado;
      this.subscription.add(
        this._productoService.saveFile(this.producto.uuid, archivoDTO).subscribe({
          next: res => {
            this.obtenerArchivos();
            this.cerrarModal();
            this._tokenService.setToken(res.token);
            this.spinner.hide();
            this.eventArchivo.emit();
          },
          error: error => {
            this._swalService.toastError('top-right', error.error.message);
            console.error(error);
            this.spinner.hide();
          }
        })
      )
    }
  }

  onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    if (event.dataTransfer?.files.length) {
      this.setFile(event.dataTransfer.files[0]);
    }
  }

  private setFile(file: File) {
    this.archivoSeleccionado = file;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => this.imagenPreview = reader.result as string;
      reader.readAsDataURL(file);
    } else {
      this.imagenPreview = null;
    }
  }

  borrarArchivo() {
    this.archivoSeleccionado = undefined;
    this.imagenPreview = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  openSwalEliminar(archivo: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el archivo ${archivo.description}?`,
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
        this.eliminarArchivo(archivo);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarArchivo(archivo: any) {
    this.spinner.show();
    this.subscription.add(
      this._productoService.deleteFile(this.producto.uuid, archivo.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.eventArchivo.emit();
          this.obtenerArchivos();
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

  mover(movement: string = 'up | down', data: any) {
    this.spinner.show();
    if (movement === 'up') {
      this.moverArriba(data);
    } else {
      this.moverAbajo(data);
    }
  }

  moverArriba(data: any) {
    this.subscription.add(
      this._productoService.moveUpFile(this.producto.uuid, data.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerArchivos();
          this._tokenService.setToken(res.token);
          this.eventArchivo.emit();
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

  moverAbajo(data: any) {
    this.subscription.add(
      this._productoService.moveDownFile(this.producto.uuid, data.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerArchivos();
          this._tokenService.setToken(res.token);
          this.eventArchivo.emit();
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

}
