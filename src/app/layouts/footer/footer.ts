import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'footer',
    standalone: true,
    imports: [CommonModule], 
    templateUrl: './footer.html',
})
export class FooterComponent {
    currYear: number = new Date().getFullYear();
    constructor() { }
    ngOnInit() { }
}
