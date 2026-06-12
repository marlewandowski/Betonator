import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CompetitionsApi } from '../../core/api/competitions.api';
import { UsersApi } from '../../core/api/users.api';
import { ParticipantDto, UserDto } from '../../core/models';

@Component({
  selector: 'app-participants',
  imports: [
    FormsModule, RouterLink,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatOptionModule, MatCheckboxModule,
  ],
  template: `
    <div class="header-wrapper">
      <div class="header">
        <h1>Uczestnicy</h1>
        <a mat-button [routerLink]="['/competitions', id]">Wróć do meczów</a>
      </div>
    </div>

    <div class="add">
      <mat-form-field appearance="outline">
        <mat-label>Dodaj użytkownika</mat-label>
        <mat-select [(ngModel)]="addUserId">
          @for (u of availableUsers(); track u.id) {
            <mat-option [value]="u.id">{{ u.username }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <button mat-flat-button color="primary" [disabled]="!addUserId" (click)="add()">Dodaj</button>
    </div>

    @if (loading()) { <p>Ładowanie…</p> }
    @else {
      <table mat-table [dataSource]="rows()" class="mat-elevation-z1 full">
        <ng-container matColumnDef="username">
          <th mat-header-cell *matHeaderCellDef>Gracz</th>
          <td mat-cell *matCellDef="let p" data-label="Gracz">{{ p.username }}</td>
        </ng-container>
        <ng-container matColumnDef="active">
          <th mat-header-cell *matHeaderCellDef>Aktywny</th>
          <td mat-cell *matCellDef="let p" data-label="Aktywny">
            <mat-checkbox [checked]="p.isActive" (change)="toggle(p, $event.checked)"></mat-checkbox>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let p" data-label="Akcje">
            <button mat-button color="warn" (click)="remove(p)">Usuń</button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>
    }
  `,
  styles: [`
    .header { display: flex; align-items: center; justify-content: space-between; }
    .add { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
    .full { width: 100%; }
    @media (max-width: 700px) {
      .add mat-form-field { width: 100%; }
    }
  `],
})
export class ParticipantsPage implements OnInit {
  @Input() id!: string;

  private compsApi = inject(CompetitionsApi);
  private usersApi = inject(UsersApi);

  rows = signal<ParticipantDto[]>([]);
  allUsers = signal<UserDto[]>([]);
  loading = signal(true);
  addUserId: number | null = null;
  cols = ['username', 'active', 'actions'];

  ngOnInit() {
    this.usersApi.list().subscribe(u => this.allUsers.set(u));
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.compsApi.participants(+this.id).subscribe({
      next: r => { this.rows.set(r); this.loading.set(false); this.addUserId = null; },
      error: () => this.loading.set(false),
    });
  }

  availableUsers() {
    const taken = new Set(this.rows().map(r => r.userId));
    return this.allUsers().filter(u => !taken.has(u.id) && !u.isDisabled);
  }

  add() {
    if (!this.addUserId) return;
    this.compsApi.addParticipant(+this.id, this.addUserId, true).subscribe(() => this.refresh());
  }

  toggle(p: ParticipantDto, isActive: boolean) {
    this.compsApi.addParticipant(+this.id, p.userId, isActive).subscribe(() => this.refresh());
  }

  remove(p: ParticipantDto) {
    this.compsApi.removeParticipant(+this.id, p.userId).subscribe(() => this.refresh());
  }
}
