import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
    selector: 'icon-expand',
    imports: [CommonModule],
    standalone: true,
    template: `
        <ng-template #template>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" [ngClass]="class">
                <!-- Cuadrado grande exterior -->
                <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <!-- Flecha diagonal hacia arriba-derecha -->
                <path d="M8 8L12 4M12 4L16 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <!-- Flecha diagonal hacia abajo-izquierda -->
                <path d="M16 16L12 20M12 20L8 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </ng-template>
    `,
})
export class IconExpandComponent {
    @Input() class: any = '';
    @ViewChild('template', { static: true }) template: any;
    
    constructor(private viewContainerRef: ViewContainerRef) {}
    
    ngOnInit() {
        this.viewContainerRef.createEmbeddedView(this.template);
        this.viewContainerRef.element.nativeElement.remove();
    }
}
