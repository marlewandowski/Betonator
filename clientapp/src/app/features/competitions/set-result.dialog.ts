import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

export interface SetResultData {
  team1: string;
  team2: string;
  goal1: number | null;
  goal2: number | null;
  resultDescription: string | null;
}

@Component({
  selector: 'set-result-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title>Ustaw wynik</h2>
    <mat-dialog-content>
      <p class="match">{{ data.team1 }} vs {{ data.team2 }}</p>
      <div class="row">
        <mat-form-field appearance="outline">
          <mat-label>{{ data.team1 }}</mat-label>
          <input matInput type="number" min="0" max="99" [(ngModel)]="goal1" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ data.team2 }}</mat-label>
          <input matInput type="number" min="0" max="99" [(ngModel)]="goal2" />
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Opis (opcjonalnie)</mat-label>
        <input matInput [(ngModel)]="resultDescription" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close({ clear: true })">Wyczyść wynik</button>
      <span class="spacer"></span>
      <button mat-button (click)="ref.close()">Anuluj</button>
      <button mat-flat-button color="primary" [disabled]="!canSave()" (click)="save()">Zapisz</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full { width: 100%; }
    .row { display: flex; gap: 0.75rem; }
    .row mat-form-field { flex: 1; }
    .match { margin: 0 0 0.5rem; font-weight: 500; }
    .spacer { flex: 1; }
    mat-dialog-actions { display: flex; align-items: center; }
  `],
})
export class SetResultDialog {
  ref = inject(MatDialogRef<SetResultDialog>);
  data = inject<SetResultData>(MAT_DIALOG_DATA);
  goal1: number | null = this.data.goal1;
  goal2: number | null = this.data.goal2;
  resultDescription = this.data.resultDescription ?? '';

  canSave() {
    return this.goal1 !== null && this.goal2 !== null && this.goal1 >= 0 && this.goal2 >= 0;
  }

  save() {
    this.ref.close({
      goal1: this.goal1,
      goal2: this.goal2,
      resultDescription: this.resultDescription.trim() || null,
    });
  }
}
