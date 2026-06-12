import {
  AfterViewInit, Component, ElementRef, Input, OnInit,
  ViewChild, computed, effect, inject, signal,
} from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatchesApi } from '../../core/api/matches.api';
import { BetsApi } from '../../core/api/bets.api';
import { CompetitionsApi } from '../../core/api/competitions.api';
import { GroupsApi } from '../../core/api/groups.api';
import { AuthService } from '../../core/auth.service';
import {
  CompetitionDto, GroupDto, GroupStandingsDto, MatchDto, MatchStage, stageLabel,
} from '../../core/models';
import { MatchFormDialog } from './match-form.dialog';
import { SetResultDialog } from './set-result.dialog';
import { ManageGroupsDialog } from './manage-groups.dialog';
import {TeamLogoComponent} from '../team-logo/team-logo';
import { MatchBetsDialog } from './match-bets.dialog';

interface MatchRow {
  match: MatchDto;
  goal1: number | null;
  goal2: number | null;
  saving: boolean;
}

interface BracketLine { x1: number; y1: number; x2: number; y2: number; }

@Component({
  selector: 'app-competition-detail',
  imports: [
    DatePipe, NgTemplateOutlet, FormsModule, RouterLink,
    MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatCardModule, MatChipsModule, MatDialogModule, MatExpansionModule,
    TeamLogoComponent
  ],
  template: `
    <div class="header-wrapper">
      <div class="header">
        <h1>{{ competition()?.name || 'Rozgrywki' }}</h1>
        <div class="actions">
          <a mat-button [routerLink]="['/competitions', id, 'standings']">Tabela wyników</a>
          @if (auth.isAdmin()) {
            <a mat-button [routerLink]="['/competitions', id, 'participants']">Gracze</a>
            <button mat-button (click)="openGroups()"><mat-icon>folder</mat-icon> Grupy</button>
            <button mat-flat-button color="primary" (click)="newMatch()"><mat-icon>add</mat-icon> Mecz</button>
          }
        </div>
      </div>
    </div>

    @if (loading()) { <p>Ładowanie…</p> }

    @if (groupRows().length > 0) {
      <h2>Faza grupowa</h2>
      <div class="groups">
        @for (g of groupRows(); track g.group.id) {
          <mat-card class="group-card">
            <mat-card-title>{{ g.group.name }}</mat-card-title>
            <mat-card-content>
              <h4>Tabela</h4>
              @if (standingsFor(g.group.id); as st) {
                @if (st.rows.length === 0) { <p class="muted">Brak wyników.</p> }
                @else {
                  <table class="standings">
                    <thead>
                      <tr><th>Drużyna</th><th>M</th><th>W</th><th>R</th><th>P</th><th>BR</th><th>PKT</th></tr>
                    </thead>
                    <tbody>
                      @for (r of st.rows; track r.team) {
                        <tr>
                          <td>{{ r.team }}</td>
                          <td>{{ r.played }}</td>
                          <td>{{ r.won }}</td>
                          <td>{{ r.drawn }}</td>
                          <td>{{ r.lost }}</td>
                          <td>{{ r.goalDifference }}</td>
                          <td><strong>{{ r.points }}</strong></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              }
              <h4>Mecze</h4>
              <ng-container *ngTemplateOutlet="matchTable; context: { $implicit: g.rows }" />
            </mat-card-content>
          </mat-card>
        }
      </div>
    }

    @if (bracketStages().length > 0) {
      <h2>Drabinka</h2>
      <mat-card class="bracket-card">
        <div class="bracket-wrap" #bracketWrap>
        <svg class="bracket-lines" [attr.width]="bracketSize().w" [attr.height]="bracketSize().h">
          @for (l of bracketLines(); track $index) {
            <path [attr.d]="lineD(l)" />
          }
        </svg>
        <div class="bracket" [style.--cols]="bracketStages().length">
          @for (col of bracketStages(); track col.stage) {
            <div class="bracket-col">
              <div class="col-title">{{ stageLabel(col.stage) }}</div>
              <div class="bracket-matches">
              @for (r of col.rows; track r.match.id) {
                <div class="match-card-bracket"
                     [class.can-view-bets]="canViewBets(r)"
                     [attr.data-id]="r.match.id"
                     [attr.data-feeder1]="r.match.feederMatch1Id"
                     [attr.data-feeder2]="r.match.feederMatch2Id"
                     [attr.role]="canViewBets(r) ? 'button' : null"
                     [attr.tabindex]="canViewBets(r) ? 0 : null"
                     (click)="openMatchBets(r)"
                     (keydown.enter)="openMatchBets(r)"
                     (keydown.space)="openMatchBets(r)">
                  <div class="meta">
                    {{ r.match.gameTime | date:'MMM d HH:mm':'Europe/Warsaw' }}
                    @if (r.match.description) { · {{ r.match.description }} }
                  </div>
                  <div class="teams">
                    <span class="t">
                      <div class="team-label">
                        <app-team-logo [teamName]="r.match.team1" [isInternational]="competition()?.isInternational ?? false"></app-team-logo>
                        {{ r.match.team1 }}
                      </div>
                    </span>

                    @if (r.match.goal1 !== null && r.match.goal2 !== null) {
                      <span class="score">{{ r.match.goal1 }} - {{ r.match.goal2 }}</span>
                    } @else {
                      <span class="vs">vs</span>
                    }
                    <span class="t">
                      <div class="team-label">
                        <app-team-logo [teamName]="r.match.team2" [isInternational]="competition()?.isInternational ?? false"></app-team-logo>
                        {{ r.match.team2 }}
                      </div>
                    </span>
                  </div>
                  <div class="bet-row">
                    <input type="number" min="0" max="99" class="goal" [(ngModel)]="r.goal1"
                           [disabled]="isBetReadOnly(r)"
                           (click)="$event.stopPropagation()" />
                    :
                    <input type="number" min="0" max="99" class="goal" [(ngModel)]="r.goal2"
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
                    @if (r.match.myBet?.points !== null && r.match.myBet?.points !== undefined) {
                      <span class="pts">{{ r.match.myBet?.points }} pt</span>
                    }
                  </div>
                  @if (auth.isAdmin()) {
                    <div class="admin" (click)="$event.stopPropagation()">
                      <button mat-button (click)="editMatch(r.match)">Edytuj</button>
                      <button mat-button color="primary" (click)="setResult(r.match)">Wynik</button>
                    </div>
                  }
                </div>
              }
              </div>
            </div>
          }
        </div>
      </div>
      </mat-card>
    }

    @if (standaloneRows().length > 0) {
      <h2>Pozostałe mecze</h2>
      <ng-container *ngTemplateOutlet="matchTable; context: { $implicit: standaloneRows() }" />
    }

    @if (!loading() && groupRows().length === 0 && bracketStages().length === 0 && standaloneRows().length === 0) {
      <p>Brak meczów.</p>
    }

    <ng-template #matchTable let-rows>
      <div class="match-list">

        @for (r of rows; track r.match.id) {
          <div
            class="match-card"
            [class.can-view-bets]="canViewBets(r)"
            [attr.role]="canViewBets(r) ? 'button' : null"
            [attr.tabindex]="canViewBets(r) ? 0 : null"
            (click)="openMatchBets(r)"
            (keydown.enter)="openMatchBets(r)"
            (keydown.space)="openMatchBets(r)">

            <!-- TIME -->
            <div class="time">
              {{ r.match.gameTime | date:'MMM d':'Europe/Warsaw' }}
              <small>{{ r.match.gameTime | date:'HH:mm':'Europe/Warsaw' }}</small>
            </div>

            <!-- TEAMS -->
            <div class="teams">

              <div class="team-row">
                <app-team-logo
                  [teamName]="r.match.team1"
                  [isInternational]="competition()?.isInternational ?? false">
                </app-team-logo>

                <span class="team-name">
              {{ r.match.team1 }}
            </span>
              </div>

              <div class="vs">vs</div>

              <div class="team-row">
                <app-team-logo
                  [teamName]="r.match.team2"
                  [isInternational]="competition()?.isInternational ?? false">
                </app-team-logo>

                <span class="team-name">
              {{ r.match.team2 }}
            </span>
              </div>

              @if (r.match.description) {
                <small class="description">
                  {{ r.match.description }}
                </small>
              }

            </div>

            <!-- RESULT -->
            <div class="result">
              @if (r.match.goal1 !== null && r.match.goal2 !== null) {
                <strong>
                  {{ r.match.goal1 }} : {{ r.match.goal2 }}
                </strong>
              }
            </div>

            <!-- BET -->
            <div class="bet">

              <input
                type="number"
                min="0"
                max="99"
                class="goal"
                [(ngModel)]="r.goal1"
                [disabled]="isBetReadOnly(r)"
                (click)="$event.stopPropagation()"
              />

              <span>:</span>

              <input
                type="number"
                min="0"
                max="99"
                class="goal"
                [(ngModel)]="r.goal2"
                [disabled]="isBetReadOnly(r)"
                (click)="$event.stopPropagation()"
              />

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

            <!-- POINTS -->
            <div class="points">
              @if (r.match.myBet?.points !== null && r.match.myBet?.points !== undefined) {
                <strong>{{ r.match.myBet?.points }}</strong>
              }
            </div>

            <!-- ADMIN -->
            @if (auth.isAdmin()) {
              <div class="actions" (click)="$event.stopPropagation()">
                <button mat-button (click)="editMatch(r.match)">
                  Edytuj
                </button>

                <button mat-button color="primary" (click)="setResult(r.match)">
                  Wynik
                </button>
              </div>
            }

          </div>
        }

      </div>
    </ng-template>
  `,
  styles: [`
    .header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
    .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .full { width: 100%; }
    .muted { color: #666; }
    h2 { color: white; margin: 1.5rem 0 0.75rem; }
    h4 { margin: 0.75rem 0 0.5rem; font-size: 0.9rem; text-transform: uppercase; opacity: 0.7; }

    .bet, .bet-row { display: flex; align-items: center; gap: 0.4rem; }
    .goal { width: 3rem; padding: 0.3rem 0.4rem; border: 1px solid #bbb; border-radius: 4px; text-align: center; }
    .goal:disabled { background: #eee; color: #888; }
    .chip { background: #1976d2; color: white; padding: 0.05rem 0.45rem; border-radius: 10px; font-size: 0.75rem; }
    .pts { color: #2e7d32; font-weight: 600; }

    .groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr)); gap: 1rem;    }
    .group-card { container-type: inline-size; padding: 0.5rem; background-color: rgba(255, 255, 255, 0.9); }
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

    .match-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .match-card {
      display: grid;

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

    .team-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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

      .team-name,
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
        grid-template-columns: 40px minmax(0, 1fr) 40px 80px 40px;
        grid-template-areas: "time teams result bet points";
        gap: 10px;
      }

      .time {
        grid-area: time;

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
        grid-area: points;
      }

      .match-card .actions {
        grid-area: actions;

        flex-direction: row;
        justify-content: flex-end;
      }
    }
  `],
})
export class CompetitionDetailPage implements OnInit, AfterViewInit {
  @Input() id!: string;
  @ViewChild('bracketWrap') bracketWrap?: ElementRef<HTMLElement>;

