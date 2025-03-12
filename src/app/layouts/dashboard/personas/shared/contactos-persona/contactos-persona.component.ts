import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { ContactoDTO } from 'src/app/core/models/request/contactoDTO';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { ContactosProveedorService } from 'src/app/core/services/contactosProveedor.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contactos-persona',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgxSpinnerModule, NgxTippyModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule,
    NgSelectModule, IconTrashLinesComponent, IconPencilComponent, IconSearchComponent, IconPlusComponent],
  templateUrl: './contactos-persona.component.html',
  styleUrl: './contactos-persona.component.css'
})
export class ContactosPersonaComponent implements OnInit, OnDestroy {


  @Input() persona: any;
  @Input() rol!: string;
  contactos: any[] = [];
  // monedas: any[] = [];
  tiposDeDatoContacto: any[] = [];
  // bancos: any[] = [];

  private subscription: Subscription = new Subscription();

  // Orden, filtro y paginación para cuentas bancarias de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  filtrosContactos: any = {
    'person.uuid': ''
  };
  ordenamiento: any = {

  };

  // Referencia al modal para crear y editar países.
  @ViewChild('modalContacto') modalContacto!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  contactoForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  constructor(private _indexService: IndexService, private _swalService: SwalService, private spinner: NgxSpinnerService,
    private _contactoService: ContactosProveedorService, private _tokenService: TokenService, private _catalogoService: CatalogoService) {

  }
  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['persona'] && changes['persona'].currentValue) {
      this.spinner.show();
      // Si el supplierUuid cambia, actualizamos los filtros y obtenemos las cuentas
      this.filtrosContactos['person.uuid'] = this.persona.person?.uuid;
      this.obtenerContactos();
    }
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalContacto.close();
  }

  confirmarContacto() {
    this.isSubmit = true;
    if (this.contactoForm.valid) {
      this.spinner.show();
      let contacto = new ContactoDTO();
      contacto.value = this.contactoForm.get('value')?.value;
      contacto.details = this.contactoForm.get('details')?.value;
      contacto.actual_role = this.rol;
      if (!this.isEdicion) {
        contacto.contact_detail_type_uuid = this.contactoForm.get('contact_detail_type_uuid')?.value;
        contacto.person_uuid = this.contactoForm.get('person_uuid')?.value;
        this.subscription.add(
          this._contactoService.saveContacto(contacto).subscribe({
            next: res => {
              this.obtenerContactos();
              this.cerrarModal();
              this._swalService.toastSuccess('top-right', res.message);
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
      } else {
        this.subscription.add(
          this._contactoService.editContacto(this.contactoForm.get('uuid')?.value, contacto).subscribe({
            next: res => {
              const index = this.contactos.findIndex(p => p.uuid === (this.contactoForm.get('uuid')?.value));
              if (index !== -1) {
                this.contactos[index] = {
                  ...this.contactos[index],
                  value: this.contactoForm.get('value')?.value,
                  details: this.contactoForm.get('details')?.value
                };
                this.contactos = [...this.contactos];
              }
              this.cerrarModal();
              this._swalService.toastSuccess('top-right', res.message)
              this._tokenService.setToken(res.token);
              this.spinner.hide();
            },
            error: error => {
              console.error(error);
              this.spinner.hide();
              this._swalService.toastError('top-right', error.error.message);
            }
          })
        )
      }
    }
  }

  obtenerContactos() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["person", "person.human", "person.legalEntity"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtrosContactos;

    this.subscription.add(
      this._indexService.getDetalleContactosPersonaWithParam(params, this.rol).subscribe({
        next: res => {
          this.contactos = res.data;
          console.log(this.contactos);
          this.modificarPaginacion(res);
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
    if (this.contactos.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }


  openModalContacto(type: string, dato?: any) {
    if (type === 'NEW') {
      this.obtenerTiposDatoContacto();
      this.isEdicion = false;
      this.tituloModal = 'Nuevo dato';
      this.contactoForm = new FormGroup({
        // contact_detail_type_uuid: new FormControl(null, Validators.required),
        // person_uuid: new FormControl(this.persona.person?.uuid, Validators.required),
        // value: new FormControl(null, Validators.required),
        // details: new FormControl(null)
      });
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición dato';
      this.contactoForm = new FormGroup({
        // uuid: new FormControl(dato.uuid),
        // contact_detail_type: new FormControl(dato.contact_detail_type.name),
        // value: new FormControl(dato.value),
        // details: new FormControl(dato.details)
      });
    }
    this.modalContacto.options = this.modalOptions;
    this.modalContacto.open();
  }

  openSwalEliminar(dato: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el dato ${dato.contact_detail_type.name}?`,
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
        this.eliminarDato(dato);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarDato(contacto: any) {
    this.spinner.show();
    this.subscription.add(
      this._contactoService.deleteContacto(contacto.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerContactos();
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

  obtenerTiposDatoContacto() {
    this.subscription.add(
      this._catalogoService.getTiposDetalleContacto(this.rol).subscribe({
        next: res => {
          this.tiposDeDatoContacto = res.data;
        },
        error: error => {
          console.error(error);
        }
      })
    )
  }

  showName(data: any) {
    if (data.person?.human) {
      return data.person?.human?.firstname + ' ' + data.person?.human?.lastname
    } else {
      return data.person?.legal_entity?.company_name
    }
  }

  showCuit(data: any) {
    if (data.person?.human) {
      return data.person?.human?.cuit;
    } else {
      return data.person?.legal_entity?.cuit;
    }
  }
}
