import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { EstadoProduccion } from 'src/app/core/models/enum/estadoProduccion';
import { IconArrowBackwardComponent } from 'src/app/shared/icon/icon-arrow-backward';
import { IconArrowForwardComponent } from 'src/app/shared/icon/icon-arrow-forward';
import { IconArrowLeftComponent } from 'src/app/shared/icon/icon-arrow-left';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, IconArrowLeftComponent, IconArrowBackwardComponent, IconArrowForwardComponent],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css'
})
export class TimelineComponent implements OnInit {

  @Input() produccion: any;
  @Input() estadosPosibles: any;

  constructor() {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['produccion'] && changes['produccion'].currentValue) {
      // Si el producto cambia, actualizamos los filtros y obtenemos los componentes
      console.log('Producción actualizada: ', this.produccion);
    }
    if (changes['estadosPosibles'] && changes['estadosPosibles'].currentValue) {
      console.log('Estados posibles actualizados: ', this.estadosPosibles);
    }
  }

  get estadoActualIndex(): number {
    return this.estadosPosibles.findIndex((e: any) => e.name === this.produccion?.current_state?.state?.name);
  }

  avanzar() {
    // if (this.estadoActualIndex < this.estadosPosibles.length - 1) {
    //   this.estadoActual = this.estadosPosibles[this.estadoActualIndex + 1].nombre;
    // }
  }

  retroceder() {
    // if (this.estadoActualIndex > 0) {
    //   this.estadoActual = this.estadosPosibles[this.estadoActualIndex - 1].nombre;
    // }
  }

}