  private matchesApi = inject(MatchesApi);
  private betsApi = inject(BetsApi);
  private competitionsApi = inject(CompetitionsApi);
  private groupsApi = inject(GroupsApi);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  protected auth = inject(AuthService);

  competition = signal<CompetitionDto | null>(null);
  groups = signal<GroupDto[]>([]);
  groupStandings = signal<GroupStandingsDto[]>([]);
  rows = signal<MatchRow[]>([]);
  loading = signal(true);
  cols = ['time', 'teams', 'result', 'bet', 'points', 'actions'];

  groupRows = computed(() => {
    const map = new Map<number, MatchRow[]>();
    for (const r of this.rows()) {
      if (r.match.groupId !== null && r.match.groupId !== undefined) {
        const arr = map.get(r.match.groupId) ?? [];
        arr.push(r);
        map.set(r.match.groupId, arr);
      }
    }
    return this.groups()
      .filter(g => map.has(g.id) || this.standingsFor(g.id)?.rows.length === 0)
      .map(g => ({ group: g, rows: map.get(g.id) ?? [] }));
  });

  bracketStages = computed(() => {
    const bracketRows = this.rows().filter(r =>
      r.match.stage !== null && r.match.stage !== undefined && r.match.stage !== MatchStage.Group);
    const byStage = new Map<MatchStage, MatchRow[]>();
    for (const r of bracketRows) {
      const s = r.match.stage as MatchStage;
      const arr = byStage.get(s) ?? [];
      arr.push(r);
      byStage.set(s, arr);
    }
    return Array.from(byStage.entries())
      .map(([stage, rows]) => ({
        stage,
        rows: rows.slice().sort((a, b) => a.match.bracketPosition - b.match.bracketPosition),
      }))
      .sort((a, b) => a.stage - b.stage);
  });

