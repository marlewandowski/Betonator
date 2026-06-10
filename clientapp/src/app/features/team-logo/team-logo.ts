import {Component, inject, Input, OnInit} from '@angular/core';
import {TeamAssetService} from '../../common/team-asset-service';

@Component({
  selector: 'app-team-logo',
  imports: [],
  templateUrl: './team-logo.html',
  styleUrl: './team-logo.scss',
  standalone: true,
})
export class TeamLogoComponent implements OnInit {

  @Input() teamName: string = '';
  @Input() isInternational: boolean = false;
  TeamAssetService:TeamAssetService = inject(TeamAssetService);
  teamLogo: string | undefined;
  ngOnInit(): void {
    this.teamLogo = this.TeamAssetService.imageFor(this.teamName, this.isInternational);
  }
}
