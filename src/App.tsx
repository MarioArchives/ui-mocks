// The list of mocks at #/, and each mock full screen at #/<id>. A small pill in the corner leads back to the list.
import { lazy, Suspense, useEffect, useMemo, useState, type ComponentType, type LazyExoticComponent } from 'react';
import { MOCKS, type Mock } from './mocks';
import './app.css';

const readRoute = () => decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));

function useRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

// One lazy component per mock, made once.
const screens = new Map<string, LazyExoticComponent<ComponentType>>(MOCKS.map((m) => [m.id, lazy(m.load)]));

export function App() {
  const route = useRoute();
  const mock = useMemo(() => MOCKS.find((m) => m.id === route), [route]);
  useEffect(() => {
    document.title = mock ? `${mock.title} · Quest Mocks` : 'Quest Mocks';
    document.body.style.background = mock?.backdrop ?? '';
    window.scrollTo(0, 0);
  }, [mock]);

  if (!mock) return <List />;
  const Screen = screens.get(mock.id)!;
  return (
    <>
      <Suspense fallback={<div className="mk-loading" style={{ background: mock.backdrop }} />}>
        <Screen />
      </Suspense>
      <a className="mk-back" href="#/" aria-label="Back to the mocks">
        ‹ Mocks
      </a>
    </>
  );
}

function List() {
  return (
    <main className="mk-list">
      <header className="mk-list__head">
        <p className="mk-list__kicker">Quest-Game</p>
        <h1 className="mk-list__title">UI mocks</h1>
        <p className="mk-list__lead">Screens to try in your hand before they are built. Tap one; the pill in the corner brings you back.</p>
      </header>
      <ol className="mk-list__items">
        {MOCKS.map((m) => (
          <li key={m.id}>
            <Row mock={m} />
          </li>
        ))}
      </ol>
    </main>
  );
}

function Row({ mock }: { mock: Mock }) {
  return (
    <a className="mk-row" href={`#/${mock.id}`}>
      <span className="mk-row__game">{mock.game}</span>
      <span className="mk-row__title">{mock.title}</span>
      <span className="mk-row__blurb">{mock.blurb}</span>
    </a>
  );
}
