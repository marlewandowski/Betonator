import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

export interface UserFormData {
  mode: 'create' | 'edit';
  username: string;
  email: string | null;
  isAdmin: boolean;
  isDisabled: boolean;
}

@Component({
  selector: 'user-form-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Nowy użytkownik' : 'Edytuj użytkownika: ' + data.username }}</h2>
    <mat-dialog-content>
      @if (data.mode === 'create') {
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nazwa użytkownika</mat-label>
          <input matInput [(ngModel)]="username" />
        </mat-form-field>
      }
      <mat-form-field appearance="outline" class="full">
        <mat-label>Email (opcjonalnie)</mat-label>
        <input matInput [(ngModel)]="email" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>{{ data.mode === 'create' ? 'Hasło' : 'Nowe hasło (zostaw puste, aby nie zmieniać)' }}</mat-label>
        <input matInput type="password" [(ngModel)]="password" />
      </mat-form-field>
      <div class="flags">
        <mat-checkbox [(ngModel)]="isAdmin">Admin</mat-checkbox>
        @if (data.mode === 'edit') {
          <mat-checkbox [(ngModel)]="isDisabled">Wyłączony</mat-checkbox>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Anuluj</button>
      <button mat-flat-button color="primary" [disabled]="!canSave()" (click)="save()">Zapisz</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full { width: 100%; }
    .flags { display: flex; gap: 1rem; }
  `],
})
export class UserFormDialog {
  ref = inject(MatDialogRef<UserFormDialog>);
  data = inject<UserFormData>(MAT_DIALOG_DATA);
  username = this.data.username;
  email = this.data.email ?? '';
  password = '';
  isAdmin = this.data.isAdmin;
  isDisabled = this.data.isDisabled;

  canSave() {
    if (this.data.mode === 'create') {
      return !!this.username.trim() && !!this.password;
    }
    return true;
  }

  save() {
    if (this.data.mode === 'create') {
      this.ref.close({
        username: this.username.trim(),
        password: this.password,
        email: this.email.trim() || null,
        isAdmin: this.isAdmin,
      });
    } else {
      this.ref.close({
        email: this.email.trim() || null,
        isAdmin: this.isAdmin,
        isDisabled: this.isDisabled,
        newPassword: this.password || undefined,
      });
    }
  }
}
