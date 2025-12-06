import mapboxgl from "mapbox-gl";
import {
  MapboxContextMenu,
  ContextMenuItem,
  ContextMenuSeparator
} from "../src/index";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-122.4194, 37.7749],
  zoom: 12
});

map.on("load", () => {
  const contextMenu = new MapboxContextMenu({ width: 180 });

  const showCoordinatesItem = new ContextMenuItem({
    label: "Copy coordinates",
    icon: "fa-solid fa-location-dot"
  });

  showCoordinatesItem.on("click", async ({ lngLat }) => {
    const lng = lngLat.lng.toFixed(6);
    const lat = lngLat.lat.toFixed(6);
    const coordinates = `${lng}, ${lat}`;
    await navigator.clipboard.writeText(coordinates);
  });

  contextMenu.addItem(showCoordinatesItem);

  const centerMapItem = new ContextMenuItem({
    label: "Center map here",
    icon: "fa-solid fa-crosshairs"
  });

  centerMapItem.on("click", ({ map, lngLat }) => {
    map.easeTo({
      center: [lngLat.lng, lngLat.lat]
    });
  });

  contextMenu.addItem(centerMapItem);

  const separator = new ContextMenuSeparator();
  contextMenu.addItem(separator);

  const directionsItem = new ContextMenuItem({
    label: "Get directions",
    icon: "fa-solid fa-route"
  });

  contextMenu.addItem(directionsItem);

  contextMenu.addTo(map);
});
