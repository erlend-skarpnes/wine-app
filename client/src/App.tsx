import CellarPage from './pages/CellarPage'

export default function App() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="bg-wine text-white px-6 py-3.5 flex items-center justify-between gap-8 flex-wrap shrink-0">
        <span className="text-[1.1rem] font-bold tracking-[0.02em]">{__APP_NAME__}</span>
        <span className="text-xs opacity-50">{new Date(__BUILD_TIME__).toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' })}</span>
      </header>
      <main className="flex-1 overflow-y-auto p-6 pb-[calc(1.5rem+72px)] max-w-[960px] mx-auto w-full">
        <CellarPage />
      </main>
    </div>
  )
}
