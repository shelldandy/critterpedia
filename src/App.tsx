import { Header } from './components/Header.tsx';
import { NowPanel } from './components/NowPanel.tsx';
import { useNow } from './hooks/useNow.ts';
import { useSettings } from './store/useSettings.ts';

export default function App() {
  const now = useNow();
  const hemisphere = useSettings((s) => s.hemisphere);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header now={now} />
      <main>
        <NowPanel now={now} hemisphere={hemisphere} />
      </main>
      <footer className="mx-auto max-w-2xl px-4 pt-2 pb-8 text-xs text-slate-500 dark:text-slate-500">
        Critter data from{' '}
        <a
          href="https://github.com/Norviah/animal-crossing"
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Norviah/animal-crossing
        </a>{' '}
        (CC BY 4.0). Images © Nintendo, used non-commercially. Not affiliated with Nintendo.
      </footer>
    </div>
  );
}
