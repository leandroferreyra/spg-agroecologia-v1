import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { Store } from '@ngrx/store';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { GenericDTO } from 'src/app/core/models/request/genericDTO';
import { AuthService } from 'src/app/core/services/auth.service';
import { BancosService } from 'src/app/core/services/bancos.service';
import { SharedModule } from 'src/shared.module';

@Component({
  selector: 'app-listado-bancos',
  standalone: true,
  imports: [CommonModule, SharedModule, DataTableModule, NgxSpinnerModule],
  templateUrl: './listado-bancos.component.html',
  styleUrl: './listado-bancos.component.css'
})
export class ListadoBancosComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';
  search = '';
  cols = [
    { field: 'name', title: 'Nombre' },
    { field: 'action', title: 'Acciones', sort: false }
  ];
  bancos: any[] = [];

  constructor(public storeData: Store<any>,
    private _bancosService: BancosService, private spinner: NgxSpinnerService) {
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
      this._bancosService.getBancos(this.actual_role).subscribe({
        next: res => {
          this.spinner.hide();
          this.bancos = res.data;
          console.log(this.bancos);
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
