import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toggleAnimation } from 'src/app/shared/animations';
import { SharedModule } from 'src/shared.module';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [CommonModule,SharedModule, RouterLink],
    templateUrl: './profile.html',
    animations: [toggleAnimation],
})
export class ProfileComponent {
    constructor() {}
}
