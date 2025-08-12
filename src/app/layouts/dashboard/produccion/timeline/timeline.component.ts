import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { EstadoProduccion } from 'src/app/core/models/enum/estadoProduccion';
import { IconArrowBackwardComponent } from 'src/app/shared/icon/icon-arrow-backward';
import { IconArrowForwardComponent } from 'src/app/shared/icon/icon-arrow-forward';
import { IconArrowLeftComponent } from 'src/app/shared/icon/icon-arrow-left';

export enum TimelineDirection {
  NEXT = 'next',
  PREVIOUS = 'previous',
}

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

  @Output() eventTimeline = new EventEmitter<any>();
  timelineDirection = TimelineDirection

  constructor() {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['produccion'] && changes['produccion'].currentValue) {
      // Si el producto cambia, actualizamos los filtros y obtenemos los componentes
    }
    if (changes['estadosPosibles'] && changes['estadosPosibles'].currentValue) {
    }
  }

  get estadoActualIndex(): number {
    return this.estadosPosibles.findIndex((e: any) => e.name === this.produccion?.current_state?.state?.name);
  }

  changeEstado(direction: TimelineDirection = TimelineDirection.NEXT) {
    this.eventTimeline.emit(direction);
  }

}
