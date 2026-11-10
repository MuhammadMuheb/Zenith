import React, { useState } from 'react';
import {
  Pin,
  CheckSquare,
  Plus,
  Trash2,
  Archive,
  Palette,
  Tag,
  Clock,
  Search,
  Check,
  X,
  Lock,
  Unlock,
  Copy,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Note, NoteColor, ChecklistItem } from '../types';

interface NotesViewProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string, permanent?: boolean) => void;
  onRestoreNote: (id: string) => void;
  searchQuery: string;
}

const COLOR_CLASSES: Record<NoteColor, { bg: string; border: string; text: string }> = {
  default: {
    bg: 'bg-neutral-900/80',
    border: 'border-neutral-800 hover:border-neutral-700',
    text: 'text-neutral-100',
  },
  amber: {
    bg: 'bg-amber-950/40',
    border: 'border-amber-700/50 hover:border-amber-500/70',
    text: 'text-amber-100',
  },
  emerald: {
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-700/50 hover:border-emerald-500/70',
    text: 'text-emerald-100',
  },
  blue: {
    bg: 'bg-blue-950/40',
    border: 'border-blue-700/50 hover:border-blue-500/70',
    text: 'text-blue-100',
  },
  purple: {
    bg: 'bg-purple-950/40',
    border: 'border-purple-700/50 hover:border-purple-500/70',
    text: 'text-purple-100',
  },
  rose: {
    bg: 'bg-rose-950/40',
    border: 'border-rose-700/50 hover:border-rose-500/70',
    text: 'text-rose-100',
  },
  teal: {
    bg: 'bg-teal-950/40',
    border: 'border-teal-700/50 hover:border-teal-500/70',
    text: 'text-teal-100',
  },
  slate: {
    bg: 'bg-slate-900/60',
    border: 'border-slate-700/50 hover:border-slate-500/70',
    text: 'text-slate-100',
  },
};

