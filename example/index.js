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

  showCoordinatesItem.addEventListener("click", ({ lngLat }) => {
    const lng = lngLat.lng.toFixed(6);
    const lat = lngLat.lat.toFixed(6);
    alert(`Coordinates: ${lng}, ${lat}`);
  });

  contextMenu.addItem(showCoordinatesItem);

  const centerMapItem = new ContextMenuItem({
    label: "Center map here"
  });

  centerMapItem.addEventListener("click", ({ map, lngLat }) => {
    map.flyTo({
      center: [lngLat.lng, lngLat.lat],
      zoom: map.getZoom()
    });
  });

  contextMenu.addItem(centerMapItem);

  contextMenu.addTo(map);
});
