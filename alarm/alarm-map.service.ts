import {EventEmitter, Injectable} from "@angular/core";
import {MapService} from "../../map/map.service";
import {document} from "ngx-bootstrap/utils";

@Injectable({
  providedIn: 'root'
})
export class AlarmMapService {
  private map: google.maps.Map;
  private createPolygonAction: boolean = false;
  polygonCreated = new EventEmitter<google.maps.Polygon>();

  constructor(private _mapService: MapService) {
  }

  create() {
    this.createPolygonAction = true;
    this.initMap();
  }

  initMap() {
    this.map = this._mapService.getMap();
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      markerOptions: {
        icon: "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
      },
      polygonOptions: {
        editable: true,
      }
    });
    drawingManager.setMap(this.map);

    // Check if the click was outside of the map container
    document.addEventListener('mousedown', onMouseDown);
    function onMouseDown(event:any) {
      console.log('mousedown on work')
      // Check if the click was outside of the map container
      if (!event.composedPath().some((el:any) => el.classList?.contains('gm-style'))) {
        google.maps.event.removeListener(overlayCompleteListener);
        // Remove any existing overlays on the map
        // Disable drawing mode and hide the drawing tools
        drawingManager.setDrawingMode(null);
        drawingManager.setMap(null);
        document.removeEventListener('mousedown', onMouseDown);
      }
    }

    // listen polygon event
    const overlayCompleteListener = google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      this.polygonCreated.emit(polygon);
      // Disable creation
      drawingManager.setDrawingMode(null);
      drawingManager.setMap(null);
      polygon.setMap(null);
    });

  }
}
