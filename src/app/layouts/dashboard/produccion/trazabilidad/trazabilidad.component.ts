import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-trazabilidad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trazabilidad.component.html',
  styleUrl: './trazabilidad.component.css'
})
export class TrazabilidadComponent {

    @Input() produccion: any;
    @Input() rol!: string;
    private subscription: Subscription = new Subscription();

}
