"use client";

import { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";

type Incident = {
  busId: number;
  busName?: string;
  status: "Breakdown" | "Delayed";
  message: string;
};

type Contact = {
  driverName: string | null;
  driverPhone: string | null;
};

// Mounted only in the authenticated admin dashboard. Public events contain no contact data.
export default function AdminIncidentDialog() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const incident = incidents[0];

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const pusher = new Pusher(key, { cluster });
    const channel = pusher.subscribe("fleet-alerts");
    channel.bind("bus-status-change", (data: Incident | { busId: number; status: "Active" }) => {
      if (!Number.isInteger(data.busId) || data.busId <= 0) return;
      if (data.status === "Active") {
        setIncidents((current) => current.filter((item) => item.busId !== data.busId));
      } else if (data.status === "Breakdown" || data.status === "Delayed") {
        setIncidents((current) => {
          const existing = current.findIndex((item) => item.busId === data.busId);
          return existing < 0
            ? [...current, data]
            : current.map((item, index) => index === existing ? data : item);
        });
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("fleet-alerts");
      pusher.disconnect();
    };
  }, []);

  useEffect(() => {
    if (incident && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!incident) dialogRef.current?.close();
  }, [incident]);

  const dismiss = () => setIncidents((current) => current.slice(1));

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="admin-incident-title"
      aria-describedby="admin-incident-message"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[#2C2D33] bg-[#21222D] p-6 text-white shadow-2xl backdrop:bg-black/60"
    >
      {incident && (
        <>
          <h2 id="admin-incident-title" className={`text-xl font-semibold ${incident.status === "Breakdown" ? "text-red-400" : "text-amber-400"}`}>
            {incident.status === "Breakdown" ? "Bus breakdown" : "Bus delay"}
          </h2>
          <p className="mt-2 font-semibold">{incident.busName || `Bus ${incident.busId}`}</p>
          <p id="admin-incident-message" className="mt-1 text-sm text-gray-300">{incident.message}</p>
          <DriverContact key={`${incident.busId}-${incident.status}`} busId={incident.busId} />
          {incidents.length > 1 && <p className="mt-3 text-sm text-gray-300">{incidents.length - 1} more incident(s) waiting</p>}
          <button type="button" onClick={dismiss} className="mt-5 w-full rounded-lg border border-gray-500 px-4 py-2 hover:bg-white/10">
            {incidents.length > 1 ? "Dismiss and view next" : "Dismiss"}
          </button>
        </>
      )}
    </dialog>
  );
}

function DriverContact({ busId }: { busId: number }) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/buses/${busId}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Contact request failed");
        const data = await response.json();
        if (!data.success || !data.bus) throw new Error("Bus unavailable");
        if (!controller.signal.aborted) setContact(data.bus);
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [busId, attempt]);

  return (
    <div className="mt-4 rounded-xl bg-[#171821] p-4" aria-live="polite">
      <h3 className="text-sm text-gray-300">Driver contact</h3>
      {error ? (
        <>
          <p className="mt-2 text-sm">Unable to load contact details.</p>
          <button type="button" className="mt-2 text-[#96DDFF] underline" onClick={() => { setError(false); setAttempt((value) => value + 1); }}>Retry</button>
        </>
      ) : contact ? (
        <>
          <p className="mt-2 font-semibold">{contact.driverName || "Assigned driver"}</p>
          {contact.driverPhone ? (
            <>
              <p className="mt-1 font-mono">{contact.driverPhone}</p>
              <a href={`tel:${contact.driverPhone.replace(/[^\d+]/g, "")}`} className="mt-3 block rounded-lg bg-[#96DDFF] px-4 py-2 text-center font-semibold text-[#171821]">Call driver</a>
            </>
          ) : <p className="mt-1 text-sm text-gray-300">No phone number on file.</p>}
        </>
      ) : <p className="mt-2 text-sm">Loading contact details...</p>}
    </div>
  );
}