  standaloneRows = computed(() => this.rows().filter(r =>
    (r.match.groupId === null || r.match.groupId === undefined) &&
    (r.match.stage === null || r.match.stage === undefined)));

  stageLabel = stageLabel;

  bracketLines = signal<BracketLine[]>([]);
  bracketSize = signal<{ w: number; h: number }>({ w: 0, h: 0 });

  constructor() {
    effect(() => {
      // re-read so this effect tracks row updates
      this.rows();
      this.bracketStages();
      queueMicrotask(() => this.redrawBracketLines());
    });
  }

  ngOnInit() {
    this.competitionsApi.list().subscribe(list => {
      const c = list.find(x => x.id === +this.id) ?? null;
      this.competition.set(c);
    });
    this.refresh();
  }

  ngAfterViewInit() {
    queueMicrotask(() => this.redrawBracketLines());
    window.addEventListener('resize', this.onWindowResize);
  }

  private onWindowResize = () => this.redrawBracketLines();

  private redrawBracketLines() {
    const root = this.bracketWrap?.nativeElement;
    if (!root) return;
    const bracketEl = root.querySelector<HTMLElement>('.bracket');
    if (!bracketEl) {
      this.bracketLines.set([]);
      this.bracketSize.set({ w: 0, h: 0 });
      return;
    }
    const wrapRect = root.getBoundingClientRect();
    this.bracketSize.set({ w: bracketEl.scrollWidth, h: bracketEl.scrollHeight });

    const cards = root.querySelectorAll<HTMLElement>('.match-card-bracket');
    const byId = new Map<number, DOMRect>();
    cards.forEach(c => {
      const id = c.dataset['id'];
      if (id) byId.set(+id, c.getBoundingClientRect());
    });

    const lines: BracketLine[] = [];
    cards.forEach(c => {
      const cr = c.getBoundingClientRect();
      const consumerX = cr.left - wrapRect.left + root.scrollLeft;
      const consumerY = cr.top + cr.height / 2 - wrapRect.top + root.scrollTop;
      for (const key of ['feeder1', 'feeder2']) {
        const raw = c.dataset[key];
        if (!raw || raw === 'null') continue;
        const fr = byId.get(+raw);
        if (!fr) continue;
        const feederX = fr.right - wrapRect.left + root.scrollLeft;
        const feederY = fr.top + fr.height / 2 - wrapRect.top + root.scrollTop;
        lines.push({ x1: feederX, y1: feederY, x2: consumerX, y2: consumerY });
      }
    });
    this.bracketLines.set(lines);
  }

