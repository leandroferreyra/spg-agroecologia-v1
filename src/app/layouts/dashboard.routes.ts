import { Routes } from "@angular/router";
import { DashboardComponent } from "./dashboard.component";


export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        component: DashboardComponent,
        children: [
            // Shared
            {
                path: 'user-profile',
                loadComponent: () => import('../users/profile').then(m => m.ProfileComponent)
            }

        ]
    }
]