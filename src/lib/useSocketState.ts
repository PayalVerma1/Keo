import { useEffect, useState } from "react";
import { socket } from "./socket";

/**
 * Returns the current socket connection state.
 *
 * Initialises synchronously from socket.connected so pages that mount
 * AFTER the socket is already established immediately show "live" —
 * no waiting for the "connect" event that already fired.
 */
export function useSocketState(): "live" | "connecting" | "offline" {
  const [state, setState] = useState<"live" | "connecting" | "offline">(() =>
    socket.connected ? "live" : "connecting"
  );

  useEffect(() => {
    // Sync once on mount in case the state changed between render and effect
    setState(socket.connected ? "live" : "connecting");

    const onConnect = () => setState("live");
    const onDisconnect = () => setState("offline");
    const onError = () => setState("offline");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
    };
  }, []);

  return state;
}
