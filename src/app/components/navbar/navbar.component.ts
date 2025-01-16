import { Component, OnInit, ElementRef, Signal, Input, OnDestroy } from '@angular/core';

import { CommonModule, Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Subscription } from 'rxjs';



@Component({
  selector: 'app-menu-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {

  menuItems = [
    {
      label: 'Productos',
      subMenu: [
        { label: 'Nuevo producto', route: '/productos/nuevo' },
        { label: 'Listado de productos', route: '/productos/listado' }
      ]
    },
    {
      label: 'Proveedores',
      subMenu: [
        { label: 'Nuevo proveedor', route: '/proveedores/nuevo' },
        { label: 'Listado de proveedores', route: '/proveedores/listado' }
      ]
    },
    { label: 'Clientes', subMenu: [] },
    { label: 'Configuración', subMenu: [] },
    { label: 'Salir', subMenu: [] }
  ];

  private subscription: Subscription = new Subscription();

  constructor(
  ) {

  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
  }

  

}
