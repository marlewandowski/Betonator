import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BetsApi } from '../../core/api/bets.api';
import { CompetitionsApi } from '../../core/api/competitions.api';
import { MatchesApi } from '../../core/api/matches.api';
import { CompetitionDto, MatchDto } from '../../core/models';
import { TeamLogoComponent } from '../team-logo/team-logo';
import { MatchBetsDialog } from '../competitions/match-bets.dialog';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';

interface DailyMatchRow {
  competition: CompetitionDto;
  match: MatchDto;
  goal1: number | null;
  goal2: number | null;
  saving: boolean;
}

@Component({
  selector: 'app-daily-matches',
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TeamLogoComponent,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="header-wrapper">
    <div class="header">
      <div>
        <h1>Mecze dnia</h1>
        <p class="muted">Wszystkie mecze z wybranego dnia w Twoich rozgrywkach.</p>
      </div>

      <mat-form-field appearance="outline" class="date-nav">
        <button mat-icon-button matPrefix (click)="changeDate(-1)" type="button">
          <mat-icon>chevron_left</mat-icon>
        </button>

        <input
          matInput
          [matDatepicker]="picker"
          [(ngModel)]="selectedDate"
          (ngModelChange)="load()"
        />

        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>

        <button mat-icon-button matSuffix (click)="changeDate(1)" type="button">
          <mat-icon>chevron_right</mat-icon>
        </button>

        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
    </div>
    </div>

    @if (loading()) {
      <p>Ładowanie...</p>
    } @else if (rows().length === 0) {
      <p>Brak meczów w tym dniu.</p>
    } @else {
      <div class="match-list">
        @for (r of rows(); track r.match.id) {
          <div
            class="match-card"
            [class.can-view-bets]="canViewBets(r)"
            [attr.role]="canViewBets(r) ? 'button' : null"
            [attr.tabindex]="canViewBets(r) ? 0 : null"
            (click)="openMatchBets(r)"
            (keydown.enter)="openMatchBets(r)"
            (keydown.space)="openMatchBets(r)">

            <div class="time">
              {{ r.match.gameTime | date:'HH:mm' }}
              <small>{{ r.competition.name }}</small>
            </div>

            <div class="teams">
              <div class="team-row">
                <app-team-logo
                  [teamName]="r.match.team1"
                  [isInternational]="r.competition.isInternational">
                </app-team-logo>
                <span class="team-name">{{ r.match.team1 }}</span>
              </div>

              <div class="vs">vs</div>

              <div class="team-row">
                <app-team-logo
                  [teamName]="r.match.team2"
                  [isInternational]="r.competition.isInternational">
                </app-team-logo>
                <span class="team-name">{{ r.match.team2 }}</span>
              </div>

              @if (r.match.description) {
                <small class="description">{{ r.match.description }}</small>
              }
            </div>

            <div class="result">
              @if (r.match.goal1 !== null && r.match.goal2 !== null) {
                <strong>{{ r.match.goal1 }} : {{ r.match.goal2 }}</strong>
              }
            </div>

            <div class="bet">
              <input
                type="number"
                min="0"
                max="99"
                class="goal"
                [(ngModel)]="r.goal1"
                [disabled]="isBetReadOnly(r)"
                (click)="$event.stopPropagation()" />

              <span>:</span>

              <input
                type="number"
                min="0"
                max="99"
                class="goal"
                [(ngModel)]="r.goal2"
                [disabled]="isBetReadOnly(r)"
                (click)="$event.stopPropagation()" />

              @if (!r.match.myBet) {
                <button
                  mat-icon-button
                  class="bet-save-button"
                  color="primary"
                  aria-label="Zapisz typ"
                  (click)="$event.stopPropagation(); save(r)"
                  [disabled]="r.match.isLocked || r.saving">
                  <mat-icon>save</mat-icon>
                </button>
              }
            </div>

            <div class="points">
              @if (r.match.myBet?.points !== null && r.match.myBet?.points !== undefined) {
                <strong>{{ r.match.myBet?.points }}</strong>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    p {
      color: white;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    h1 {
      margin-bottom: 0.25rem;
    }

    .muted {
      color: #666;
      margin: 0;
    }

    .date-nav {
      display: flex;
      align-items: center;
    }

    .match-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .match-card {
      display: grid;
      grid-template-columns:
    84px
    minmax(120px, 1fr)
    minmax(44px, max-content)
    max-content
    minmax(24px, max-content);
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      background: white;
    }

    .match-card.can-view-bets {
      cursor: pointer;
    }

    .match-card.can-view-bets:hover {
      border-color: #90caf9;
      box-shadow: 0 2px 10px rgba(25, 118, 210, 0.12);
    }

    .time {
      display: flex;
      flex-direction: column;
      color: #666;
      font-size: 13px;
      line-height: 1.2;
    }

    .time small {
      color: #999;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .teams {
      min-width: 0;
      display: flex;
    }

    .team-row {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .team-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .vs {
      color: #888;
      font-size: 0.75rem;
      margin: 0 6px 0 6px;
    }

    .description {
      display: block;
      margin-top: 4px;
      color: #777;
      font-size: 11px;
    }

    .result {
      text-align: center;
      font-size: 13px;
    }

    .bet {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: max-content;
    }

    .goal {
      width: 30px;
      height: 28px;
      padding: 0;
      border: 1px solid #ccc;
      border-radius: 6px;
      text-align: center;
    }

    .goal:disabled {
      background: #eee;
      color: #888;
    }

    .bet-save-button {
      flex: 0 0 auto;
      width: 32px;
      height: 32px;
      padding: 0;
    }

    .bet-save-button mat-icon {
      width: 20px;
      height: 20px;
      font-size: 20px;
    }

    .chip {
      padding: 2px 6px;
      border-radius: 999px;
      background: #f2f2f2;
      font-size: 10px;
    }

    .points {
      text-align: center;
      font-size: 14px;
    }

    @media (max-width: 900px) {
      .match-card {
        grid-template-columns: 64px minmax(0, 1fr);
        grid-template-areas:
      "time teams"
      "result bet"
      "points bet";
      }

      .time {
        grid-area: time;
      }

      .teams {
        grid-area: teams;
      }

      .result {
        grid-area: result;
        text-align: left;
      }

      .bet {
        grid-area: bet;
        justify-content: flex-start;
      }

      .points {
        grid-area: points;
        text-align: left;
      }
    }
  `],
})
export class DailyMatchesPage implements OnInit {
  private competitionsApi = inject(CompetitionsApi);
  private matchesApi = inject(MatchesApi);
  private betsApi = inject(BetsApi);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  selectedDate = this.toDateInput(new Date());

  rows = signal<DailyMatchRow[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.load();
  }

  load() {
    const dateStr = this.formatDate(this.selectedDate);
    this.loading.set(true);
    this.competitionsApi.list().subscribe({
      next: competitions => {
        if (competitions.length === 0) {
          this.rows.set([]);
          this.loading.set(false);
          return;
        }

        forkJoin(competitions.map(competition =>
          this.matchesApi.listForCompetition(competition.id),
        )).subscribe({
          next: matchLists => {
            const rows = matchLists.flatMap((matches, index) => {
              const competition = competitions[index];
              return matches
                .filter(match => this.toDateInput(new Date(match.gameTime)) === dateStr)
                .map(match => this.toRow(competition, match));
            });

            rows.sort((a, b) => new Date(a.match.gameTime).getTime() - new Date(b.match.gameTime).getTime());
            this.rows.set(rows);
            this.loading.set(false);
          },
          error: () => {
            this.rows.set([]);
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
      },
    });
  }

  save(r: DailyMatchRow) {
    if (r.match.isLocked || r.match.myBet) return;
    if (r.goal1 === null || r.goal2 === null) {
      return;
    }

    if (r.goal1 < 0 || r.goal2 < 0) return;

    r.saving = true;
    this.betsApi.upsert(r.match.id, r.goal1, r.goal2).subscribe({
      next: bet => {
        r.match.myBet = bet;
        r.saving = false;
        this.snack.open('Typ zapisany', undefined, { duration: 1500 });
      },
      error: err => {
        r.saving = false;
        this.snack.open(err?.error?.error ?? 'Nie udało się zapisać typu', 'Zamknij', { duration: 4000 });
      },
    });
  }

  canViewBets(r: DailyMatchRow): boolean {
    return r.match.myBet !== null;
  }

  isBetReadOnly(r: DailyMatchRow): boolean {
    return r.match.isLocked || r.saving || r.match.myBet !== null;
  }

  openMatchBets(r: DailyMatchRow) {
    if (!this.canViewBets(r)) return;

    this.dialog.open(MatchBetsDialog, {
      data: {
        match: r.match,
        isInternational: r.competition.isInternational,
      },
      width: '520px',
    });
  }

  private toRow(competition: CompetitionDto, match: MatchDto): DailyMatchRow {
    const goal1 = match.myBet?.betGoal1 ?? null;
    const goal2 = match.myBet?.betGoal2 ?? null;
    return {
      competition,
      match,
      goal1,
      goal2,
      saving: false
    };
  }

  private toDateInput(d: Date): string {
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  changeDate(days: number) {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + days);
    this.selectedDate = this.toDateInput(d);
    this.load();
  }

  private formatDate(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
