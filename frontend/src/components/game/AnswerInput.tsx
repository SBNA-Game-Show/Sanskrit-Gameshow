import React from "react";
import Input from "../common/Input";
import Button from "../common/Button";

interface AnswerInputProps {
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  canSubmit: boolean; // general control flag
  isMyTeam: boolean;  // if current team is active
  teamName?: string;
  strikes?: number;
}

const AnswerInput: React.FC<AnswerInputProps> = ({
  answer,
  onAnswerChange,
  onSubmit,
  canSubmit,
  isMyTeam,
  teamName,
  strikes = 0,
}) => {
  const inputEnabled = canSubmit && isMyTeam;

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputEnabled && answer.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="glass-card p-4 flex-1">
      <div className="text-center mb-4">
        {inputEnabled ? (
          <h3 className="text-lg font-semibold text-green-300 mb-2">
            🎯 Your team has control!
          </h3>
        ) : (
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            ⏳ Waiting for your team’s turn...
          </h3>
        )}
      </div>

      <div className="space-y-3">
        <Input
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            inputEnabled ? "Enter your answer..." : "Wait for your turn..."
          }
          className={`w-full ${
            inputEnabled
              ? "border-green-400 bg-green-50/5"
              : "border-slate-400 bg-slate-50/5 opacity-60"
          }`}
          disabled={!inputEnabled}
          autoFocus={inputEnabled}
        />

        {inputEnabled && (
          <Button
            onClick={onSubmit}
            disabled={!answer.trim()}
            variant={answer.trim() ? "success" : "secondary"}
            className="w-full"
          >
            Submit Answer
          </Button>
        )}
      </div>

      <div className="mt-3 text-center">
        {inputEnabled ? (
          <p className="text-xs text-green-200">
            Strike {strikes}/3 • Enter your answer above
          </p>
        ) : (
          <p className="text-xs text-gray-400">
            You can't submit right now. Wait for your turn.
          </p>
        )}
      </div>
    </div>
  );
};

export default AnswerInput;
