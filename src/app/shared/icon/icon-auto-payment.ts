import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
    selector: 'icon-auto-payment',
    imports: [CommonModule],
    standalone: true,
    template: `
        <ng-template #template>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" [ngClass]="class">
                <!-- Factura de fondo -->
                <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                <line x1="7" y1="12" x2="15" y2="12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                <line x1="7" y1="16" x2="13" y2="16" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                <!-- Texto PAGADO en diagonal, negro, con ángulo aún mayor -->
                <g transform="rotate(-50 12 12)">
                  <text x="12" y="15" text-anchor="middle" font-size="6.2" font-family="Arial Black, Arial, Helvetica, sans-serif" fill="#111" font-weight="bold" letter-spacing="0.3">PAGADO</text>
                </g>
            </svg>
        </ng-template>
    `,
})
export class IconAutoPaymentComponent {
    @Input() class: any = '';
    @ViewChild('template', { static: true }) template: any;
    
    constructor(private viewContainerRef: ViewContainerRef) {}
    
    ngOnInit() {
        this.viewContainerRef.createEmbeddedView(this.template);
        this.viewContainerRef.element.nativeElement.remove();
    }
} 