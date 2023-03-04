import {Component, OnDestroy, OnInit} from '@angular/core';
import {IAlarm} from "../../../../../models/alarm/i-alarm";
import {NavService} from "../../../../services/nav/nav.service";
import {AlarmDialogComponent} from "./alarm-dialog/alarm-dialog.component";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {finalize} from "rxjs/operators";

@Component({
  selector: 'app-alarm',
  templateUrl: './alarm.component.html',
  styleUrls: ['./alarm.component.scss']
})
export class AlarmComponent implements OnInit, OnDestroy  {
  createBtnLabel: string = 'Crea';
  modifyBtnLabel: string = 'Modifica';
  noTriggeredAlarmsMessage: string = 'Nessun allarme scattato';
  triggeredAlarms: Array<IAlarm> = [];
  alarms: Array<IAlarm> = [];
  searchTerm: string = '';

  dialogRef: MatDialogRef<AlarmDialogComponent>;
  currentDialogRef: MatDialogRef<AlarmDialogComponent>;

  constructor(private _navService: NavService, public dialog: MatDialog) { }

  ngOnInit(): void {
    this._navService.setItemEvents(1, 0);
    this.findAllTriggeredAlarms();
  }

  ngOnDestroy(): void {
  }

  create(): void {
    this.dialogRef = this.dialog.open(AlarmDialogComponent);
    this.dialogRef.componentInstance.hideAlarmModal.subscribe( () => {
      this.dialogRef.close();
      console.log('dialogRef ', this.dialogRef);
    });

    this.dialogRef.componentInstance.geoAreaCreated.subscribe((polygon: any) => {
      this.currentDialogRef = this.dialog.open(AlarmDialogComponent);
      console.log('currentDialogRef ', this.currentDialogRef);
      const path = polygon.getPath();
      const latLngArray = path.getArray();
      const latLngList = latLngArray.map((latLng: { lat: () => any; lng: () => any; }) => [latLng.lat(), latLng.lng()]);
      // this.currentDialogRef.componentInstance.createdPolygon = latLngList;
    });
  }

  modify(): IAlarm|null {
    // this._alarmService.modify();
    return null;
  }

  findAllTriggeredAlarms() {
  }

  onChangeSearchTerm(searchTerm: string): void {
    console.log(searchTerm)
    if (searchTerm === null || searchTerm === undefined || searchTerm === '') {
      this._navService.setItemEvents(1, 0);
      return;
    }

    // this._navService.setItemEvents(1, 1);
  }

  clearSearchTerm() {
    this.searchTerm = '';
    this._navService.setItemEvents(1, 0);
  }
}
