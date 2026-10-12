import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Popup, Rectangle, Tooltip, useMap } from 'react-leaflet';
import es from '../i18n/es.js';
import { SPACE_COLORS } from '../utils/constants.js';

const CELL_SIZE = 0.9;

function FitToBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 6 });
  }, [map, bounds]);
  return null;
}

export default function ParkingMap({ spaces, onSelectFreeSpace }) {
  const maxRow = useMemo(() => spaces.reduce((max, space) => Math.max(max, space.rowIndex), 0), [spaces]);
  const maxCol = useMemo(() => spaces.reduce((max, space) => Math.max(max, space.colIndex), 0), [spaces]);
  const bounds = useMemo(() => [[0, 0], [maxRow + CELL_SIZE, maxCol + CELL_SIZE]], [maxRow, maxCol]);

  return (
    <MapContainer
      crs={L.CRS.Simple}
      center={[maxRow / 2, maxCol / 2]}
      zoom={4}
      minZoom={2}
      maxZoom={7}
      zoomSnap={0.25}
      attributionControl={false}
      className="h-[420px] w-full rounded-lg"
    >
      <FitToBounds bounds={bounds} />
      {spaces.map((space) => {
        const y = maxRow - space.rowIndex;
        const rectangleBounds = [
          [y, space.colIndex],
          [y + CELL_SIZE, space.colIndex + CELL_SIZE],
        ];
        const color = SPACE_COLORS[space.status];
        const isFree = space.status === 'FREE';
        return (
          <Rectangle
            key={space.id}
            bounds={rectangleBounds}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 1 }}
            eventHandlers={isFree && onSelectFreeSpace ? { click: () => onSelectFreeSpace(space) } : {}}
          >
            <Tooltip permanent direction="center" className="space-label">
              {space.code}
            </Tooltip>
            {!isFree && (
              <Popup>
                <div className="space-y-0.5 text-xs">
                  <p className="font-semibold">{space.code}</p>
                  <p>{es.vehicleTypes[space.vehicleType]}</p>
                  <p>{es.status[space.status]}</p>
                  {space.plate && <p>{`${es.dashboard.plate}: ${space.plate}`}</p>}
                </div>
              </Popup>
            )}
          </Rectangle>
        );
      })}
    </MapContainer>
  );
}
