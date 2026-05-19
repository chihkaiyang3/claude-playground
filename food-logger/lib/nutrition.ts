export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

const ACTIVITY: Record<Activity, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
};

export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function tdee(sex: Sex, weightKg: number, heightCm: number, age: number, activity: Activity) {
  return bmr(sex, weightKg, heightCm, age) * ACTIVITY[activity];
}

export function dailyTarget(sex: Sex, weightKg: number, heightCm: number, age: number, activity: Activity) {
  const target = tdee(sex, weightKg, heightCm, age, activity) - 500;
  const floor = sex === 'male' ? 1500 : 1200;
  return Math.max(floor, Math.round(target));
}
