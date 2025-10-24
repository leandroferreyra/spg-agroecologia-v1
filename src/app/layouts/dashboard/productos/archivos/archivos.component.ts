import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { IndexService } from 'src/app/core/services/index.service';
import { ProductoService } from 'src/app/core/services/producto.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TiposCambioService } from 'src/app/core/services/tiposCambio.service';
import { TokenService } from 'src/app/core/services/token.service';

@Component({
  selector: 'app-archivos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxTippyModule, NgSelectModule, NgbPaginationModule, NgxSpinnerModule],
  templateUrl: './archivos.component.html',
  styleUrl: './archivos.component.css'
})
export class ArchivosComponent implements OnInit, OnDestroy {

  @Input() producto: any;
  @Input() rol!: string;
  private subscription: Subscription = new Subscription();

  archivos: [] = [];

  constructor(private _productoService: ProductoService, private _swalService: SwalService, private spinner: NgxSpinnerService,
    private _tokenService: TokenService, private router: Router, private _tiposCambioService: TiposCambioService) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['producto'] && changes['producto'].currentValue) {
      this.spinner.show();
      // Si el producto cambia, actualizamos los filtros y obtenemos los componentes
      this.obtenerArchivos();
    }
  }

  obtenerArchivos() {

    this.subscription.add(
      this._productoService.showProduct(this.producto.uuid, this.rol).subscribe({
        next: res => {
          this.archivos = res.data;
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


}
