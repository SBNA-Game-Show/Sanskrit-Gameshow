import React, { useState } from "react";

interface CopyGameCodeProps {
  gameCode: string;
}

const CopyGameCode: React.FC<CopyGameCodeProps> = ({ gameCode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(gameCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="mb-8">
      <p className="text-lg text-slate-600 mb-2">
        Share this code with contestants:
      </p>
      <div className="flex items-center justify-center gap-3">
        <div
          data-testid="game-code"
          className="text-5xl font-mono font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse"
        >
          {gameCode}
        </div>
        <button
          data-testid="copy-code"
          onClick={handleCopy}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 ${
            copied
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
          title="Copy game code"
        >
          {copied ? "Copied!" : "Copy Code"}
        </button>
      </div>
      <p className="text-sm text-slate-400 mt-4">
        ⚠️ Each question allows only 1 attempt!
      </p>
    </div>
  );
};

export default CopyGameCode;
