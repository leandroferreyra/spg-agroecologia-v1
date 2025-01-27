import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { Store } from '@ngrx/store';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { BancosService } from 'src/app/core/services/bancos.service';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { SharedModule } from 'src/shared.module';

@Component({
  selector: 'app-listado-paises',
  standalone: true,
  imports: [CommonModule, SharedModule, DataTableModule, NgxSpinnerModule],
  templateUrl: './listado-paises.component.html',
  styleUrl: './listado-paises.component.css'
})
export class ListadoPaisesComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';
  search = '';
  cols = [
    { field: 'name', title: 'Nombre' },
    { field: 'action', title: 'Acciones', sort: false }
  ];
  paises: any[] = [];
  paginationInfo: string = 'Mostrando {0} de {1} de un total de {2} elementos';

  constructor(public storeData: Store<any>,
    private _catalogoService: CatalogoService, private spinner: NgxSpinnerService) {
    this.initStore();
  }

  async initStore() {
    this.storeData
      .select((d) => d.index)
      .subscribe((d) => {
        this.actual_role = d.userRole;
      });
  }

  ngOnInit(): void {
    this.spinner.show();
    this.subscription.add(
      this._catalogoService.getPaisesWithPaging().subscribe({
        next: res => {
          this.paises = res.data;
          console.log(this.paises);
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          console.log(error);
        }
      })
    )
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
