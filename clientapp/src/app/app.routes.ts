import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'competitions' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'competitions',
    canActivate: [authGuard],
    loadComponent: () => import('./features/competitions/competitions-list.page').then(m => m.CompetitionsListPage),
  },
  {
    path: 'competitions/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/competitions/competition-detail.page').then(m => m.CompetitionDetailPage),
  },
  {
    path: 'competitions/:id/standings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/standings/standings.page').then(m => m.StandingsPage),
  },
  {
    path: 'competitions/:id/participants',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/participants.page').then(m => m.ParticipantsPage),
  },
  {
    path: 'me/bets',
    canActivate: [authGuard],
    loadComponent: () => import('./features/me/my-bets.page').then(m => m.MyBetsPage),
  },
  {
    path: 'me/matches',
    canActivate: [authGuard],
    loadComponent: () => import('./features/me/daily-matches.page').then(m => m.DailyMatchesPage),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/users.page').then(m => m.UsersPage),
  },
  { path: '**', redirectTo: 'competitions' },
];
