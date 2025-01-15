import { Component, OnInit, ElementRef, Signal, Input, OnDestroy } from '@angular/core';

import { CommonModule, Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Subscription } from 'rxjs';



@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {

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
