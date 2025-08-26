import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
    selector: 'icon-expand-all',
    imports: [CommonModule],
    standalone: true,
    template: `
        <ng-template #template>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" [ngClass]="class">
                <!-- Cuadrado grande exterior (elemento principal) -->
                <rect x="1" y="1" width="18" height="18" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <!-- Cuadrado pequeño interno (elemento secundario) -->
                <rect x="4" y="4" width="18" height="18" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <!-- Flecha diagonal hacia arriba-derecha (expandir principal) -->
                <path d="M8 10L12 6L16 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <!-- Flecha diagonal hacia abajo-izquierda (expandir principal) -->
                <path d="M8 14L12 18L16 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </ng-template>
    `,
})
export class IconExpandAllComponent {
    @Input() class: any = '';
    @ViewChild('template', { static: true }) template: any;
    
    constructor(private viewContainerRef: ViewContainerRef) {}
    
    ngOnInit() {
        this.viewContainerRef.createEmbeddedView(this.template);
        this.viewContainerRef.element.nativeElement.remove();
    }
}
