import React from "react";
import Button from "../../components/ui/Button";

const Sos: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
    <h2 className="text-3xl font-bold text-[var(--color-danger)]">Emergency SOS</h2>
    <p className="text-lg text-[var(--color-text)]/70 max-w-xs">
      Press the button below to immediately alert your family and emergency contacts.
    </p>
    <Button variant="danger" size="lg" className="w-48 h-48 rounded-full text-3xl font-extrabold animate-pulse">
      SOS
    </Button>
  </div>
);

export default Sos;
