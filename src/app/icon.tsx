import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** Favicon gerado: monograma em petrol, sem dependência de asset externo. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1E433B',
          color: '#FBF8F3',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.04em',
          borderRadius: 8,
        }}
      >
        K
      </div>
    ),
    { ...size },
  );
}
