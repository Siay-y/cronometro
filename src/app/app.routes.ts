import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Mon Cher, 15 de setembro',
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
  },
  { path: '**', redirectTo: '' },
];
