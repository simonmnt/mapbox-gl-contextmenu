import {
  MapboxContextMenu,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSubmenu
} from "../../src";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  center: [-122.4194, 37.7749],
  zoom: 16
});

// Factory function to create common menu items
// (each menu needs its own instances)
function createCommonItems() {
  const copyCoordinatesItem = new ContextMenuItem({
    label: "Copy coordinates",
    start: { className: "fa-solid fa-location-dot" }
  });

  copyCoordinatesItem.on("click", async ({ lngLat }) => {
    const lng = lngLat.lng.toFixed(6);
    const lat = lngLat.lat.toFixed(6);
    await navigator.clipboard.writeText(`${lng}, ${lat}`);
  });

  const centerMapItem = new ContextMenuItem({
    label: "Center map here",
    start: { className: "fa-solid fa-crosshairs" }
  });

  centerMapItem.on("click", ({ map, lngLat }) => {
    map.easeTo({ center: [lngLat.lng, lngLat.lat] });
  });

  const directionsSubmenu = new ContextMenuSubmenu({
    label: "Get directions",
    start: { className: "fa-solid fa-route" }
  });

  directionsSubmenu.addItem(
    new ContextMenuItem({ label: "Directions to here" })
  );
  directionsSubmenu.addItem(
    new ContextMenuItem({ label: "Directions from here" })
  );

  return [
    copyCoordinatesItem,
    centerMapItem,
    new ContextMenuSeparator(),
    directionsSubmenu
  ];
}

map.on("load", () => {
  // General context menu (anywhere on the map)
  const contextMenu = new MapboxContextMenu({ width: 200 });

  for (const item of createCommonItems()) {
    contextMenu.addItem(item);
  }

  contextMenu.addTo(map);

  // Building-specific context menu
  const buildingMenu = new MapboxContextMenu({ width: 200 });
  buildingMenu.addItem(new ContextMenuLabel({ text: "Building" }));

  const buildingInfoItem = new ContextMenuItem({
    label: "View building info",
    start: { className: "fa-solid fa-building" }
  });
  buildingInfoItem.on("click", ({ features }) => {
    if (features && features.length > 0) {
      console.log("feature: ", features[0].properties);
    }
  });

  buildingMenu.addItem(buildingInfoItem);
  buildingMenu.addItem(new ContextMenuSeparator());

  for (const item of createCommonItems()) {
    buildingMenu.addItem(item);
  }

  buildingMenu.addTo(map, { featuresetId: "buildings", importId: "basemap" });
});
