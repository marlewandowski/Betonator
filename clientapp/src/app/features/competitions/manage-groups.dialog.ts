import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { GroupsApi } from '../../core/api/groups.api';
import { GroupDto } from '../../core/models';

export interface ManageGroupsData {
  competitionId: number;
}

@Component({
  selector: 'manage-groups-dialog',
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatListModule,
  ],
  template: `
    <h2 mat-dialog-title>Zarządzaj grupami</h2>
    <mat-dialog-content>
      <mat-list>
        @for (g of groups(); track g.id) {
          <mat-list-item>
            <mat-form-field appearance="outline" class="name">
              <mat-label>Nazwa</mat-label>
              <input matInput [(ngModel)]="g.name" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="order">
              <mat-label>Kolejność</mat-label>
              <input matInput type="number" [(ngModel)]="g.displayOrder" />
            </mat-form-field>
            <button mat-icon-button color="primary" title="Zapisz" (click)="save(g)"><mat-icon>save</mat-icon></button>
            <button mat-icon-button color="warn" title="Usuń" (click)="remove(g)"><mat-icon>delete</mat-icon></button>
          </mat-list-item>
        }
      </mat-list>

      <div class="add">
        <mat-form-field appearance="outline" class="name">
          <mat-label>Nazwa nowej grupy</mat-label>
          <input matInput [(ngModel)]="newName" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="order">
          <mat-label>Kolejność</mat-label>
          <input matInput type="number" [(ngModel)]="newOrder" />
        </mat-form-field>
        <button mat-flat-button color="primary" [disabled]="!newName.trim()" (click)="add()">Dodaj</button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(true)">Zamknij</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-list-item { display: flex; align-items: center; gap: 0.5rem; }
    .name { flex: 1; min-width: 12rem; }
    .order { width: 6rem; }
    .add { display: flex; gap: 0.75rem; align-items: center; margin-top: 0.5rem; }
  `],
})
export class ManageGroupsDialog {
  ref = inject(MatDialogRef<ManageGroupsDialog>);
  data = inject<ManageGroupsData>(MAT_DIALOG_DATA);
  private api = inject(GroupsApi);

  groups = signal<GroupDto[]>([]);
  newName = '';
  newOrder = 0;

  constructor() { this.refresh(); }

  refresh() {
    this.api.list(this.data.competitionId).subscribe(g => this.groups.set(g));
  }

  add() {
    this.api.create(this.data.competitionId, {
      name: this.newName.trim(),
      displayOrder: this.newOrder,
    }).subscribe(() => {
      this.newName = '';
      this.newOrder = (this.groups()?.length ?? 0) + 1;
      this.refresh();
    });
  }

  save(g: GroupDto) {
    this.api.update(g.id, { name: g.name, displayOrder: g.displayOrder }).subscribe(() => this.refresh());
  }

  remove(g: GroupDto) {
    if (!confirm(`Usunąć ${g.name}? Mecze zostaną, ale stracą przypisanie do grupy.`)) return;
    this.api.remove(g.id).subscribe(() => this.refresh());
  }
}
