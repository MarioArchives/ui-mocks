// A kraft tag hanging upright on twine, as in the mockup's close-up of the eyelet: the knot tied on the cord just above
// the tag with a short frayed end (1), the front strand over the top edge and down the face (2), the back strand going
// down behind (3), the tag riding the top of the hole (4), and a card washer glued round a metal grommet (5). The body
// is HTML (clipped corners and a masked hole); the rig over it is one SVG, so every tag hangs the same way at any size.
import { useId, type CSSProperties, type ReactNode, type Ref } from 'react';

export function HangTag({
  width,
  tilt = 0,
  className,
  style,
  ref,
  children,
}: {
  width: number;
  /** Degrees off straight, about the knot. */
  tilt?: number;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <div className={`tr-ht${className ? ` ${className}` : ''}`} style={{ ...style, width, ['--w' as string]: `${width}px`, ['--rot' as string]: `${tilt}deg` }} ref={ref}>
      <div className="tr-ht__shape">
        <div className="tr-ht__body">{children}</div>
      </div>
      <Rig />
    </div>
  );
}

/** The twine and the eyelet, on a grid with the tag's top centre at 0,0 and the hole at 0,32. */
function Rig() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const above = `${id}-above`;
  const face = `${id}-face`;
  const hole = `${id}-hole`;
  const blur = `${id}-blur`;
  const strand = 'M2 -20 C 0.6 -12.5, -0.5 -6, -0.4 0.5 C -0.2 9, 0 17, 0 27';
  const back = 'M2.4 -19 C 4.8 -12.5, 6.6 -6.5, 6.6 3';
  const end = 'M-1.6 -19.2 C -5 -16.4, -7.4 -13.2, -8.8 -8.6';
  return (
    <svg className="tr-ht__rig" viewBox="-30 -40 60 90" aria-hidden="true">
      <defs>
        <clipPath id={above} clipPathUnits="userSpaceOnUse">
          <rect x="-40" y="-60" width="80" height="60" />
        </clipPath>
        <clipPath id={face} clipPathUnits="userSpaceOnUse">
          <rect x="-40" y="0" width="80" height="22.5" />
        </clipPath>
        <clipPath id={hole} clipPathUnits="userSpaceOnUse">
          <circle cx="0" cy="32" r="7" />
        </clipPath>
        <filter id={blur} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>
      {/* 3: the back strand, in shade above the edge, then hidden behind the tag */}
      <g clipPath={`url(#${above})`}>
        <path d={back} className="tr-rig__shade" strokeWidth="3.4" />
        <path d={back} className="tr-rig__deep" strokeWidth="3.4" strokeDasharray="1.2 2.5" opacity="0.55" />
      </g>
      {/* 5: the card washer and the grommet */}
      <path d="M0.9 17.3 a15.5 15.5 0 1 1 0 31 a15.5 15.5 0 1 1 0 -31 Z" className="tr-rig__washer-shadow" />
      <path d="M0 16.5 a15.5 15.5 0 1 1 0 31 a15.5 15.5 0 1 1 0 -31 Z M0 25 a7 7 0 1 0 0 14 a7 7 0 1 0 0 -14 Z" fillRule="evenodd" className="tr-rig__washer" />
      <circle cx="0" cy="32" r="13.3" className="tr-rig__stitch" />
      <path d="M0 21 a11 11 0 1 1 0 22 a11 11 0 1 1 0 -22 Z M0 25 a7 7 0 1 0 0 14 a7 7 0 1 0 0 -14 Z" fillRule="evenodd" className="tr-rig__ring" />
      <path d="M-8.3 27.4 A 9.2 9.2 0 0 1 3.6 22.9" className="tr-rig__shine" />
      <path d="M8.4 36.6 A 9.2 9.2 0 0 1 -3.4 40.8" className="tr-rig__dark" />
      <path d="M0 25 a7 7 0 0 1 6.6 4.7" className="tr-rig__lip" />
      {/* 2: the front strand over the top edge and down the face, its shadow on the card */}
      <g clipPath={`url(#${face})`}>
        <path d={strand} transform="translate(1.9 2.3)" filter={`url(#${blur})`} className="tr-rig__deep" strokeWidth="3.2" opacity="0.42" />
      </g>
      <path d={strand} className="tr-rig__twine" strokeWidth="3.4" />
      <path d={strand} className="tr-rig__twist" strokeWidth="3.4" />
      <path d="M1.1 -17 C 0 -10, -0.9 -4, -1.2 1 C -1 9, -0.8 16, -0.8 23" className="tr-rig__hi" />
      {/* 4: through the eyelet, riding the top of the hole and darkening as it turns through */}
      <g clipPath={`url(#${hole})`}>
        <path d="M0 23.5 L0 30.6" className="tr-rig__shade" strokeWidth="3.8" />
        <ellipse cx="0" cy="30.4" rx="2.2" ry="1.5" className="tr-rig__knotfill-deep" />
        <path d="M-6.8 30 a7 7 0 0 1 13.6 0" className="tr-rig__deep" strokeWidth="1" opacity="0.5" />
      </g>
      {/* 1: the knot, with a short frayed end */}
      <path d={end} className="tr-rig__twine" strokeWidth="3" />
      <path d={end} className="tr-rig__twist" strokeWidth="3" strokeDasharray="1.1 2.4" />
      <path d="M-8.8 -8.6 l -.7 2.6 M-8.8 -8.6 l .9 2.4 M-8.8 -8.6 l -2 1.5" className="tr-rig__fray" />
      <ellipse cx="1.6" cy="-21.4" rx="5.1" ry="3.4" transform="rotate(-18 1.6 -21.4)" className="tr-rig__knot" />
      <path d="M-2.6 -22.4 q 4 -2.6 8.4 -.6" className="tr-rig__fray" />
      <ellipse cx="2.7" cy="-18.3" rx="4.6" ry="3" transform="rotate(14 2.7 -18.3)" className="tr-rig__knot" />
      <path d="M-1.2 -18.8 q 3.8 2 8 .2" className="tr-rig__fray" />
    </svg>
  );
}

/** A brass map tack, pinned through the twine into whatever is lit. */
export function Tack({ x, y }: { x: number; y: number }) {
  return <span className="tr-tack" style={{ left: x - 9, top: y - 9 }} aria-hidden="true" />;
}
