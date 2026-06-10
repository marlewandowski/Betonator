import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { GroupDto, MatchDto, MatchStage, stageLabel } from '../../core/models';

export interface MatchFormData {
  title: string;
  gameTime: string;
  team1: string;
  team2: string;
  description: string | null;
  groupId: number | null;
  stage: MatchStage | null;
  bracketPosition: number;
  feederMatch1Id: number | null;
  feederMatch2Id: number | null;
  groups: GroupDto[];
  eliminationMatches: MatchDto[];
}

type Placement = 'single' | 'group' | 'bracket';

@Component({
  selector: 'match-form-dialog',
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatOptionModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Umiejscowienie</mat-label>
        <mat-select [(ngModel)]="placement" (selectionChange)="onPlacementChange()">
          <mat-option value="single">Pojedynczy mecz</mat-option>
          <mat-option value="group" [disabled]="data.groups.length === 0">Faza grupowa</mat-option>
          <mat-option value="bracket">Drabinka pucharowa</mat-option>
        </mat-select>
      </mat-form-field>

      @if (placement === 'group') {
        <mat-form-field appearance="outline" class="full">
          <mat-label>Grupa</mat-label>
          <mat-select [(ngModel)]="groupId">
            @for (g of data.groups; track g.id) {
              <mat-option [value]="g.id">{{ g.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      @if (placement === 'bracket') {
        <mat-form-field appearance="outline" class="full">
          <mat-label>Etap</mat-label>
          <mat-select [(ngModel)]="stage">
            @for (s of bracketStages; track s) {
              <mat-option [value]="s">{{ stageLabel(s) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Pozycja w drabince</mat-label>
          <input matInput type="number" min="0" [(ngModel)]="bracketPosition" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Mecz źródłowy #1 (opcjonalnie)</mat-label>
          <mat-select [(ngModel)]="feederMatch1Id">
            <mat-option [value]="null">— brak —</mat-option>
            @for (m of data.eliminationMatches; track m.id) {
              <mat-option [value]="m.id">{{ stageLabel(m.stage) }} #{{ m.bracketPosition }} — {{ m.team1 }} vs {{ m.team2 }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Mecz źródłowy #2 (opcjonalnie)</mat-label>
          <mat-select [(ngModel)]="feederMatch2Id">
            <mat-option [value]="null">— brak —</mat-option>
            @for (m of data.eliminationMatches; track m.id) {
              <mat-option [value]="m.id">{{ stageLabel(m.stage) }} #{{ m.bracketPosition }} — {{ m.team1 }} vs {{ m.team2 }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      <mat-form-field appearance="outline" class="full">
        <mat-label>Początek meczu (czas lokalny)</mat-label>
        <input matInput type="datetime-local" [(ngModel)]="gameTime" />
      </mat-form-field>
      <div class="row">
        <mat-form-field appearance="outline">
          <mat-label>Gospodarze</mat-label>
          <input matInput [(ngModel)]="team1" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Goście</mat-label>
          <input matInput [(ngModel)]="team2" />
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Opis (opcjonalnie)</mat-label>
        <input matInput [(ngModel)]="description" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Anuluj</button>
      <button mat-flat-button color="primary" [disabled]="!canSave()" (click)="save()">Zapisz</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full { width: 100%; }
    .row { display: flex; gap: 0.75rem; }
    .row mat-form-field { flex: 1; }
  `],
})
export class MatchFormDialog {
  ref = inject(MatDialogRef<MatchFormDialog>);
  data = inject<MatchFormData>(MAT_DIALOG_DATA);

  bracketStages: MatchStage[] = [
    MatchStage.R32, MatchStage.R16, MatchStage.QuarterFinal,
    MatchStage.SemiFinal, MatchStage.ThirdPlace, MatchStage.Final,
  ];

  placement: Placement = this.data.groupId !== null
    ? 'group'
    : (this.data.stage !== null && this.data.stage !== MatchStage.Group ? 'bracket' : 'single');
  groupId = this.data.groupId;
  stage: MatchStage = (this.data.stage !== null && this.data.stage !== MatchStage.Group)
    ? this.data.stage
    : MatchStage.R16;
  bracketPosition = this.data.bracketPosition;
  feederMatch1Id = this.data.feederMatch1Id;
  feederMatch2Id = this.data.feederMatch2Id;

  gameTime = this.data.gameTime;
  team1 = this.data.team1;
  team2 = this.data.team2;
  description = this.data.description ?? '';

  stageLabel = stageLabel;

  onPlacementChange() {
    if (this.placement !== 'group') this.groupId = null;
    if (this.placement !== 'bracket') {
      this.feederMatch1Id = null;
      this.feederMatch2Id = null;
    }
  }

  canSave() {
    if (!this.gameTime || !this.team1.trim() || !this.team2.trim()) return false;
    if (this.placement === 'group' && !this.groupId) return false;
    if (this.placement === 'bracket' && !this.stage) return false;
    return true;
  }

  save() {
    const localDate = new Date(this.gameTime);
    let groupId: number | null = null;
    let stage: MatchStage | null = null;
    let bracketPosition = 0;
    let feeder1: number | null = null;
    let feeder2: number | null = null;

    if (this.placement === 'group') {
      groupId = this.groupId;
      stage = null;
    } else if (this.placement === 'bracket') {
      stage = this.stage;
      bracketPosition = this.bracketPosition;
      feeder1 = this.feederMatch1Id;
      feeder2 = this.feederMatch2Id;
    }

    this.ref.close({
      gameTime: localDate.toISOString(),
      team1: this.team1.trim(),
      team2: this.team2.trim(),
      description: this.description.trim() || null,
      groupId,
      stage,
      bracketPosition,
      feederMatch1Id: feeder1,
      feederMatch2Id: feeder2,
    });
  }
}
