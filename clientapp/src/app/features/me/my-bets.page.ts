import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { BetsApi } from '../../core/api/bets.api';
import { CompetitionsApi } from '../../core/api/competitions.api';
import { BetDto, CompetitionDto } from '../../core/models';

@Component({
  selector: 'app-my-bets',
  imports: [DatePipe, FormsModule, MatTableModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  template: `
    <div class="header-wrapper">
      <div class="header">
        <h1>Moje typy</h1>
        <mat-form-field appearance="outline">
          <mat-label>Rozgrywki</mat-label>
          <mat-select [(ngModel)]="selectedComp" (selectionChange)="load()">
            <mat-option [value]="null">Wszystkie</mat-option>
            @for (c of competitions(); track c.id) {
              <mat-option [value]="c.id">{{ c.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
    </div>

    @if (loading()) {
      <p>Ładowanie…</p>
    } @else if (bets().length === 0) {
      <p>Nie masz jeszcze żadnych typów.</p>
    } @else {
      <table mat-table [dataSource]="bets()" class="mat-elevation-z1 full">
        <ng-container matColumnDef="placedAt">
          <th mat-header-cell *matHeaderCellDef>Dodano</th>
          <td mat-cell *matCellDef="let b">{{ b.updatedAt | date:'short' }}</td>
        </ng-container>
        <ng-container matColumnDef="bet">
          <th mat-header-cell *matHeaderCellDef>Typ</th>
          <td mat-cell *matCellDef="let b">{{ b.betGoal1 }} : {{ b.betGoal2 }} ({{ b.outcome }})</td>
        </ng-container>
        <ng-container matColumnDef="points">
          <th mat-header-cell *matHeaderCellDef>Punkty</th>
          <td mat-cell *matCellDef="let b">{{ b.points ?? '—' }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>
    }
  `,
  styles: [`.full { width: 100%; }`],
})
export class MyBetsPage implements OnInit {
  private betsApi = inject(BetsApi);
  private compsApi = inject(CompetitionsApi);

  competitions = signal<CompetitionDto[]>([]);
  bets = signal<BetDto[]>([]);
  loading = signal(true);
  selectedComp: number | null = null;
  cols = ['placedAt', 'bet', 'points'];

  ngOnInit() {
    this.compsApi.list().subscribe(r => this.competitions.set(r));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.betsApi.myBets(this.selectedComp ?? undefined).subscribe({
      next: r => { this.bets.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
