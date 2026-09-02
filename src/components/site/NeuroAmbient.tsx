'use client';

/** Decoração ambiente sutil para a seção de neuropsicologia. */
export function NeuroAmbient() {
  return (
    <div aria-hidden="true" className="motion-neuro-ambient">
      <span className="motion-neuro-ambient__node" />
      <span className="motion-neuro-ambient__node" />
      <span className="motion-neuro-ambient__node" />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M80 200 Q200 120 320 200 T560 200 T720 180"
          fill="none"
          stroke="white"
          strokeWidth="1"
        />
        <path
          d="M120 260 Q240 320 400 240 T680 260"
          fill="none"
          stroke="white"
          strokeWidth="0.75"
        />
      </svg>
    </div>
  );
}
