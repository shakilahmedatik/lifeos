import { Lock, LogOut } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import Card, { CardHeader, CardTitle } from "../ui/Card.js";

export const PinLockScreen: React.FC = () => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { user, unlockPin, logout } = useAuth();

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(null);
      if (newPin.length === 4) {
        setTimeout(() => {
          const success = unlockPin(newPin);
          if (!success) {
            setError("Incorrect PIN code");
            setPin("");
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-md p-4 text-white">
      <Card className="w-full max-w-sm bg-gray-900 border-gray-800 p-6 text-center shadow-2xl">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Lock className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-bold">LifeOS Locked</CardTitle>
          <p className="text-xs text-gray-400 mt-1">
            Logged in as{" "}
            <span className="font-semibold text-gray-200">{user?.name || user?.email}</span>
          </p>
        </CardHeader>

        {error && (
          <div className="mb-4 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-lg">
            {error}
          </div>
        )}

        {/* PIN Indicators */}
        <div className="flex justify-center gap-3 my-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 transition-all ${
                i < pin.length
                  ? "bg-blue-500 border-blue-400 scale-110 shadow-sm shadow-blue-500/50"
                  : "border-gray-700 bg-gray-800"
              }`}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 max-w-60 mx-auto mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 w-12 mx-auto flex items-center justify-center rounded-full bg-gray-800/80 hover:bg-gray-700 active:bg-gray-600 text-lg font-semibold transition-colors border border-gray-700/50"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="h-12 w-12 mx-auto flex items-center justify-center rounded-full bg-gray-800/80 hover:bg-gray-700 active:bg-gray-600 text-lg font-semibold transition-colors border border-gray-700/50"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 w-12 mx-auto flex items-center justify-center rounded-full bg-gray-800/40 hover:bg-gray-700/50 text-xs font-medium text-gray-400 transition-colors"
          >
            Del
          </button>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> Switch Account
        </button>
      </Card>
    </div>
  );
};
