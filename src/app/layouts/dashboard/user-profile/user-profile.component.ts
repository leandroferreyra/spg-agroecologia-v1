import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();


  constructor() {

  }

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
  }


}
