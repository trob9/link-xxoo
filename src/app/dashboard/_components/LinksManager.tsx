"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  deleteLink,
  reorderLinks,
  setLinkEnabled,
  setLinkFeatured,
  updateLink,
  type FormState,
} from "../actions";

export type DashboardLink = {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  enabled: boolean;
  featured: boolean;
  clickCount: number;
  startsAt: string | null;
  endsAt: string | null;
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function scheduleNote(startsAt: string | null, endsAt: string | null): string | null {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  if (startsAt && endsAt) return `Live ${fmt(startsAt)} → ${fmt(endsAt)}`;
  if (startsAt) return `Live from ${fmt(startsAt)}`;
  if (endsAt) return `Hides ${fmt(endsAt)}`;
  return null;
}

export function LinksManager({ links: initial }: { links: DashboardLink[] }) {
  const [links, setLinks] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  const [, startTransition] = useTransition();

  // Resync local (optimistic/drag) state when the server gives us fresh
  // data, e.g. after a revalidatePath — done during render, not an effect,
  // per React's "adjusting state when a prop changes" pattern.
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setLinks(initial);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLinks((current) => {
      const oldIndex = current.findIndex((l) => l.id === active.id);
      const newIndex = current.findIndex((l) => l.id === over.id);
      const next = arrayMove(current, oldIndex, newIndex);
      startTransition(() => reorderLinks(next.map((l) => l.id)));
      return next;
    });
  }

  if (links.length === 0) {
    return (
      <div className="rounded-md border-2 border-dashed border-border-strong p-8 text-center text-sm text-ink-muted">
        No links yet. Add your first one above.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={links.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-3">
          {links.map((link) => (
            <SortableLinkRow key={link.id} link={link} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableLinkRow({ link }: { link: DashboardLink }) {
  const [editing, setEditing] = useState(false);
  const [enabled, setEnabled] = useState(link.enabled);
  const [featured, setFeatured] = useState(link.featured);
  const [prevLink, setPrevLink] = useState(link);
  const [, startTransition] = useTransition();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });

  if (link !== prevLink) {
    setPrevLink(link);
    setEnabled(link.enabled);
    setFeatured(link.featured);
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const note = scheduleNote(link.startsAt, link.endsAt);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-md border-hard bg-surface-raised shadow-hard-sm",
        !enabled && "opacity-70",
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          aria-label="Drag to reorder"
          className="cursor-grab touch-none px-1 text-lg text-ink-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>

        {link.icon ? (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded border-hard bg-surface text-lg">
            {link.icon}
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{link.title}</p>
            {featured ? <Badge>★ Featured</Badge> : null}
          </div>
          <p className="truncate text-xs text-ink-muted">{link.url}</p>
          {note ? (
            <p className="mt-0.5 text-[11px] font-medium text-ink-muted">{note}</p>
          ) : null}
        </div>

        <span className="hidden shrink-0 text-right font-stat text-xs text-ink-muted sm:block">
          {link.clickCount}
          <br />
          clicks
        </span>

        <Switch
          checked={enabled}
          label="Enabled"
          onChange={(v) => {
            setEnabled(v);
            startTransition(() => setLinkEnabled(link.id, v));
          }}
        />

        <div className="flex shrink-0 gap-1">
          <Button
            variant={featured ? "primary" : "ghost"}
            size="sm"
            aria-label="Toggle featured"
            onClick={() => {
              const next = !featured;
              setFeatured(next);
              startTransition(() => setLinkFeatured(link.id, next));
            }}
          >
            ★
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing((e) => !e)}
          >
            Edit
          </Button>
          <form action={deleteLink.bind(null, link.id)}>
            <Button type="submit" variant="danger" size="sm">
              Delete
            </Button>
          </form>
        </div>
      </div>

      {editing ? (
        <EditLinkForm link={link} onDone={() => setEditing(false)} />
      ) : null}
    </li>
  );
}

const initialState: FormState = {};

function EditLinkForm({
  link,
  onDone,
}: {
  link: DashboardLink;
  onDone: () => void;
}) {
  const boundUpdate = updateLink.bind(null, link.id);
  const [state, formAction, pending] = useActionState(boundUpdate, initialState);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    if (state.ok) doneRef.current();
  }, [state.ok]);

  return (
    <form
      action={formAction}
      className="grid gap-4 border-t-2 border-border-strong p-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <Label htmlFor={`t-${link.id}`}>Title</Label>
        <Input id={`t-${link.id}`} name="title" defaultValue={link.title} required maxLength={80} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`u-${link.id}`}>URL</Label>
        <Input id={`u-${link.id}`} name="url" type="url" defaultValue={link.url} required />
      </div>
      <div>
        <Label htmlFor={`i-${link.id}`}>Icon / emoji</Label>
        <Input id={`i-${link.id}`} name="icon" defaultValue={link.icon ?? ""} maxLength={40} />
      </div>
      <div className="flex items-end pb-1">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={link.featured}
            className="h-4 w-4 border-hard accent-[var(--action-primary)]"
          />
          Featured
        </label>
      </div>
      <div>
        <Label htmlFor={`s-${link.id}`}>Starts</Label>
        <Input id={`s-${link.id}`} name="startsAt" type="datetime-local" defaultValue={toLocalInput(link.startsAt)} />
      </div>
      <div>
        <Label htmlFor={`e-${link.id}`}>Ends</Label>
        <Input id={`e-${link.id}`} name="endsAt" type="datetime-local" defaultValue={toLocalInput(link.endsAt)} />
      </div>

      {state.error ? (
        <p className="text-sm font-semibold text-danger sm:col-span-2">{state.error}</p>
      ) : null}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
