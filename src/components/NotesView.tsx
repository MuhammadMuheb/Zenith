import React, { useState } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  Pin,
  Trash2,
  Calendar,
  Sparkles,
  Check,
  Edit3,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { SmartNote, NoteColor, DetectedMoneyPrompt, SupportedCurrency } from '../types';
import { detectMoneyInText } from '../services/smartDetector';
import { formatMoney } from '../services/currency';
import { formatMonthKeyLabel } from '../services/monthEngine';

interface NotesViewProps {
  currentMonthKey: string;
  notes: SmartNote[];
  activeCurrency: SupportedCurrency;
  onAddNote: (note: Omit<SmartNote, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
  onUpdateNote: (id: string, updates: Partial<SmartNote>) => void;
  onDeleteNote: (id: string) => void;
  onConfirmDetectedTransaction: (
    noteId: string,
    prompt: DetectedMoneyPrompt
  ) => void;
  onEditDetectedTransaction: (prompt: DetectedMoneyPrompt) => void;
}

const COLOR_CLASSES: Record<NoteColor, string> = {
  default: 'border-neutral-800 bg-neutral-900/90 text-neutral-100',
  amber: 'border-amber-500/30 bg-amber-950/20 text-amber-100',
  emerald: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-100',
  blue: 'border-blue-500/30 bg-blue-950/20 text-blue-100',
  purple: 'border-purple-500/30 bg-purple-950/20 text-purple-100',
  rose: 'border-rose-500/30 bg-rose-950/20 text-rose-100',
  teal: 'border-teal-500/30 bg-teal-950/20 text-teal-100',
  slate: 'border-slate-700 bg-slate-900/80 text-slate-100',
};

export const NotesView: React.FC<NotesViewProps> = ({
  currentMonthKey,
  notes,
  activeCurrency,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onConfirmDetectedTransaction,
  onEditDetectedTransaction,
}) => {
  // Filter mode: 'all' or specific 'YYYY-MM'
  const [filterMode, setFilterMode] = useState<'all' | 'month'>('all');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor>('default');

  // Filter notes by month & search
  const filteredNotes = notes.filter((n) => {
    const matchesMonth = filterMode === 'all' || n.monthKey === selectedMonthKey;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesSearch;
  });

  const handleSaveNewNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !title.trim()) return;

    // Detect money in note
    const detected = detectMoneyInText(`${title} ${content}`);

    onAddNote({
      monthKey: selectedMonthKey,
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      color: selectedColor,
      isPinned: false,
      detectedPrompt: detected,
    });

    setTitle('');
    setContent('');
    setSelectedColor('default');
    setIsCreating(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-2">
      {/* Top Header & Dynamic Month / Year Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Notes</h1>
          <p className="text-xs text-neutral-400">Keep personal notes for any month or year with smart money auto-routing</p>
        </div>

        {/* Dynamic Month Selector Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterMode === 'all'
                ? 'bg-emerald-500 text-neutral-950 font-bold'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            All Notes ({notes.length})
          </button>

          <button
            onClick={() => setFilterMode('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterMode === 'month'
                ? 'bg-emerald-500 text-neutral-950 font-bold'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            By Month
          </button>

          {/* Month & Year Picker input */}
          <div className="relative">
            <input
              type="month"
              value={selectedMonthKey}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedMonthKey(e.target.value);
                  setFilterMode('month');
                }
              }}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white font-medium focus:border-emerald-500 focus:outline-none"
              title="Pick any month or year"
            />
          </div>
        </div>
      </div>

      {/* Action Bar & Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              filterMode === 'all'
                ? 'Search all notes...'
                : `Search ${formatMonthKeyLabel(selectedMonthKey)} notes...`
            }
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/80 pl-10 pr-4 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="shrink-0 px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>New Note</span>
        </button>
      </div>

      {/* Note Creation Form Drawer */}
      {isCreating && (
        <form
          onSubmit={handleSaveNewNote}
          className="rounded-3xl border border-emerald-500/40 bg-neutral-900/95 p-5 shadow-2xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>New Note</span>
              </span>
              <span className="text-[11px] text-neutral-400">
                (for {formatMonthKeyLabel(selectedMonthKey)})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm font-semibold text-white focus:border-emerald-500 focus:outline-none"
          />

          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write note... (e.g. 'Salary 80,000 received' or 'Took 5,000 from Ali, will return on 20th Nov')"
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none resize-none"
          />

          {/* Color palette */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5">
              {(['default', 'amber', 'emerald', 'blue', 'purple', 'rose'] as NoteColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`h-5 w-5 rounded-full border transition ${
                    selectedColor === c ? 'ring-2 ring-emerald-400 scale-110' : 'opacity-80 hover:opacity-100'
                  } ${
                    c === 'default'
                      ? 'bg-neutral-800 border-neutral-700'
                      : c === 'amber'
                      ? 'bg-amber-500 border-amber-400'
                      : c === 'emerald'
                      ? 'bg-emerald-500 border-emerald-400'
                      : c === 'blue'
                      ? 'bg-blue-500 border-blue-400'
                      : c === 'purple'
                      ? 'bg-purple-500 border-purple-400'
                      : 'bg-rose-500 border-rose-400'
                  }`}
                />
              ))}
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition"
            >
              Save Note
            </button>
          </div>
        </form>
      )}

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-800 bg-neutral-900/40 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800 text-neutral-400 mb-3">
            <StickyNote className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Start your first note</h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto mb-4">
            {filterMode === 'month'
              ? `No notes for ${formatMonthKeyLabel(selectedMonthKey)}. Create one to keep track of this month.`
              : 'Write down thoughts, financial reminders, or memos. Any note mentioning money can be auto-routed to your ledger.'}
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition"
          >
            + Create Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const hasUnconfirmedPrompt = note.detectedPrompt && !note.detectedPrompt.confirmed;
            return (
              <div
                key={note.id}
                className={`rounded-3xl border p-5 flex flex-col justify-between shadow-sm transition ${
                  COLOR_CLASSES[note.color] || COLOR_CLASSES.default
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-white truncate">{note.title}</h3>
                      <span className="text-[10px] text-neutral-400">
                        {formatMonthKeyLabel(note.monthKey)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onUpdateNote(note.id, { isPinned: !note.isPinned })}
                        className={`p-1 rounded-lg transition ${
                          note.isPinned ? 'text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="p-1 text-neutral-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>

                {/* Smart money confirmation card */}
                {hasUnconfirmedPrompt && (
                  <div className="mt-4 pt-3 border-t border-emerald-500/25 rounded-2xl bg-emerald-500/10 p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-semibold text-emerald-200">
                        I found: {note.detectedPrompt!.personOrCategory}{' '}
                        {formatMoney(note.detectedPrompt!.amount, activeCurrency)} on{' '}
                        {note.detectedPrompt!.date}. Send to Home, Savings, Daily, Salary?
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() =>
                          onConfirmDetectedTransaction(note.id, note.detectedPrompt!)
                        }
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition flex items-center justify-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>Yes</span>
                      </button>
                      <button
                        onClick={() => onEditDetectedTransaction(note.detectedPrompt!)}
                        className="flex-1 py-1.5 px-3 rounded-xl border border-neutral-700 bg-neutral-900 text-neutral-200 font-semibold text-xs hover:bg-neutral-800 transition flex items-center justify-center gap-1"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Change</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirmed Indicator */}
                {note.detectedPrompt && note.detectedPrompt.confirmed && (
                  <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Sent to ledger ({formatMoney(note.detectedPrompt.amount, activeCurrency)})</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
