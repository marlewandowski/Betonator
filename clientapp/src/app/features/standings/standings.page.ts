import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { CompetitionsApi } from '../../core/api/competitions.api';
import { StandingsRowDto } from '../../core/models';

@Component({
  selector: 'app-standings',
  imports: [RouterLink, MatTableModule, MatButtonModule],
  template: `
    <div class="header-wrapper">
      <div class="header">
        <h1>Tabela</h1>
        <a mat-button [routerLink]="['/competitions', id]">Wróć do meczów</a>
      </div>
    </div>
    @if (loading()) {
      <p>Ładowanie…</p>
    } @else if (rows().length === 0) {
      <p>Brak uczestników.</p>
    } @else {
      <table mat-table [dataSource]="rows()" class="mat-elevation-z1 full">
        <ng-container matColumnDef="rank">
          <th mat-header-cell *matHeaderCellDef>#</th>
          <td mat-cell *matCellDef="let r; let i = index" data-label="#">{{ i + 1 }}</td>
        </ng-container>
        <ng-container matColumnDef="username">
          <th mat-header-cell *matHeaderCellDef>Gracz</th>
          <td mat-cell *matCellDef="let r" data-label="Gracz">{{ r.username }}</td>
        </ng-container>
        <ng-container matColumnDef="points">
          <th mat-header-cell *matHeaderCellDef>Punkty</th>
          <td mat-cell *matCellDef="let r" data-label="Punkty"><strong>{{ r.points }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="pointsPlayoff">
          <th mat-header-cell *matHeaderCellDef>Playoff</th>
          <td mat-cell *matCellDef="let r" data-label="Playoff"><strong>{{ r.pointsPlayoff }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="bets">
          <th mat-header-cell *matHeaderCellDef>Typy</th>
          <td mat-cell *matCellDef="let r" data-label="Typy">{{ r.betsPlaced }}</td>
        </ng-container>
        <ng-container matColumnDef="exact">
          <th mat-header-cell *matHeaderCellDef>Dokładne</th>
          <td mat-cell *matCellDef="let r" data-label="Dokładne">{{ r.exactScores }}</td>
        </ng-container>
        <ng-container matColumnDef="correct">
          <th mat-header-cell *matHeaderCellDef>Trafiony wynik</th>
          <td mat-cell *matCellDef="let r" data-label="Trafiony wynik">{{ r.correctOutcomes }}</td>
        </ng-container>
        <ng-container matColumnDef="correctGoals">
          <th mat-header-cell *matHeaderCellDef>Bonus za gole</th>
          <td mat-cell *matCellDef="let r" data-label="Bonus za gole(+1)">{{ r.correctGoalsOneSide }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>
    }
  `,
  styles: [`
    .header { display: flex; align-items: center; justify-content: space-between; }
    .full { width: 100%; }
  `],
})
export class StandingsPage implements OnInit {
  @Input() id!: string;
  private api = inject(CompetitionsApi);

  rows = signal<StandingsRowDto[]>([]);
  loading = signal(true);
  cols = ['rank', 'username', 'points','pointsPlayoff', 'bets', 'exact', 'correct','correctGoals'];

  ngOnInit() {
    this.api.standings(+this.id).subscribe({
      next: r => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
