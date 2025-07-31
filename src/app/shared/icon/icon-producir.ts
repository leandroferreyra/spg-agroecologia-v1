import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
    selector: 'icon-producir',
    standalone: true,
    imports: [CommonModule],
    template: `
 <ng-template #template>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 80 80"
        width="36"
        height="36"
        [ngClass]="class"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <!-- Engranaje centrado -->
        <g transform="translate(40,40)">
          <!-- Dientes del engranaje (8 dientes principales) -->
          <path d="M-3,-24 L-3,-28 L3,-28 L3,-24" />
          <path d="M14.7,-17.7 L18.4,-21.4 L21.4,-18.4 L17.7,-14.7" />
          <path d="M24,3 L28,3 L28,-3 L24,-3" />
          <path d="M17.7,14.7 L21.4,18.4 L18.4,21.4 L14.7,17.7" />
          <path d="M3,24 L3,28 L-3,28 L-3,24" />
          <path d="M-14.7,17.7 L-18.4,21.4 L-21.4,18.4 L-17.7,14.7" />
          <path d="M-24,-3 L-28,-3 L-28,3 L-24,3" />
          <path d="M-17.7,-14.7 L-21.4,-18.4 L-18.4,-21.4 L-14.7,-17.7" />
          
          <!-- Dientes intermedios (4 adicionales) -->
          <path d="M10.4,-20.8 L12.7,-23.1 L15.1,-20.7 L12.8,-18.4" />
          <path d="M20.8,10.4 L23.1,12.7 L20.7,15.1 L18.4,12.8" />
          <path d="M-10.4,20.8 L-12.7,23.1 L-15.1,20.7 L-12.8,18.4" />
          <path d="M-20.8,-10.4 L-23.1,-12.7 L-20.7,-15.1 L-18.4,-12.8" />
          
          <!-- Círculo exterior principal -->
          <circle cx="0" cy="0" r="20" stroke-width="2"/>
          
          <!-- Círculo intermedio para profundidad -->
          <circle cx="0" cy="0" r="16" stroke-width="1" opacity="0.6"/>
          
          <!-- Círculo interior -->
          <circle cx="0" cy="0" r="12" stroke-width="1.5"/>
          
          <!-- Agujero central -->
          <circle cx="0" cy="0" r="6" stroke-width="2"/>
          
          <!-- Detalles decorativos (tornillos/remaches) -->
          <circle cx="0" cy="-10" r="1.5" fill="currentColor" opacity="0.7"/>
          <circle cx="8.7" cy="5" r="1.5" fill="currentColor" opacity="0.7"/>
          <circle cx="-8.7" cy="5" r="1.5" fill="currentColor" opacity="0.7"/>
          
          <!-- Líneas radiales para textura -->
          <path d="M0,-6 L0,-12" stroke-width="0.8" opacity="0.4"/>
          <path d="M5.2,-3 L10.4,-6" stroke-width="0.8" opacity="0.4"/>
          <path d="M5.2,3 L10.4,6" stroke-width="0.8" opacity="0.4"/>
          <path d="M0,6 L0,12" stroke-width="0.8" opacity="0.4"/>
          <path d="M-5.2,3 L-10.4,6" stroke-width="0.8" opacity="0.4"/>
          <path d="M-5.2,-3 L-10.4,-6" stroke-width="0.8" opacity="0.4"/>
        </g>
      </svg>
    </ng-template>
  `,
})
export class IconProducirComponent {
    @Input() class: any = '';
    @ViewChild('template', { static: true }) template: any;

    constructor(private viewContainerRef: ViewContainerRef) { }

    ngOnInit() {
        this.viewContainerRef.createEmbeddedView(this.template);
        this.viewContainerRef.element.nativeElement.remove();
    }
}
