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
import {TeamShortPipe} from '../../pipes/team-short-pipe';

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
    MatNativeDateModule,
    TeamShortPipe
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
            [class.no-result]="!hasResult(r)"
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
                <span class="team-name">
                  <span class="team-name-full">{{ r.match.team1 }}</span>
                  <span class="team-name-short">{{ r.match.team1 | teamShort }}</span>
                </span>
              </div>

              <div class="vs">vs</div>

              <div class="team-row">
                <app-team-logo
                  [teamName]="r.match.team2"
                  [isInternational]="r.competition.isInternational">
                </app-team-logo>
                <span class="team-name">
                  <span class="team-name-full">{{ r.match.team2 }}</span>
                  <span class="team-name-short">{{ r.match.team2 | teamShort }}</span>
                </span>
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

              @if (!r.match.myBet && !isBetReadOnly(r)) {
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
    .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .full { width: 100%; }
    .muted { color: #666; }
    h1 {
      margin-bottom: 0.25rem;
    }
    h2 { color: white; margin: 1.5rem 0 0.75rem; }
    h4 { margin: 0.75rem 0 0.5rem; font-size: 0.9rem; text-transform: uppercase; opacity: 0.7; }

    .bet, .bet-row { display: flex; align-items: center; gap: 0.4rem; }
    .goal { width: 3rem; padding: 0.3rem 0.4rem; border: 1px solid #bbb; border-radius: 4px; text-align: center; }
    .goal:disabled { background: #eee; color: #888; }
    .chip { background: #1976d2; color: white; padding: 0.05rem 0.45rem; border-radius: 10px; font-size: 0.75rem; }
    .pts { color: #2e7d32; font-weight: 600; }

    .groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr)); gap: 1rem;    }
    .group-card { container-type: inline-size; padding: 0.5rem; background-color: rgba(255, 255, 255, 0.9); min-width: 320px; }
    .standings { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .standings th, .standings td { padding: 0.25rem 0.4rem; text-align: center; border-bottom: 1px solid #eee; }
    .standings th:first-child, .standings td:first-child { text-align: left; }

    .bracket-card { container-type: inline-size; padding: 0.5rem; background-color: rgba(255, 255, 255, 0.9); }
    .bracket-wrap { overflow-x: auto; padding-bottom: 1rem; position: relative; background-color: rgba(255, 255, 255, 0.9); }
    .bracket-lines { position: absolute; top: 0; left: 0; pointer-events: none; z-index: 0; }
    .bracket-lines path { stroke: #90a4ae; stroke-width: 1.5; fill: none; }
    .bracket { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(var(--cols), minmax(220px, 1fr)); gap: 2rem; min-width: 100%; }
    .bracket-col { display: flex; flex-direction: column; gap: 1rem; }
    .bracket-matches { flex: 1; display: flex; flex-direction: column; justify-content: space-around; gap: 1rem; }
    .col-title { font-weight: 600; text-align: center; opacity: 0.8; margin-bottom: 0.25rem; }
    .match-card {
      border: 1px solid #ddd; border-radius: 6px; padding: 0.5rem 0.6rem; background: #fafafa;
      display: flex; flex-direction: column; gap: 0.3rem;
    }
    .match-card .meta { font-size: 0.75rem; color: #777; }
    .match-card .teams { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.4rem; }
    .match-card .t { font-weight: 500; }
    .match-card .score { font-weight: 600; color: #1976d2; }
    .match-card .vs { font-size: 0.75rem; color: #888; margin: 2px 0 2px 24px; }
    .match-card .admin { display: flex; justify-content: flex-end; }

    .match-card-bracket {
      border: 1px solid #ddd; border-radius: 6px; padding: 0.5rem 0.6rem; background: #fafafa;
      display: flex; flex-direction: column; gap: 0.3rem;
    }
    .match-card-bracket .teams { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.4rem; }
    .match-card-bracket .t { font-weight: 500; }
    .match-card-bracket .score { font-weight: 600; color: #1976d2; }
    .match-card-bracket .vs { display: flex; justify-content: center; font-size: 0.75rem; color: #888; }
    .match-card-bracket .admin { display: flex; justify-content: flex-end; }
    .match-card-bracket.can-view-bets,
    .match-card.can-view-bets {
      cursor: pointer;
    }
    .match-card-bracket.can-view-bets:hover,
    .match-card.can-view-bets:hover {
      border-color: #90caf9;
      box-shadow: 0 2px 10px rgba(25, 118, 210, 0.12);
    }

    .team-label { display: flex; justify-content: flex-start }
    .team-name-short { display: none; }

    .match-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-x: auto;
    }

    .match-card {
      display: grid;
      container: match-card / inline-size;

      grid-template-columns:
    40px
    minmax(120px, 1fr)
    minmax(44px, max-content)
    max-content
    minmax(24px, max-content);

      gap: 12px;

      align-items: center;

      padding: 12px;
      border-radius: 12px;

      border: 1px solid #e5e5e5;
      background: white;
    }

    /* TIME */

    .time {
      font-size: 12px;
      color: #666;

      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .time small {
      color: #999;
    }

    /* TEAMS */

    .teams {
      min-width: 0;
    }

    .team-row {
      display: flex;
      align-items: center;
      gap: 6px;

      min-width: 0;
    }

    //.team-name {
    //  overflow: hidden;
    //  text-overflow: ellipsis;
    //  white-space: nowrap;
    //}

    .team-name {
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
    }

    .team-name-full {
      display: none;
    }

    .team-name-short {
      display: inline;
    }

    @container match-card (min-width: 560px) {
      .team-name-full {
        display: inline;
      }

      .team-name-short {
        display: none;
      }
    }

    .description {
      display: block;

      margin-top: 4px;

      color: #777;
      font-size: 11px;
    }

    /* RESULT */

    .result {
      text-align: center;
      font-size: 13px;
    }

    .locked,
    .scheduled {
      color: #777;
      font-style: italic;
    }

    /* BET */

    .bet {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: max-content;
    }

    .bet-save-button {
      flex: 0 0 auto;
      width: 32px;
      height: 32px;
      padding: 0;
    }

    .bet-save-button mat-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
    }

    .goal {
      width: 30px;
      height: 28px;

      border: 1px solid #ccc;
      border-radius: 6px;

      text-align: center;

      padding: 0;
    }

    /* POINTS */

    .points {
      text-align: center;
      font-size: 14px;
    }

    /* CHIP */

    .chip {
      padding: 2px 6px;

      border-radius: 999px;

      background: #f2f2f2;

      font-size: 10px;
    }

    /* ACTIONS */

    .match-card .actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end; /* or flex-start / space-between */
      gap: 8px;
      margin-top: 8px;
    }

    @container (max-width: 430px) {
      .team-name-full { display: none; }
      .team-name-short { display: inline; }
      .match-card {
        grid-template-columns:
      44px
      minmax(28px, 1fr)
      minmax(36px, max-content)
      max-content
      minmax(20px, max-content);

        gap: 8px;
        padding: 10px;
      }

      .match-card .vs { font-size: 0.75rem; color: #888; margin: 0}

      .goal {
        width: 28px;
      }

      .bet-save-button {
        width: 30px;
        height: 30px;
      }

      .bet .chip {
        display: none;
      }

      .team-row {
        justify-content: center;
      }

      .description {
        display: none;
      }

      .time {
        font-size: 11px;
      }

      .result {
        font-size: 12px;
      }
    }

    /* MOBILE */

    @media (max-width: 900px) {

      .match-card {
        grid-template-columns: minmax(0, 1fr) 40px 80px;
        grid-template-areas: "teams bet result";
        gap: 10px;
      }

      .match-card.no-result {
        grid-template-columns: minmax(0,1fr) 40px 80px;
        grid-template-areas: "teams bet result";
        gap: 10px;
      }

      .time {
        display: none

      }

      .teams {
        grid-area: teams;
      }

      .result {
        grid-area: result;
      }

      .bet {
        grid-area: bet;
        justify-content: center;
      }

      .points {
        display: none;
      }

      .match-card .actions {
        grid-area: actions;

        flex-direction: row;
        justify-content: flex-end;
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

  hasResult(r:DailyMatchRow): boolean {
    return r.match.goal1 != null && r.match.goal2 != null;
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
