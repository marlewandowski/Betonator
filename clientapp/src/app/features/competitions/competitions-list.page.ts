import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CompetitionsApi } from '../../core/api/competitions.api';
import { AuthService } from '../../core/auth.service';
import { CompetitionDto } from '../../core/models';
import { CompetitionFormDialog } from './competition-form.dialog';

@Component({
  selector: 'app-competitions-list',
  imports: [DatePipe, RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="header-wrapper">
      <div class="header">
        <h1>Rozgrywki</h1>
        @if (auth.isAdmin()) {
          <button mat-flat-button color="primary" (click)="create()">
            <mat-icon>add</mat-icon> Nowe rozgrywki
          </button>
        }
      </div>
    </div>

    @if (loading()) {
      <p>Ładowanie…</p>
    } @else if (rows().length === 0) {
      <p>Brak rozgrywek.</p>
    } @else {
      <table mat-table [dataSource]="rows()" class="mat-elevation-z1 full">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nazwa</th>
          <td mat-cell *matCellDef="let r" data-label="Nazwa"><a [routerLink]="['/competitions', r.id]">{{ r.name }}</a></td>
        </ng-container>
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>Typ</th>
          <td mat-cell *matCellDef="let r" data-label="Typ">{{ r.isInternational ? 'Reprezentacje' : 'Kluby' }}</td>
        </ng-container>
        <ng-container matColumnDef="matches">
          <th mat-header-cell *matHeaderCellDef>Mecze</th>
          <td mat-cell *matCellDef="let r" data-label="Mecze">{{ r.matchCount }}</td>
        </ng-container>
        <ng-container matColumnDef="participants">
          <th mat-header-cell *matHeaderCellDef>Gracze</th>
          <td mat-cell *matCellDef="let r" data-label="Gracze">{{ r.participantCount }}</td>
        </ng-container>
        <ng-container matColumnDef="created">
          <th mat-header-cell *matHeaderCellDef>Utworzono</th>
          <td mat-cell *matCellDef="let r" data-label="Utworzono">{{ r.createdAt | date:'mediumDate' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r" data-label="Akcje">
            <a mat-button [routerLink]="['/competitions', r.id, 'standings']">Tabela</a>
            @if (auth.isAdmin()) {
              <a mat-button [routerLink]="['/competitions', r.id, 'participants']">Gracze</a>
              <button mat-button (click)="edit(r)">Edytuj</button>
            }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>
    }
  `,
  styles: [`
    .header { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .full { width: 100%; }
  `],
})
export class CompetitionsListPage {
  private api = inject(CompetitionsApi);
  private dialog = inject(MatDialog);
  protected auth = inject(AuthService);

  rows = signal<CompetitionDto[]>([]);
  loading = signal(true);
  cols = ['name', 'type', 'matches', 'participants', 'created', 'actions'];

  constructor() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: r => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create() {
    const ref = this.dialog.open(CompetitionFormDialog, {
      data: { title: 'Nowe rozgrywki', name: '', isInternational: false },
      width: '420px',
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.api.create(result).subscribe(() => this.refresh());
    });
  }

  edit(c: CompetitionDto) {
    const ref = this.dialog.open(CompetitionFormDialog, {
      data: { title: 'Edytuj rozgrywki', name: c.name, isInternational: c.isInternational },
      width: '420px',
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.api.update(c.id, result).subscribe(() => this.refresh());
    });
  }
}
