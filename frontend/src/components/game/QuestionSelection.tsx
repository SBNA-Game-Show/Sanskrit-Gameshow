// list of data-testid
//round-select-combobox - click the combobox to view options (rounds)
//round-option-${option.value} - 0-toss up, 1-round 1, 2-round 2, 3-round 3, 4-lightning round
//{question.question} - the id for each each is the entire question text, use this to check/uncheck specific questions
//random-select-button - randomly selects questions for each round.
//confirm-selections-button - save and go back to the game code area

//note - edit-questions-button in hostgamepage needs to be clicked to go to this component. It is located under the game code area

// bugs/things to test
// - Sometimes when the host rejoins the game it causes an unexpected game state.

//full playthrough test needs to be updated to work with questionselection.
//note - scrolling is needed to view some of the questions in questionselection.

import { Question } from "@types";
import React, { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface QuestionSelectionProps {
  questions: Question[];
  initialSelectedIds?: string[];
  initialTossUpId?: string | null;
  onConfirm: (
    selectedQuestionIds: string[],
    tossUpQuestionId: string | null
  ) => void;
}

const QuestionSelection: React.FC<QuestionSelectionProps> = ({
  questions,
  initialSelectedIds = [],
  initialTossUpId = null,
  onConfirm,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Option | null>(null);
  const [search, setSearch] = useState("");

  // Store selections per round
  const [roundSelections, setRoundSelections] = useState<{
    [key: string]: Set<string>;
  }>({
    "0": new Set(), // For Toss-Up
    "1": new Set(),
    "2": new Set(),
    "3": new Set(),
    "4": new Set(),
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to populate state from props (for Editing mode)
  useEffect(() => {
    if (initialSelectedIds.length > 0 || initialTossUpId) {
      const newSelections: { [key: string]: Set<string> } = {
        "0": new Set(),
        "1": new Set(),
        "2": new Set(),
        "3": new Set(),
        "4": new Set(),
      };

      // Handle Toss Up
      if (initialTossUpId) {
        newSelections["0"].add(initialTossUpId);
      }

      // Handle other questions
      initialSelectedIds.forEach((id) => {
        const q = questions.find((q) => q._id === id);
        if (q) {
          // If it's round 4, it goes to 4. Otherwise map 1,2,3.
          // Note: Logic in randomizer puts logic in specific buckets.
          // We map based on the question's inherent round property.
          const roundKey = q.round.toString();
          if (newSelections[roundKey]) {
            newSelections[roundKey].add(id);
          }
        }
      });

      setRoundSelections(newSelections);
    }
  }, [initialSelectedIds, initialTossUpId, questions]);

  const options: Option[] = [
    { value: "0", label: "Toss-Up" },
    { value: "1", label: "Round 1" },
    { value: "2", label: "Round 2" },
    { value: "3", label: "Round 3" },
    { value: "4", label: "Lightning Round" },
  ];

  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: Option) => {
    setSelected(option);
    setSearch("");
    setIsOpen(false);
  };

  const handleCheckboxChange = (questionId: string) => {
    if (!selected) return;

    const currentRoundSelections = new Set(roundSelections[selected.value]);
    // Max questions: 1 for Toss-Up, 7 for Round 4, 6 for others
    const maxQuestions =
      selected.value === "4" ? 7 : selected.value === "0" ? 1 : 6;

    if (currentRoundSelections.has(questionId)) {
      currentRoundSelections.delete(questionId);
    } else {
      if (currentRoundSelections.size < maxQuestions) {
        currentRoundSelections.add(questionId);
      }
    }

    setRoundSelections({
      ...roundSelections,
      [selected.value]: currentRoundSelections,
    });
  };

  const handleRandomSelect = () => {
    const newSelections: { [key: string]: Set<string> } = {
      "0": new Set(),
      "1": new Set(),
      "2": new Set(),
      "3": new Set(),
      "4": new Set(),
    };

    // Separate Round 2 questions for Toss-Up and Round 2 selection
    const round2Questions = questions.filter((q) => q.round === 2);
    const shuffledRound2 = [...round2Questions].sort(() => Math.random() - 0.5);

    // Select 1 for Toss-Up
    const tossUp = shuffledRound2.slice(0, 1);
    if (tossUp[0]) {
      newSelections["0"].add(tossUp[0]._id);
    }

    // Select 6 for Round 2 (from the rest)
    const round2 = shuffledRound2.slice(1, 7);
    round2.forEach((q) => newSelections["2"].add(q._id));

    // For other rounds
    options.forEach((option) => {
      if (option.value === "0" || option.value === "2") return; // Skip, already handled

      const roundQuestions = questions.filter(
        (q) => q.round === parseInt(option.value)
      );
      const required = option.value === "4" ? 7 : 6;

      const shuffled = [...roundQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, required);

      selected.forEach((q) => newSelections[option.value].add(q._id));
    });

    setRoundSelections(newSelections);
  };

  const handleConfirm = () => {
    // Collect all selected question IDs from all rounds *except* Toss-Up
    const allSelectedIds: string[] = [];
    const tossUpQuestionId = Array.from(roundSelections["0"])[0] || null;

    Object.keys(roundSelections).forEach((roundKey) => {
      if (roundKey !== "0") {
        allSelectedIds.push(...Array.from(roundSelections[roundKey]));
      }
    });

    // Pass the selected IDs and the single toss-up ID back to parent
    onConfirm(allSelectedIds, tossUpQuestionId);
  };

  // Get Toss-Up and Round 2 selections for filtering
  const tossUpId = Array.from(roundSelections["0"])[0] || null;
  const round2Ids = roundSelections["2"];

  // Filter questions by selected round, handling Toss-Up/Round 2 overlap
  const filteredQuestions = selected
    ? questions.filter((q) => {
        if (selected.value === "0") {
          // Toss-Up: Show Round 2 questions NOT selected for Round 2
          return q.round === 2 && !round2Ids.has(q._id);
        }
        if (selected.value === "2") {
          // Round 2: Show Round 2 questions NOT selected for Toss-Up
          return q.round === 2 && q._id !== tossUpId;
        }
        // Default: Show questions for the selected round
        return q.round === parseInt(selected.value);
      })
    : [];

  const maxQuestions =
    selected?.value === "4" ? 7 : selected?.value === "0" ? 1 : 6;
  const currentRoundSelections = selected
    ? roundSelections[selected.value]
    : new Set();

  // Check if all rounds have the required number of questions selected
  const isTossUpComplete = roundSelections["0"].size === 1;
  const isRound1Complete = roundSelections["1"].size === 6;
  const isRound2Complete = roundSelections["2"].size === 6;
  const isRound3Complete = roundSelections["3"].size === 6;
  const isRound4Complete = roundSelections["4"].size === 7;
  const canConfirm =
    isTossUpComplete &&
    isRound1Complete &&
    isRound2Complete &&
    isRound3Complete &&
    isRound4Complete;

  // Get completion status for display
  const getRoundStatus = (roundValue: string) => {
    const required = roundValue === "4" ? 7 : roundValue === "0" ? 1 : 6;
    const selected = roundSelections[roundValue].size;
    return { selected, required, isComplete: selected === required };
  };

  return (
    <div className="min-h-screen bg-[#f2d2b6] p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center bg-white rounded-lg font-semibold text-3xl p-6 mb-6 text-black shadow-xl">
          Select Questions for Each Round
        </div>

        {/* Main Content Area */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-6">
          <div className="flex justify-between items-start mb-6">
            {/* Combobox */}
            <div ref={containerRef} className="relative w-64">
              <div className="relative">
                <input
                  type="text"
                  data-testid="round-select-combobox"
                  value={isOpen ? search : selected?.label || ""}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setIsOpen(true);
                  }}
                  onFocus={() => setIsOpen(true)}
                  placeholder="Select Round"
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                  {filtered.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500 text-sm">
                      No results found
                    </div>
                  ) : (
                    filtered.map((option) => {
                      const status = getRoundStatus(option.value);
                      return (
                        <button
                          key={option.value}
                          data-testid={`round-option-${option.value}`}
                          onClick={() => handleSelect(option)}
                          className="w-full px-4 py-3 text-left hover:bg-purple-50 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.label}</span>
                            {status.isComplete && (
                              <span className="text-green-600 text-sm">✓</span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Random Select Button */}
            <button
              data-testid="random-select-button"
              onClick={handleRandomSelect}
              className="px-4 py-2 bg-[#f2d2b6] text-black font-semibold rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center gap-2 h-12"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Random Select
            </button>
          </div>

          {/* Questions display area */}
          <div>
            {selected ? (
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-purple-50 sticky top-0">
                        <tr>
                          <th className="w-20 px-6 py-4 text-left text-sm font-bold text-gray-700">
                            Select
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                            Question
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredQuestions.map((question) => (
                          <tr
                            key={question._id}
                            className={`hover:bg-purple-50 transition-colors ${
                              currentRoundSelections.has(question._id)
                                ? "bg-purple-50"
                                : ""
                            }`}
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                data-testid={question.question}
                                checked={currentRoundSelections.has(
                                  question._id
                                )}
                                onChange={() =>
                                  handleCheckboxChange(question._id)
                                }
                                disabled={
                                  !currentRoundSelections.has(question._id) &&
                                  currentRoundSelections.size >= maxQuestions
                                }
                                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {question.question}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-purple-50 px-6 py-4 border-t-2 border-gray-200 flex justify-between items-center">
                  <p className="text-sm font-semibold text-gray-700">
                    Selected: {currentRoundSelections.size} / {maxQuestions}
                  </p>
                  {currentRoundSelections.size === maxQuestions && (
                    <span className="text-green-600 text-sm font-medium">
                      Round Complete
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-lg font-medium">
                  Select a round to view questions
                </p>
              </div>
            )}
          </div>

          {/* Confirm Button */}
          <div className="mt-6 flex justify-end">
            <button
              data-testid="confirm-selections-button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`px-8 py-3 rounded-lg font-semibold text-black transition-all transform ${
                canConfirm
                  ? "bg-[#f2d2b6] hover:scale-105 shadow-lg"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {canConfirm
                ? "Confirm All Selections"
                : "Complete all rounds to confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionSelection;
