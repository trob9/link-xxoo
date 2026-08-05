"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type { FocusEvent } from "react";
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
import { Button } from "@/components/ui/button";
import { fieldClasses, Input, Label } from "@/components/ui/input";
import { SOCIAL_PLATFORMS, normalizeSocialUrl } from "@/lib/validation";
import {
  addSocialLink,
  deleteSocialLink,
  reorderSocialLinks,
  type FormState,
} from "../actions";

export type DashboardSocial = {
  id: string;
  platform: string;
  url: string;
};

const initialState: FormState = {};

const URL_PLACEHOLDERS: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  instagram: "instagram.com/you",
  x: "x.com/you",
  tiktok: "tiktok.com/@you",
  youtube: "youtube.com/@you",
  twitch: "twitch.tv/you",
  github: "github.com/you",
  linkedin: "linkedin.com/in/you",
  facebook: "facebook.com/you",
  website: "yoursite.com",
  email: "you@example.com",
};

export function SocialLinksManager({
  socials: initial,
}: {
  socials: DashboardSocial[];
}) {
  const [state, formAction, pending] = useActionState(
    addSocialLink,
    initialState,
  );
  const [platform, setPlatform] = useState<(typeof SOCIAL_PLATFORMS)[number]>(
    SOCIAL_PLATFORMS[0],
  );
  const [socials, setSocials] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Resync local (optimistic/drag) state when the server sends fresh data —
  // during render, not in an effect, per React's "adjusting state when a prop
  // changes" pattern. Same approach as LinksManager.
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setSocials(initial);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSocials((current) => {
      const oldIndex = current.findIndex((s) => s.id === active.id);
      const newIndex = current.findIndex((s) => s.id === over.id);
      const next = arrayMove(current, oldIndex, newIndex);
      startTransition(() => reorderSocialLinks(next.map((s) => s.id)));
      return next;
    });
  }

  function onUrlBlur(e: FocusEvent<HTMLInputElement>) {
    const next = normalizeSocialUrl(platform, e.target.value);
    if (next !== e.target.value) e.target.value = next;
  }

  return (
    <div className="flex flex-col gap-4">
      {socials.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={socials.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {socials.map((social) => (
                <SortableSocialRow key={social.id} social={social} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="rounded-md border-2 border-dashed border-border-strong p-6 text-center text-sm text-ink-muted">
          No social icons yet. They appear as a row of icons under your links.
        </p>
      )}

      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-3 border-t-2 border-border-strong pt-4 sm:flex-row sm:items-end"
      >
        <div className="sm:w-40">
          <Label htmlFor="platform">Platform</Label>
          <select
            id="platform"
            name="platform"
            value={platform}
            onChange={(e) =>
              setPlatform(e.target.value as (typeof SOCIAL_PLATFORMS)[number])
            }
            className={fieldClasses}
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          {/*
            "Profile URL", not "URL": the add-link form on this same page has
            its own URL field, and two identically-labelled inputs on one
            screen are ambiguous to read and worse to navigate by screen
            reader.
          */}
          <Label htmlFor="social-url">
            {platform === "email" ? "Email address" : "Profile URL"}
          </Label>
          <Input
            id="social-url"
            name="url"
            type="text"
            required
            placeholder={URL_PLACEHOLDERS[platform]}
            onBlur={onUrlBlur}
          />
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </Button>
      </form>

      {state.error ? (
        <p className="text-sm font-semibold text-danger">{state.error}</p>
      ) : null}
    </div>
  );
}

function SortableSocialRow({ social }: { social: DashboardSocial }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: social.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="flex items-center gap-3 rounded-md border-hard bg-surface-raised p-3"
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab touch-none px-1 text-lg text-ink-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <span className="w-24 shrink-0 text-xs font-bold uppercase tracking-wide">
        {social.platform}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-ink-muted">
        {social.url}
      </span>
      <form action={deleteSocialLink.bind(null, social.id)}>
        <Button type="submit" variant="danger" size="sm">
          Remove
        </Button>
      </form>
    </li>
  );
}
