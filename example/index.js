import mapboxgl from "mapbox-gl";
import { MapboxContextMenu, ContextMenuItem } from "../src/index";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-122.4194, 37.7749],
  zoom: 12
});

map.on("load", () => {
  const contextMenu = new MapboxContextMenu();

  const showCoordinatesItem = new ContextMenuItem({
    label: "Show coordinates"
  });
  showCoordinatesItem.addEventListener("click", (e) => {
    const lng = e.lngLat.lng.toFixed(6);
    const lat = e.lngLat.lat.toFixed(6);
    alert(`Coordinates: ${lng}, ${lat}`);
  });
  contextMenu.addItem(showCoordinatesItem);

  const centerMapItem = new ContextMenuItem({
    label: "Center map here"
  });
  centerMapItem.addEventListener("click", (e) => {
    e.map.flyTo({
      center: [e.lngLat.lng, e.lngLat.lat],
      zoom: e.map.getZoom()
    });
  });
  contextMenu.addItem(centerMapItem);

  contextMenu.addTo(map);
});
