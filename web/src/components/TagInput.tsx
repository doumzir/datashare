import { useState } from 'react';
import type { KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('');

  function addTag() {
    const tag = input.trim().toLowerCase();
    if (tag && tag.length <= 30 && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap gap-1 border border-gray-300 rounded-lg px-2 py-1 min-h-[40px] focus-within:ring-2 focus-within:ring-blue-500">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-blue-400 hover:text-blue-700"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={addTag}
        placeholder={tags.length === 0 ? 'Ajouter un tag...' : ''}
        className="flex-1 min-w-[100px] text-sm outline-none bg-transparent py-1"
        maxLength={30}
      />
    </div>
  );
}
