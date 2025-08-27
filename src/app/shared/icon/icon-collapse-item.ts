import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'icon-collapse-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-template #template>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        [ngClass]="class"
      >
        <path
          d="M6 15l6-6 6 6"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </ng-template>
  `,
})
export class IconCollapseItemComponent {
  @Input() class: string = '';
  @ViewChild('template', { static: true }) template: any;

  constructor(private viewContainerRef: ViewContainerRef) { }

  ngOnInit() {
    this.viewContainerRef.createEmbeddedView(this.template);
    this.viewContainerRef.element.nativeElement.remove();
  }
}
