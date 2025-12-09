import {
  MapboxContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSubmenu
} from "../../src";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  center: [-122.4194, 37.7749],
  zoom: 12
});

map.on("load", () => {
  const contextMenu = new MapboxContextMenu({ width: 220 });

  const showCoordinatesItem = new ContextMenuItem({
    label: "Copy coordinates",
    start: { className: "fa-solid fa-location-dot" }
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
    start: { className: "fa-solid fa-crosshairs" }
  });

  centerMapItem.on("click", ({ map, lngLat }) => {
    map.easeTo({
      center: [lngLat.lng, lngLat.lat]
    });
  });

  contextMenu.addItem(centerMapItem);

  const separator = new ContextMenuSeparator();
  contextMenu.addItem(separator);

  const directionsSubmenu = new ContextMenuSubmenu({
    label: "Get directions",
    start: { className: "fa-solid fa-route" }
  });

  const directionsToHere = new ContextMenuItem({
    label: "Directions to here"
  });

  const directionsFromHere = new ContextMenuItem({
    label: "Directions from here"
  });

  directionsSubmenu.addItem(directionsToHere);
  directionsSubmenu.addItem(directionsFromHere);
  contextMenu.addItem(directionsSubmenu);

  contextMenu.addTo(map);
});
