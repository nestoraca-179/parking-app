import { useEffect, useState } from 'react';

const MAX_DELAY_MS = 15000;
const UNAUTHORIZED_CLOSE_CODE = 4401;

export default function useSpacesSocket(token) {
  const [spaces, setSpaces] = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    if (!token) {
      return undefined;
    }
    let socket = null;
    let timer = null;
    let attempt = 0;
    let disposed = false;

    const handleMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'snapshot') {
        setSpaces(message.data);
        setConnectionStatus('connected');
        attempt = 0;
      } else if (message.type === 'space_update') {
        const update = message.data;
        setSpaces((previous) =>
          previous.map((space) =>
            space.id === update.spaceId
              ? {
                  ...space,
                  code: update.spaceCode,
                  status: update.status,
                  plate: update.plate,
                  vehicleType: update.vehicleType,
                  statusSince: update.statusSince,
                }
              : space
          )
        );
        setUpdateCount((count) => count + 1);
      } else if (message.type === 'occupancy') {
        setOccupancy(message.data);
      }
    };

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      socket = new WebSocket(`${protocol}://${window.location.host}/ws/spaces`);
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'auth', token }));
      };
      socket.onmessage = handleMessage;
      socket.onclose = (event) => {
        if (disposed) {
          return;
        }
        if (event.code === UNAUTHORIZED_CLOSE_CODE) {
          setConnectionStatus('disconnected');
          return;
        }
        setConnectionStatus('reconnecting');
        const delay = Math.min(1000 * 2 ** attempt, MAX_DELAY_MS);
        attempt += 1;
        timer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      clearTimeout(timer);
      if (socket) {
        socket.close();
      }
    };
  }, [token]);

  return { spaces, occupancy, connectionStatus, updateCount };
}
