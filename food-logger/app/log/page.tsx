import CameraCapture from '@/components/CameraCapture';
import ManualEntryForm from '@/components/ManualEntryForm';

export default function LogPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Log a meal</h1>
      <p className="text-neutral-400 text-sm">Snap your food. Claude estimates calories and macros.</p>
      <CameraCapture />
      <ManualEntryForm />
    </div>
  );
}
