import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
@Component({
    selector: 'icon-adjustments',
    imports: [CommonModule],
    standalone: true,
    template: `
        <ng-template #template>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" [ngClass]="class">
                <path d="M6 8L10 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M6 12L10 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M6 16L10 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M14 8L18 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M14 12L18 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M14 16L18 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="12" cy="16" r="2" stroke="currentColor" stroke-width="1.5"/>
            </svg>
        </ng-template>
    `,
})
export class IconAdjustmentsComponent {
    @Input() class: any = '';
    @ViewChild('template', { static: true }) template: any;
    constructor(private viewContainerRef: ViewContainerRef) { }
    ngOnInit() {
        this.viewContainerRef.createEmbeddedView(this.template);
        this.viewContainerRef.element.nativeElement.remove();
    }
}
