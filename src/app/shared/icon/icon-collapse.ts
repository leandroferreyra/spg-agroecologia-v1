import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
    selector: 'icon-collapse',
    imports: [CommonModule],
    standalone: true,
    template: `
        <ng-template #template>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" [ngClass]="class">
                <rect x="8" y="8" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <path d="M8 4L12 8L16 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 20L12 16L16 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </ng-template>
    `,
})
export class IconCollapseComponent {
    @Input() class: any = '';
    @ViewChild('template', { static: true }) template: any;
    
    constructor(private viewContainerRef: ViewContainerRef) {}
    
    ngOnInit() {
        this.viewContainerRef.createEmbeddedView(this.template);
        this.viewContainerRef.element.nativeElement.remove();
    }
}
