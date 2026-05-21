'use client';
import { MEALS, type Meal } from '@/lib/meals';

export default function MealSelect({ value, onChange }: { value: Meal; onChange: (m: Meal) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {MEALS.map(m => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={`rounded-xl py-2 text-sm flex flex-col items-center ${value === m.id ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-300'}`}
        >
          <span className="text-xl">{m.emoji}</span>
          <span className="text-[11px]">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