const PALETTE_OPTIONS: Array<{ key: NoteColor; label: string; dotClass: string }> = [
  { key: 'default', label: 'Default', dotClass: 'bg-neutral-800 border-neutral-600' },
  { key: 'amber', label: 'Amber', dotClass: 'bg-amber-600 border-amber-400' },
  { key: 'emerald', label: 'Emerald', dotClass: 'bg-emerald-600 border-emerald-400' },
  { key: 'blue', label: 'Blue', dotClass: 'bg-blue-600 border-blue-400' },
  { key: 'purple', label: 'Purple', dotClass: 'bg-purple-600 border-purple-400' },
  { key: 'rose', label: 'Rose', dotClass: 'bg-rose-600 border-rose-400' },
  { key: 'teal', label: 'Teal', dotClass: 'bg-teal-600 border-teal-400' },
];

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onRestoreNote,
  searchQuery,
}) => {
  // Composer state
  const [isComposing, setIsComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor>('default');
  const [isPinned, setIsPinned] = useState(false);
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCheckItemText, setNewCheckItemText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [viewSection, setViewSection] = useState<'active' | 'archive' | 'trash'>('active');

  // Edit modal state
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Add checklist item
  const handleAddCheckItem = () => {
    if (!newCheckItemText.trim()) return;
    setChecklist([
      ...checklist,
      { id: 'c-' + Date.now(), text: newCheckItemText.trim(), completed: false },
    ]);
    setNewCheckItemText('');
  };

  // Add tag
  const handleAddTag = (t: string) => {
    const clean = t.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  // Submit new note
  const handleSaveNote = () => {
    if (!title.trim() && !content.trim() && checklist.length === 0) {
      setIsComposing(false);
      return;
    }

    onAddNote({
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      color: selectedColor,
      isPinned,
      isArchived: false,
      isTrash: false,
      tags,
      checklist,
      reminderDate: reminderDate || undefined,
    });

    // Reset composer
    setTitle('');
    setContent('');
    setSelectedColor('default');
    setIsPinned(false);
    setIsChecklistMode(false);
    setChecklist([]);
    setTags([]);
    setReminderDate('');
    setIsComposing(false);
  };

  // Toggle checklist inside card
  const handleToggleCardChecklist = (noteId: string, itemId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const updatedChecklist = note.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateNote(noteId, { checklist: updatedChecklist });
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (viewSection === 'archive') return n.isArchived && !n.isTrash;
    if (viewSection === 'trash') return n.isTrash;
    if (n.isArchived || n.isTrash) return false;

    // Search query matching
    const matchesSearch =
      searchQuery === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      n.checklist.some((c) => c.text.toLowerCase().includes(searchQuery.toLowerCase()));

    // Tag filter
    const matchesTag = !activeTagFilter || n.tags.includes(activeTagFilter);

    return matchesSearch && matchesTag;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(notes.filter((n) => !n.isTrash).flatMap((n) => n.tags))
  );

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6">
      {/* Top filter strip & Sub-navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/60 p-1">
          <button
            onClick={() => setViewSection('active')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              viewSection === 'active'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Notes ({notes.filter((n) => !n.isArchived && !n.isTrash).length})
          </button>
          <button
            onClick={() => setViewSection('archive')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              viewSection === 'archive'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            Archive ({notes.filter((n) => n.isArchived && !n.isTrash).length})
          </button>
          <button
            onClick={() => setViewSection('trash')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              viewSection === 'trash'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Trash ({notes.filter((n) => n.isTrash).length})
          </button>
        </div>

        {/* Tag pills */}
        {allTags.length > 0 && viewSection === 'active' && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-neutral-400 flex items-center gap-1 mr-1">
              <Tag className="h-3 w-3" /> Labels:
            </span>
            <button
              onClick={() => setActiveTagFilter(null)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                activeTagFilter === null
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-neutral-800/80 text-neutral-400 border border-neutral-700/60 hover:text-white'
              }`}
            >
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTagFilter(activeTagFilter === t ? null : t)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                  activeTagFilter === t
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-neutral-800/80 text-neutral-400 border border-neutral-700/60 hover:text-white'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Google Keep "Take a Note..." Bar */}
      {viewSection === 'active' && (
        <div className="mx-auto mb-8 max-w-2xl">
          {!isComposing ? (
            <div
              onClick={() => setIsComposing(true)}
              className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-700/80 bg-neutral-900/90 px-4 py-3 shadow-lg hover:border-neutral-600 transition"
            >
              <span className="text-sm text-neutral-400 font-medium">Take a note...</span>
              <div className="flex items-center gap-2 text-neutral-400">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsComposing(true);
                    setIsChecklistMode(true);
                  }}
                  className="rounded-lg p-1.5 hover:bg-neutral-800 hover:text-white transition"
                  title="New list"
                >
                  <CheckSquare className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-2xl border shadow-2xl transition p-4 ${
                COLOR_CLASSES[selectedColor].border
              } ${COLOR_CLASSES[selectedColor].bg}`}
            >
              {/* Note Title & Pin */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent text-base font-semibold text-white placeholder-neutral-500 outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className={`rounded-full p-1.5 transition ${
                    isPinned ? 'text-amber-400 bg-amber-400/20' : 'text-neutral-400 hover:text-white'
                  }`}
                  title={isPinned ? 'Unpin note' : 'Pin note'}
                >
                  <Pin className="h-4 w-4" />
                </button>
              </div>

              {/* Note Plain Content */}
              {!isChecklistMode ? (
                <textarea
                  placeholder="Take a note..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full resize-none bg-transparent text-sm text-neutral-200 placeholder-neutral-500 outline-none leading-relaxed"
                />
              ) : (
                /* Checklist Builder */
                <div className="space-y-2 mb-3">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {
                          setChecklist(
                            checklist.map((c) =>
                              c.id === item.id ? { ...c, completed: !c.completed } : c
                            )
                          );
                        }}
                        className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0"
                      />
                      <span
                        className={`flex-1 ${
                          item.completed ? 'line-through text-neutral-500' : 'text-neutral-200'
                        }`}
                      >
                        {item.text}
                      </span>
                      <button
                        onClick={() => setChecklist(checklist.filter((c) => c.id !== item.id))}
                        className="text-neutral-500 hover:text-neutral-300"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="List item"
                      value={newCheckItemText}
                      onChange={(e) => setNewCheckItemText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCheckItem();
                        }
                      }}
                      className="w-full bg-transparent text-sm text-neutral-200 placeholder-neutral-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCheckItem}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Tags & Reminders list */}
              {(tags.length > 0 || reminderDate) && (
                <div className="flex flex-wrap items-center gap-1.5 my-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-neutral-800/80 px-2 py-0.5 text-[11px] text-neutral-300 border border-neutral-700/60"
                    >
                      #{t}
                      <button
                        onClick={() => setTags(tags.filter((tag) => tag !== t))}
                        className="text-neutral-500 hover:text-white"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {reminderDate && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] text-indigo-300 border border-indigo-500/40">
                      <Clock className="h-3 w-3" />
                      {reminderDate}
                    </span>
                  )}
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="mt-3 flex items-center justify-between border-t border-neutral-800/60 pt-2">
                <div className="flex items-center gap-1 relative">
                  {/* Color Palette Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
                      title="Background options"
                    >
                      <Palette className="h-4 w-4" />
                    </button>

                    {showColorPicker && (
                      <div className="absolute bottom-8 left-0 flex gap-1 rounded-xl border border-neutral-700 bg-neutral-800 p-1.5 shadow-xl z-20">
                        {PALETTE_OPTIONS.map((pal) => (
                          <button
                            key={pal.key}
                            type="button"
                            onClick={() => {
                              setSelectedColor(pal.key);
                              setShowColorPicker(false);
                            }}
                            className={`h-5 w-5 rounded-full border ${pal.dotClass} ${
                              selectedColor === pal.key ? 'ring-2 ring-white ring-offset-1' : ''
                            }`}
                            title={pal.label}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Toggle Checklist */}
                  <button
                    type="button"
                    onClick={() => setIsChecklistMode(!isChecklistMode)}
                    className={`rounded-lg p-1.5 transition ${
                      isChecklistMode
                        ? 'text-emerald-400 bg-emerald-500/20'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                    title="Toggle checklist"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </button>

                  {/* Add Tag */}
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="#tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(tagInput);
                        }
                      }}
                      className="w-16 rounded bg-neutral-800/60 px-1.5 py-0.5 text-xs text-neutral-200 placeholder-neutral-500 outline-none border border-neutral-700/40"
                    />
                  </div>

                  {/* Reminder Date */}
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="rounded bg-neutral-800/60 px-1.5 py-0.5 text-[11px] text-neutral-300 outline-none border border-neutral-700/40"
                    title="Add reminder date"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="text-xs text-neutral-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="rounded-lg bg-emerald-500 px-3.5 py-1 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PINNED NOTES SECTION */}
      {viewSection === 'active' && pinnedNotes.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
            <Pin className="h-3.5 w-3.5 text-amber-400" />
            <span>Pinned</span>
            <span className="text-[10px] text-neutral-500">({pinnedNotes.length})</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onUpdate={onUpdateNote}
                onDelete={onDeleteNote}
                onToggleCheck={handleToggleCardChecklist}
                onEdit={(n) => setEditingNote(n)}
              />
            ))}
          </div>
        </div>
      )}

      {/* OTHERS SECTION */}
      <div>
        {viewSection === 'active' && pinnedNotes.length > 0 && otherNotes.length > 0 && (
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
            <span>Others</span>
          </div>
        )}

        {filteredNotes.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800/60 text-neutral-500">
              <CheckSquare className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-neutral-300">No notes found</p>
            <p className="text-xs text-neutral-500 mt-1">
              {searchQuery ? `No notes matching "${searchQuery}"` : 'Capture your thoughts, budgets, and tasks above.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(viewSection === 'active' ? otherNotes : filteredNotes).map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isTrashView={viewSection === 'trash'}
                isArchiveView={viewSection === 'archive'}
                onUpdate={onUpdateNote}
                onDelete={onDeleteNote}
                onRestore={onRestoreNote}
                onToggleCheck={handleToggleCardChecklist}
                onEdit={(n) => setEditingNote(n)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl transition ${
              COLOR_CLASSES[editingNote.color].border
            } ${COLOR_CLASSES[editingNote.color].bg}`}
          >
            <div className="flex items-center justify-between mb-3">
              <input
                type="text"
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                className="w-full bg-transparent text-lg font-bold text-white outline-none"
              />
              <button
                onClick={() => setEditingNote(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <textarea
              value={editingNote.content}
              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
              rows={5}
              className="w-full resize-none bg-transparent text-sm text-neutral-200 outline-none leading-relaxed"
            />

            {/* Checklist inside modal */}
            {editingNote.checklist && editingNote.checklist.length > 0 && (
              <div className="space-y-2 my-3 max-h-48 overflow-y-auto pr-1">
                {editingNote.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {
                        const updated = editingNote.checklist.map((c) =>
                          c.id === item.id ? { ...c, completed: !c.completed } : c
                        );
                        setEditingNote({ ...editingNote, checklist: updated });
                      }}
                      className="rounded border-neutral-700 bg-neutral-800 text-emerald-500"
                    />
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const updated = editingNote.checklist.map((c) =>
                          c.id === item.id ? { ...c, text: e.target.value } : c
                        );
                        setEditingNote({ ...editingNote, checklist: updated });
                      }}
                      className={`w-full bg-transparent text-xs ${
                        item.completed ? 'line-through text-neutral-500' : 'text-neutral-200'
                      } outline-none`}
                    />
                    <button
                      onClick={() => {
                        const updated = editingNote.checklist.filter((c) => c.id !== item.id);
                        setEditingNote({ ...editingNote, checklist: updated });
                      }}
                      className="text-neutral-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom options */}
            <div className="mt-4 flex items-center justify-between border-t border-neutral-800/80 pt-3">
              <div className="flex items-center gap-1.5">
                {PALETTE_OPTIONS.map((pal) => (
                  <button
                    key={pal.key}
                    type="button"
                    onClick={() => setEditingNote({ ...editingNote, color: pal.key })}
                    className={`h-5 w-5 rounded-full border ${pal.dotClass} ${
                      editingNote.color === pal.key ? 'ring-2 ring-white' : ''
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingNote(null)}
                  className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onUpdateNote(editingNote.id, editingNote);
                    setEditingNote(null);
                  }}
                  className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: Individual Note Card
interface NoteCardProps {
  note: Note;
  isTrashView?: boolean;
  isArchiveView?: boolean;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string, permanent?: boolean) => void;
  onRestore?: (id: string) => void;
  onToggleCheck: (noteId: string, itemId: string) => void;
  onEdit: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isTrashView,
  isArchiveView,
  onUpdate,
  onDelete,
  onRestore,
  onToggleCheck,
  onEdit,
}) => {
  const colorStyle = COLOR_CLASSES[note.color] || COLOR_CLASSES.default;

  return (
    <div
      onClick={() => !isTrashView && onEdit(note)}
      className={`group relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        colorStyle.border
      } ${colorStyle.bg} cursor-pointer`}
    >
      <div>
        {/* Card Header: Title & Pin Toggle */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm sm:text-base text-neutral-100 leading-snug line-clamp-2">
            {note.title}
          </h3>
          {!isTrashView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(note.id, { isPinned: !note.isPinned });
              }}
              className={`rounded-full p-1 transition ${
                note.isPinned
                  ? 'text-amber-400 bg-amber-400/20'
                  : 'text-neutral-500 opacity-0 group-hover:opacity-100 hover:text-neutral-200'
              }`}
              title={note.isPinned ? 'Unpin' : 'Pin to top'}
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Content body */}
        {note.content && (
          <p className="whitespace-pre-line text-xs sm:text-sm text-neutral-300 leading-relaxed mb-3 line-clamp-6">
            {note.content}
          </p>
        )}

        {/* Checklist preview */}
        {note.checklist && note.checklist.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {note.checklist.slice(0, 5).map((item) => (
              <div
                key={item.id}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-xs"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => onToggleCheck(note.id, item.id)}
                  className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0"
                />
                <span
                  className={`line-clamp-1 ${
                    item.completed ? 'line-through text-neutral-500' : 'text-neutral-300'
                  }`}
                >
                  {item.text}
                </span>
              </div>
            ))}
            {note.checklist.length > 5 && (
              <p className="text-[10px] text-neutral-400 italic">
                +{note.checklist.length - 5} more items...
              </p>
            )}
          </div>
        )}

        {/* Tags & Reminder badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {note.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-neutral-800/80 px-2 py-0.5 text-[10px] font-medium text-neutral-300 border border-neutral-700/60"
            >
              #{t}
            </span>
          ))}
          {note.reminderDate && (
            <span className="flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/30">
              <Clock className="h-2.5 w-2.5" />
              {note.reminderDate}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Quick Actions */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-4 flex items-center justify-between border-t border-neutral-800/60 pt-2 text-neutral-400 opacity-80 group-hover:opacity-100 transition"
      >
        <span className="text-[10px] text-neutral-500 font-mono">
          {new Date(note.updatedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </span>

        <div className="flex items-center gap-1">
          {isTrashView ? (
            <>
              {onRestore && (
                <button
                  onClick={() => onRestore(note.id)}
                  className="rounded p-1 hover:bg-neutral-800 hover:text-emerald-400"
                  title="Restore"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => onDelete(note.id, true)}
                className="rounded p-1 hover:bg-neutral-800 hover:text-rose-400"
                title="Delete forever"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              {/* Archive toggle */}
              <button
                onClick={() => onUpdate(note.id, { isArchived: !note.isArchived })}
                className="rounded p-1 hover:bg-neutral-800 hover:text-neutral-200"
                title={note.isArchived ? 'Unarchive' : 'Archive'}
              >
                <Archive className="h-3.5 w-3.5" />
              </button>

              {/* Move to trash */}
              <button
                onClick={() => onDelete(note.id, false)}
                className="rounded p-1 hover:bg-neutral-800 hover:text-rose-400"
                title="Send to Trash"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
