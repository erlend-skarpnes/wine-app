import CellarPage from './pages/CellarPage'

export default function App() {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="bg-wine text-white px-6 py-3.5 flex items-center gap-8 flex-wrap">
        <span className="text-[1.1rem] font-bold tracking-[0.02em]">Wine Cellar</span>
      </header>
      <main className="flex-1 p-6 pb-[calc(1.5rem+72px)] max-w-[960px] mx-auto w-full">
        <CellarPage />
      </main>
    </div>
  )
}
