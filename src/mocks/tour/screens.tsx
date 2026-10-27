// The tour's own pieces that sit on the game's screens: the offer tied to the sealed case file's twine, "How tonight
// works" strung in My file with the game's own kit (its cf-… classes), the tag's handwriting with the log book's eye
// and heart drawn in, and a few icons. The screens themselves are the game's, from snap/scenes.json.
import { HangTag } from './HangTag';
import { PARTS, STOPS } from './stops';

function Ic({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={`tr-ic${className ? ` ${className}` : ''}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export const ArrowIcon = () => <Ic d="M5 12h14M13 6l6 6-6 6" />;
export const CheckIcon = () => <Ic d="M5 12l5 5L19 7" />;
const PlayIcon = () => <Ic d="M8 5l11 7-11 7z" />;

/** The eye and the heart as the game's log book draws them (VoteMarks.tsx there). */
const MARKS = {
  eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zM9.5 12a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
};

/** A stop's words, with {heart} and {eye} drawn as the marks (and read out as their names). */
export function TagText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\{heart\}|\{eye\})/).map((part, i) => {
        const kind = part === '{heart}' ? 'heart' : part === '{eye}' ? 'eye' : null;
        if (!kind) return part;
        return (
          <svg key={i} className={`tr-mk tr-mk--${kind}`} viewBox="0 0 24 24" role="img" aria-label={kind}>
            <path d={MARKS[kind]} />
          </svg>
        );
      })}
    </>
  );
}

/** Where the offer hangs: the tag's top left, just under the sealed file's wax seal (its knot is under the wax). */
export interface OfferAt {
  x: number;
  y: number;
}

export const OFFER_WIDTH = 150;

/** The offer: a tag tied on under the wax seal, hanging from it down the file. */
export function OfferTag({ at, onTake, onLater, gone }: { at: OfferAt; onTake: () => void; onLater: () => void; gone: boolean }) {
  return (
    <HangTag width={OFFER_WIDTH} tilt={2} className={`tr-offer${gone ? ' is-gone' : ''}`} style={{ left: at.x, top: at.y }}>
      <p className="tr-ht__no">
        <span>Tour</span>
        <span>3 min</span>
      </p>
      <p className="tr-ht__t">Time to kill? See tonight in {STOPS.length} stops.</p>
      <div className="tr-ht__stack">
        <button type="button" className="tr-ht__go" onClick={onTake}>
          Take the tour <ArrowIcon />
        </button>
        <button type="button" className="tr-ht__later" onClick={onLater}>
          Not now
        </button>
      </div>
    </HangTag>
  );
}

/** The tour, kept in My file under the suspect file, strung like the game's own tags: all of it again, or one part. */
export function TourCard({ taken, onTour }: { taken: string | null; onTour: (part: number | null) => void }) {
  return (
    <>
      <div className="ml-head">
        <h2 className="ml-head__title">How tonight works</h2>
        <span className="ml-head__rerolls">{taken ? `toured ${taken}` : 'yours to keep'}</span>
      </div>
      <ul className="cf-strung tr-tourcard" aria-label="How tonight works">
        <li className="cf-row">
          <svg className="cf-knot" width="52" height="24" viewBox="0 0 52 24" aria-hidden="true">
            <path d="M7.5 3 C 18 3, 28 8, 46 12" fill="none" stroke="var(--twine)" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
          <div className="cf-tagwrap">
            <article className="cf-tag">
              <span className="cf-eye" aria-hidden="true" />
              <div className="cf-top">
                <span>Torch tour · {STOPS.length} stops</span>
                <span>3 min</span>
              </div>
              <h3 className="tr-tourcard__t">The tour, any time</h3>
              <p className="cs-fine">Start at one part:</p>
              <div className="tr-parts">
                {PARTS.map((part, i) => (
                  <button key={part.label} type="button" className="tr-part" onClick={() => onTour(i)}>
                    {part.label}
                  </button>
                ))}
              </div>
              <button type="button" className="cf-btn cf-btn--dark" onClick={() => onTour(null)}>
                <PlayIcon /> {taken ? 'Take the tour again' : 'Take the tour'}
              </button>
            </article>
          </div>
        </li>
      </ul>
    </>
  );
}
