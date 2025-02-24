import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { CategoriasService } from 'src/app/core/services/categorias.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconEditComponent } from 'src/app/shared/icon/icon-edit';
import { IconMenuComponent } from 'src/app/shared/icon/icon-menu';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconUserComponent } from 'src/app/shared/icon/icon-user';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent
  ],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();
  actual_role: string = '';
  proveedores: any[] = [];
  selectedProveedor: any;
  proveedorForm!: FormGroup;

  isHuman: boolean = false;

  busqueda_contiene: boolean = false;
  isEdicion: boolean = false;


  isShowMailMenu = false;

  // Orden y filtro
  filtros: any = {
  };
  showFilter: boolean = false;
  ordenamiento: any = {
  };

  tab1: string = 'Datos generales';


  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _categoriaService: CategoriasService, private spinner: NgxSpinnerService, private tokenService: TokenService) {
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
    this.inicializarForm();
    this.obtenerProveedores();
  }

  obtenerProveedores() {
    const params: any = {};
    params.with = ["person.human", "person.legal_entity"];
    params.paging = null;
    params.page = null;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getProveedoresWithParam(params, this.actual_role).subscribe({
        next: res => {
          console.log(res);
          this.proveedores = res.data;
          if (this.proveedores.length > 0) {
            this.inicializarForm(this.proveedores[0]);
          }
          this.spinner.hide();
        },
        error: error => {
          console.error(error);
          this.spinner.hide();
        }
      })
    )
  }

  inicializarForm(proveedor?: any) {
    if (proveedor) {
      this.selectedProveedor = proveedor;
      this.isHuman = proveedor.person?.human ? true : false;
    }
    this.proveedorForm = new FormGroup({
      nombre: new FormControl({ value: proveedor?.person?.human?.firstname, disabled: true }, [Validators.required]),
      apellido: new FormControl({ value: proveedor?.person?.human?.lastname, disabled: true }, [Validators.required]),
      documento: new FormControl({ value: proveedor?.person?.human?.document_number, disabled: true }, [Validators.required]),
      cuit: new FormControl({ value: this.isHuman ? proveedor?.person?.human?.cuit : proveedor?.person?.legal_entity?.cuit, disabled: true }, [Validators.required]),
      razon: new FormControl({ value: proveedor?.person?.legal_entity?.company_name, disabled: true }, [Validators.required]),
      sigla: new FormControl({ value: proveedor?.batch_prefix, disabled: true }, [Validators.required]),
      comentarios: new FormControl({ value: proveedor?.comments, disabled: true }, [Validators.required]),
      calle: new FormControl({ value: proveedor?.person?.street_name, disabled: true }, [Validators.required]),
      numero: new FormControl({ value: proveedor?.person?.door_number, disabled: true }, [Validators.required]),
    });
  }

  agregarProveedor() {
    console.log('Add provedor');
  }

  getName(proveedor: any) {
    if (proveedor.person?.human) {
      return proveedor.person.human.firstname + ' ' + proveedor.person.human.lastname
    } else if (proveedor.person?.legal_entity) {
      return proveedor.person.legal_entity.company_name
    } else {
      return ' ';
    }
  }

  showDataProveedor(proveedor: any) {
    // console.log(proveedor);
    this.inicializarForm(proveedor);
  }

  toggleEdicion() {
    this.isEdicion = !this.isEdicion;
    if (this.isEdicion) {
      this.modificarValidacionesForm();
    } else {
      this.cancelarEdicion();
    }
  }

  modificarValidacionesForm() {
    this.proveedorForm.get('nombre')?.enable();
    this.proveedorForm.get('apellido')?.enable();
    this.proveedorForm.get('razon')?.enable();
    this.proveedorForm.get('sigla')?.enable();
    this.proveedorForm.get('comentarios')?.enable();
    this.proveedorForm.get('calle')?.enable();
    this.proveedorForm.get('numero')?.enable();
    this.proveedorForm.get('cuit')?.enable();
    this.proveedorForm.get('documento')?.enable();
  }

  cancelarEdicion() {
    this.isEdicion = false;
    this.inicializarForm(this.selectedProveedor);
  }

  confirmarEdicion() {
    console.log('Confirmar edicion');
  }

}
