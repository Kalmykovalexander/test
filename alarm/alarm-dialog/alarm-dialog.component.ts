import {Component, OnInit, TemplateRef, ViewChild, EventEmitter} from '@angular/core';
import {IAlarmType} from "../../../../../../models/alarm/i-alarm-type";
import {AlarmService} from "../../../../../../services/alarm/alarm.service";
import {MatDialogRef} from "@angular/material/dialog";
import {FormBuilder, Validators} from "@angular/forms";
import {ValidateInput} from "../../../../../../core/classes/validators/validate-input";
import {IPOI} from "../../../../../../models/poi/i-poi";
import {IVehicle} from "../../../../../../models/vehicle/i-vehicle";
import {VehicleService} from "../../../../../../services/vehicle/vehicle.service";
import {PoiMapService} from "../../../../../../services/poi/poi-map-service/poi-map.service";
import {AlarmMapService} from "../../../../../../services/alarm/alarm-map-service/alarm-map.service";

export enum AlarmTypeEnum {
  MOVING_TO_POI,
  GEO_AREA,
  MAX_SPEED,
  MOVING_STATUS,
}

@Component({
  selector: 'app-alarm-dialog',
  templateUrl: './alarm-dialog.component.html',
  styleUrls: ['./alarm-dialog.component.scss']
})
export class AlarmDialogComponent implements OnInit {
  @ViewChild('choiceAlarmType', {static: true}) choiceAlarmType: TemplateRef<any>;
  @ViewChild('createAlarmTemplate', {static: true}) createAlarmTemplate: TemplateRef<any>;

  geoAreaCreated = new EventEmitter<google.maps.Polygon>();
  createdPolygon: any = null;
  hideAlarmModal = new EventEmitter<any>();

  selectedTemplate: TemplateRef<any>;
  selectedAlarmType: AlarmTypeEnum;
  selectedSendType: string;

  poiList: Array<IPOI> = [];
  vehicleList: Array<IVehicle> = [];
  alarmTypes: Array<IAlarmType> = [];
  alarmTypesMap = new Map([
    [AlarmTypeEnum.MOVING_TO_POI, 'Punto di interesse'],
    [AlarmTypeEnum.GEO_AREA, 'Area geografica' ],
    [AlarmTypeEnum.MAX_SPEED, 'Velocità massima' ],
    [AlarmTypeEnum.MOVING_STATUS, 'Stato movimento']
  ]);

  form = this._formBuilder.group({
    name: ['', [Validators.required, ValidateInput.notEmpty, Validators.maxLength(100)]],
    distance: ['', [Validators.required]],
    distanceUnit: ['m'],
    poi: ['', [Validators.required]],
    polygon: ['', [Validators.required]],
    vehicle: ['', [Validators.required]],
    maxSpeed: ['', [Validators.required, Validators.max(500)]],
    sendType: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['+39', [Validators.required, Validators.pattern(/^(\+39|0)\d{8,10}$/)]],
  });

  // error messages
  requiredFieldMessage: string = 'Campo obbligatorio';
  incorrectNameMessage: string = 'Nome puo contenere al massimo 100 caratteri';
  incorrectEmailMessage: string = 'Email inserito non è corretto';
  incorrectPhoneMessage: string = 'Numero inserito non è corretto';
  incorrectSpeedMessage: string = 'Velocità massima é 500 km/h';
  notFoundVehiclesMessage: string = 'Nessun veicolo trovato';
  notFoundPoisMessage: string = 'Nessun P.O.I. trovato';

  constructor(private _alarmMapService: AlarmMapService, private _alarmService: AlarmService, private vehicleService: VehicleService, private _poiMapService: PoiMapService, private _formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.selectedTemplate = this.choiceAlarmType;
    this.findAllAlarmTypes();
    this.findAllPois();
    this.findVehicleList();
  }

  findAllAlarmTypes() {
    const promise = this._alarmService.getAllAlarmTypes();
    promise
      .then((alarmTypes: Array<IAlarmType>) => {
        if (alarmTypes) {
          alarmTypes.forEach((alarmType: IAlarmType) => {
            alarmType.name = AlarmTypeEnum[alarmType.name] as unknown as AlarmTypeEnum;
          });
          this.alarmTypes = alarmTypes;
        }
      })
      .catch(e => {
        console.error(e)
      })
      .finally();
  }

  findAllPois() {
    const promise = this._poiMapService.findAll();
    promise
      .then(pois => {
        if (pois) {
          this.poiList = pois;
        }
      })
      .catch(e => {
        console.error(e)
      })
      .finally();
  }

  findVehicleList(): void {
    const promise = this.vehicleService.getUserVehiclesPromise();
    promise
      .then((list: Array<IVehicle>) => {
        this.vehicleList = list;
      })
      .catch((e: any) => {
        console.error(e);
      })
      .finally();
  }

  openModalBySelectedType(type:any) {
    this.selectedAlarmType = type;
    this.selectedTemplate = this.createAlarmTemplate;
  }

  onBack() {
    this.form.reset();
    this.selectedTemplate = this.choiceAlarmType;
  }

  onSubmit(){
    console.log("onSubmit in work")
  }

  onSelectionChange(event: any) {
    this.selectedSendType = event.value;
    this.form.get('email')?.reset('');
    this.form.get('phone')?.reset('+39');
  }

  createPolygon() {
    this.hideAlarmModal.emit();
    this._alarmMapService.polygonCreated.subscribe((polygon: any) => {
      this.geoAreaCreated.emit(polygon);
    });
    this._alarmMapService.create();
  }
}

