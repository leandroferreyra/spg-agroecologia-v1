import { Component, Input } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-faltantes',
  standalone: true,
  imports: [],
  templateUrl: './faltantes.component.html',
  styleUrl: './faltantes.component.css'
})
export class FaltantesComponent {

  @Input() produccion: any;
  @Input() rol!: string;
  private subscription: Subscription = new Subscription();
  
}
