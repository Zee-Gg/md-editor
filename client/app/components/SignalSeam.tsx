"use client";

interface CursorMarker {
  socketId: string;
  color: string;
  relativePosition: number; // 0 to 1
}

export function SignalSeam({ cursors }: { cursors: CursorMarker[] }) {
  return (
    <div
      className="relative w-px shrink-0"
      style={{ backgroundColor: "var(--color-line)" }}
    >
      <div
        className="absolute inset-0 w-px signal-pulse"
        style={{ backgroundColor: "var(--color-signal)", opacity: 0.3 }}
      />
      {cursors.map((cursor) => (
        <div
          key={cursor.socketId}
          className="absolute h-1.5 w-1.5 -translate-x-1/2 rounded-full"
          style={{
            top: `${cursor.relativePosition * 100}%`,
            backgroundColor: cursor.color,
            left: "50%",
            boxShadow: `0 0 6px ${cursor.color}`,
          }}
        />
      ))}
    </div>
  );
}