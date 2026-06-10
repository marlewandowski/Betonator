import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

export interface CompetitionFormData {
  title: string;
  name: string;
  isInternational: boolean;
}

@Component({
  selector: 'competition-form-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Nazwa</mat-label>
        <input matInput [(ngModel)]="name" />
      </mat-form-field>
      <mat-checkbox [(ngModel)]="isInternational">Reprezentacje narodowe</mat-checkbox>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Anuluj</button>
      <button mat-flat-button color="primary" [disabled]="!name.trim()" (click)="ref.close({ name: name.trim(), isInternational })">Zapisz</button>
    </mat-dialog-actions>
  `,
  styles: [`.full { width: 100%; }`],
})
export class CompetitionFormDialog {
  ref = inject(MatDialogRef<CompetitionFormDialog>);
  data = inject<CompetitionFormData>(MAT_DIALOG_DATA);
  name = this.data.name;
  isInternational = this.data.isInternational;
}
