import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNote, upsertNote } from '../api/notes'
import { queryKeys } from '../api/queryKeys'

interface Props {
  barcode: string
}

export default function NotesPanel({ barcode }: Props) {
  const queryClient = useQueryClient()
  const [fromYear, setFromYear] = useState('')
  const [toYear, setToYear] = useState('')
  const [personalNote, setPersonalNote] = useState('')
  const [showOwnForm, setShowOwnForm] = useState(false)

  const { data: note } = useQuery({
    queryKey: queryKeys.note(barcode),
    queryFn: () => getNote(barcode),
    retry: false,
  })

  const upsertMutation = useMutation({
    mutationFn: (body: { drinkFromYear: number | null; drinkToYear: number | null; personalNote: string | null }) =>
      upsertNote(barcode, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.note(barcode) }),
  })

  useEffect(() => {
    if (note?.isOwn) {
      setFromYear(note.drinkFromYear?.toString() ?? '')
      setToYear(note.drinkToYear?.toString() ?? '')
      setPersonalNote(note.personalNote ?? '')
    }
  }, [note])

  if (note && !note.isOwn && !showOwnForm) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-clay text-xs font-semibold mb-2 uppercase tracking-wide">Drikkeklar</p>
          <p className="text-bark" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.35rem' }}>
            {note.drinkFromYear && note.drinkToYear
              ? `${note.drinkFromYear} – ${note.drinkToYear}`
              : note.drinkFromYear
                ? `Fra ${note.drinkFromYear}`
                : note.drinkToYear
                  ? `Innen ${note.drinkToYear}`
                  : '–'}
          </p>
          <p className="text-clay text-xs mt-1">— {note.authorUsername}</p>
        </div>
        <button
          type="button"
          className="secondary self-start text-sm py-2 px-4"
          onClick={() => setShowOwnForm(true)}
        >
          Legg til din egen
        </button>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={e => {
        e.preventDefault()
        upsertMutation.mutate({
          drinkFromYear: fromYear ? parseInt(fromYear, 10) : null,
          drinkToYear: toYear ? parseInt(toYear, 10) : null,
          personalNote: personalNote.trim() || null,
        })
        setShowOwnForm(false)
      }}
    >
      <div>
        <p className="text-clay text-xs font-semibold mb-3 uppercase tracking-wide">Drikkeklar</p>
        <div className="flex gap-3 items-center">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-clay text-xs">Fra år</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="f.eks. 2025"
              value={fromYear}
              onChange={e => setFromYear(e.target.value)}
              className="w-full"
            />
          </div>
          <span className="text-clay mt-5">–</span>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-clay text-xs">Til år</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="f.eks. 2035"
              value={toYear}
              onChange={e => setToYear(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-clay text-xs font-semibold uppercase tracking-wide">Personlig notat</label>
        <textarea
          rows={3}
          placeholder="Egne tanker om denne vinen…"
          value={personalNote}
          onChange={e => setPersonalNote(e.target.value)}
          className="w-full resize-none"
        />
      </div>
      <button
        type="submit"
        className="secondary self-start py-2 px-5 text-sm"
        disabled={upsertMutation.isPending}
      >
        {upsertMutation.isPending ? 'Lagrer…' : 'Lagre'}
      </button>
    </form>
  )
}
