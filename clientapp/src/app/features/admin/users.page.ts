import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UsersApi } from '../../core/api/users.api';
import { UserDto } from '../../core/models';
import { UserFormDialog } from './user-form.dialog';

@Component({
  selector: 'app-admin-users',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="header">
      <h1>Użytkownicy</h1>
      <button mat-flat-button color="primary" (click)="create()">
        <mat-icon>add</mat-icon> Nowy użytkownik
      </button>
    </div>

    @if (loading()) { <p>Ładowanie…</p> }
    @else {
      <table mat-table [dataSource]="rows()" class="mat-elevation-z1 full">
        <ng-container matColumnDef="username">
          <th mat-header-cell *matHeaderCellDef>Nazwa użytkownika</th>
          <td mat-cell *matCellDef="let u">{{ u.username }}</td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let u">{{ u.email || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef>Rola</th>
          <td mat-cell *matCellDef="let u">{{ u.isAdmin ? 'Admin' : 'Użytkownik' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let u">{{ u.isDisabled ? 'Wyłączony' : 'Aktywny' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let u"><button mat-button (click)="edit(u)">Edytuj</button></td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>
    }
  `,
  styles: [`
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .full { width: 100%; }
  `],
})
export class UsersPage implements OnInit {
  private api = inject(UsersApi);
  private dialog = inject(MatDialog);

  rows = signal<UserDto[]>([]);
  loading = signal(true);
  cols = ['username', 'email', 'role', 'status', 'actions'];

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: r => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create() {
    const ref = this.dialog.open(UserFormDialog, {
      data: { mode: 'create', username: '', email: null, isAdmin: false, isDisabled: false },
      width: '460px',
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.api.create(result).subscribe(() => this.refresh());
    });
  }

  edit(u: UserDto) {
    const ref = this.dialog.open(UserFormDialog, {
      data: { mode: 'edit', username: u.username, email: u.email, isAdmin: u.isAdmin, isDisabled: u.isDisabled },
      width: '460px',
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.api.update(u.id, result).subscribe(() => this.refresh());
    });
  }
}
