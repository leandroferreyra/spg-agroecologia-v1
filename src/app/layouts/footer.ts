import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SharedModule } from 'src/shared.module';

@Component({
    selector: 'footer',
    standalone: true,
    imports: [CommonModule, SharedModule], 
    templateUrl: './footer.html',
})
export class FooterComponent {
    currYear: number = new Date().getFullYear();
    constructor() { }
    ngOnInit() { }
}
