export type Activity = 'yoga' | 'gym' | 'running' | 'swimming' | 'walking' | 'cycling' | 'other';

// MET (metabolic equivalent) values — moderate-intensity estimates.
export const EXERCISES: { id: Activity; label: string; emoji: string; met: number }[] = [
  { id: 'running', label: 'Running', emoji: '🏃', met: 9.8 },
  { id: 'swimming', label: 'Swimming', emoji: '🏊', met: 7.0 },
  { id: 'cycling', label: 'Cycling', emoji: '🚴', met: 7.5 },
  { id: 'gym', label: 'Gym', emoji: '🏋️', met: 4.5 },
  { id: 'walking', label: 'Walking', emoji: '🚶', met: 3.5 },
  { id: 'yoga', label: 'Yoga', emoji: '🧘', met: 2.5 },
  { id: 'other', label: 'Other', emoji: '✨', met: 0 }
];

// kcal = MET × bodyweight(kg) × duration(hours). Returns 0 for unknown weight or 'other' (met 0).
export function estimateKcal(met: number, weightKg: number | null, minutes: number): number {
  if (!met || !weightKg || !minutes) return 0;
  return Math.round((met * weightKg * minutes) / 60);
}
