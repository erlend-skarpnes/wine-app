export default function ViewfinderOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div className="relative w-[72%] h-20 rounded shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
        <div className="absolute top-0 left-0 w-[18px] h-[18px] border-t-[2.5px] border-l-[2.5px] border-white" />
        <div className="absolute top-0 right-0 w-[18px] h-[18px] border-t-[2.5px] border-r-[2.5px] border-white" />
        <div className="absolute bottom-0 left-0 w-[18px] h-[18px] border-b-[2.5px] border-l-[2.5px] border-white" />
        <div className="absolute bottom-0 right-0 w-[18px] h-[18px] border-b-[2.5px] border-r-[2.5px] border-white" />
      </div>
    </div>
  )
}
