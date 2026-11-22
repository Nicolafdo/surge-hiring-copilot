"use client";
import { useState } from "react";

export default function SkillInput({
  value,
  onChange,
  max = 20,
}: {
  value: string[];
  onChange: (skills: string[]) => void;
  max?: number;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const skill = draft.trim().replace(/\s+/g, " ").slice(0, 40);
    setDraft("");
    if (!skill || value.length >= max) return;
    if (value.some((s) => s.toLowerCase() === skill.toLowerCase())) return; // no duplicates
    onChange([...value, skill]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault(); // stop Enter from submitting the whole form
      if (!e.nativeEvent.isComposing) add();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1)); // Backspace on an empty box removes the last skill
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
          >
            {s}
            <button
              type="button"
              aria-label={`Remove ${s}`}
              onClick={() => onChange(value.filter((x) => x !== s))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
          placeholder="Type a skill and press Enter"
          maxLength={40}
          disabled={value.length >= max}
        />
        <button type="button" onClick={add}>
          Add
        </button>
      </div>
      <small>
        {value.length}/{max} skills. Duplicates are ignored.
      </small>
    </div>
  );
}
