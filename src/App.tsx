import { Header } from './components/Header.tsx';
import { NowPanel } from './components/NowPanel.tsx';
import { useNow } from './hooks/useNow.ts';
import { useMessages } from './i18n/useMessages.ts';
import { useSettings } from './store/useSettings.ts';

export default function App() {
  const now = useNow();
  const hemisphere = useSettings((s) => s.hemisphere);
  const { t } = useMessages();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header now={now} />
      <main>
        <NowPanel now={now} hemisphere={hemisphere} />
      </main>
      <footer className="mx-auto max-w-6xl px-4 pt-2 pb-8 text-xs text-slate-500 dark:text-slate-500">
        {/* Split around the link rather than interpolated into one string, so the sentence
            keeps its anchor without needing a rich-text formatting layer. */}
        {t.dataCredit}{' '}
        <a
          href="https://github.com/Norviah/animal-crossing"
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Norviah/animal-crossing
        </a>{' '}
        {t.dataLicense}
      </footer>
    </div>
  );
}