  lineD(l: BracketLine): string {
    const midX = (l.x1 + l.x2) / 2;
    return `M ${l.x1} ${l.y1} L ${midX} ${l.y1} L ${midX} ${l.y2} L ${l.x2} ${l.y2}`;
  }

  refresh() {
    this.loading.set(true);
    this.groupsApi.list(+this.id).subscribe(g => this.groups.set(g));
    this.groupsApi.standings(+this.id).subscribe(s => this.groupStandings.set(s));
    this.matchesApi.listForCompetition(+this.id).subscribe({
      next: matches => {
        this.rows.set(matches.map(m => this.toRow(m)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  standingsFor(groupId: number): GroupStandingsDto | undefined {
    return undefined;
    //return this.groupStandings().find(s => s.groupId === groupId);
  }

  private toRow(m: MatchDto): MatchRow {
    const goal1 = m.myBet?.betGoal1 ?? null;
    const goal2 = m.myBet?.betGoal2 ?? null;
    return { match: m, goal1, goal2, saving: false };
  }

  save(r: MatchRow) {
    if (r.match.isLocked) return;
    if (r.goal1 === null || r.goal2 === null) return;
    if (r.goal1 < 0 || r.goal2 < 0) return;
    if (r.match.myBet
        && r.match.myBet.betGoal1 === r.goal1
        && r.match.myBet.betGoal2 === r.goal2) {
      return;
    }
    r.saving = true;
    this.betsApi.upsert(r.match.id, r.goal1, r.goal2).subscribe({
      next: bet => {
        r.match.myBet = bet;
        r.saving = false;
        this.rows.set([...this.rows()]);
        this.snack.open('Typ zapisany', undefined, { duration: 1500 });
      },
      error: err => {
        r.saving = false;
        this.snack.open(err?.error?.error ?? 'Nie udało się zapisać typu', 'Zamknij', { duration: 4000 });
      },
    });
  }

  canViewBets(r: MatchRow): boolean {
    return r.match.myBet !== null || this.toLocalInput(new Date(Date.now())) > this.toLocalInput(new Date(r.match.gameTime)) ;
  }

  isBetReadOnly(r: MatchRow): boolean {
    return r.match.isLocked || r.saving || r.match.myBet !== null;
  }

  openMatchBets(r: MatchRow) {
    if (!this.canViewBets(r)) return;
    this.dialog.open(MatchBetsDialog, {
      data: {
        match: r.match,
        isInternational: this.competition()?.isInternational ?? false,
      },
      width: '520px',
    });
  }

  openGroups() {
    const ref = this.dialog.open(ManageGroupsDialog, {
      data: { competitionId: +this.id },
      width: '520px',
    });
    ref.afterClosed().subscribe(() => this.refresh());
  }

  newMatch() {
    const eliminationMatches = this.rows()
      .map(r => r.match)
      .filter(m => m.stage !== null && m.stage !== undefined && m.stage !== MatchStage.Group);
    const ref = this.dialog.open(MatchFormDialog, {
      data: {
        title: 'Nowy mecz',
        gameTime: this.toLocalInput(new Date(Date.now() + 60 * 60 * 1000)),
        team1: '', team2: '', description: null,
        groupId: null, stage: null, bracketPosition: 0,
        feederMatch1Id: null, feederMatch2Id: null,
        groups: this.groups(),
        eliminationMatches,
      },
      width: '500px',
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.matchesApi.create({ competitionId: +this.id, ...result }).subscribe(() => this.refresh());
    });
  }

  editMatch(m: MatchDto) {
    const eliminationMatches = this.rows()
      .map(r => r.match)
      .filter(x => x.id !== m.id && x.stage !== null && x.stage !== undefined && x.stage !== MatchStage.Group);
    const ref = this.dialog.open(MatchFormDialog, {
      data: {
        title: 'Edytuj mecz',
        gameTime: this.toLocalInput(new Date(m.gameTime)),
        team1: m.team1, team2: m.team2, description: m.description,
        groupId: m.groupId,
        stage: m.stage,
        bracketPosition: m.bracketPosition,
        feederMatch1Id: m.feederMatch1Id,
        feederMatch2Id: m.feederMatch2Id,
        groups: this.groups(),
        eliminationMatches,
      },
      width: '500px',
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.matchesApi.update(m.id, result).subscribe(() => this.refresh());
    });
  }

  setResult(m: MatchDto) {
    const ref = this.dialog.open(SetResultDialog, {
      data: {
        team1: m.team1, team2: m.team2,
        goal1: m.goal1, goal2: m.goal2,
        resultDescription: m.resultDescription,
      },
      width: '420px',
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      if (result.clear) this.matchesApi.clearResult(m.id).subscribe(() => this.refresh());
      else this.matchesApi.setResult(m.id, result).subscribe(() => this.refresh());
    });
  }

  private toLocalInput(d: Date): string {
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
