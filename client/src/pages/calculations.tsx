import { CalculationsPage } from '../components/CalculationsPage';

export default function Calculations() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--arinote-beige)]">
      <div className="flex flex-1 flex-col md:flex-row gap-4 p-2 md:p-6">
        <CalculationsPage />
      </div>
    </div>
  );
}