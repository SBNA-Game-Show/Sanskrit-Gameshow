import React, { useState } from "react";
import { Game, Player, Team } from "../../types";
import { getTeamColorClasses, getTeamRoundTotal } from "../../utils/gameHelper";

interface QuestionStatus {
  firstAttemptCorrect: boolean | null;
  pointsEarned: number;
}

interface TeamPanelProps {
  game: Game;
  teamIndex: number;
  showMembers?: boolean;
  playerName?: string;
  isPlayerTeam?: boolean;
  activeBorderColor: string;
  activeBackgroundColor: string;
}

const TeamPanel: React.FC<TeamPanelProps> = ({
  game,
  teamIndex,
  showMembers = true,
  playerName,
  isPlayerTeam = false,
  activeBorderColor,
  activeBackgroundColor,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRoundHistory, setShowRoundHistory] = useState(false);
  const colorClasses = getTeamColorClasses(teamIndex);
  const [showPlayerList, setShowPlayerList] = useState(false);

  const team = game.teams[teamIndex]
  const isActive = game.teams[teamIndex].active
  const currentRound = game.currentRound
  const questionsAnswered = teamIndex === 0 ? game.gameState.questionsAnswered.team1 : game.gameState.questionsAnswered.team2
  const questionData = teamIndex === 0 ? game.gameState.questionData["team1"] : game.gameState.questionData["team2"]
  const allTeams = game.teams
  const players = game.players

  const getCurrentRoundData = () => {
    if (currentRound === 0) {
      const answered = questionsAnswered > 0;
      return [
        {
          firstAttemptCorrect: answered ? team.currentRoundScore > 0 : null,
          pointsEarned: team.currentRoundScore,
        },
      ];
    }
    switch (currentRound) {
      case 1:
        return questionData.round1;
      case 2:
        return questionData.round2;
      case 3:
        return questionData.round3;
      case 4:
        return questionData.round4;
      default:
        return questionData.round1;
    }
  };

  const renderQuestionStatus = (
    questionStatus: QuestionStatus,
    questionNumber: number,
    isCurrentRoundActive: boolean = false
  ) => {
    let display = "";
    let bgColor = "";
    let textColor = "";

    if (questionStatus.firstAttemptCorrect === true) {
      display = questionStatus.pointsEarned.toString();
      bgColor = "bg-green-500";
      textColor = "text-white";
    } else if (questionStatus.firstAttemptCorrect === false) {
      display = "0";
      bgColor = "bg-red-500";
      textColor = "text-white";
    } else {
      display = questionNumber.toString();
      if (
        isCurrentRoundActive &&
        questionNumber === questionsAnswered + 1 &&
        isActive
      ) {
        bgColor = "bg-yellow-500";
        textColor = "text-black";
      } else {
        bgColor = "bg-gray-600";
        textColor = "text-gray-300";
      }
    }

    return (
      <div className="flex flex-col items-center">
        <div
          className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${bgColor} ${textColor} ${
            isCurrentRoundActive &&
            questionNumber === questionsAnswered + 1 &&
            isActive
              ? "animate-pulse"
              : ""
          }`}
        >
          {display}
        </div>
      </div>
    );
  };

  const didTeamWinRound = (roundNum: number, roundData: QuestionStatus[]) => {
    if (allTeams.length < 2) return false;

    const thisTeamScore = roundData.reduce((sum, q) => sum + q.pointsEarned, 0);
    const otherTeam = allTeams.find((t) => t.id !== team.id);
    if (!otherTeam) return false;

    const otherTeamScore = otherTeam.roundScores
      ? otherTeam.roundScores[roundNum - 1] || 0
      : 0;
    return thisTeamScore > otherTeamScore;
  };

  const renderRoundSummary = (
    roundNum: number,
    roundData: QuestionStatus[]
  ) => {
    const roundTotal = roundData.reduce((sum, q) => sum + q.pointsEarned, 0);
    const isRoundWinner = didTeamWinRound(roundNum, roundData);

    return (
      <div
        className={`bg-[#FEFCF0] rounded shadow-xl p-2 mb-2 transition-all ${
          isRoundWinner
            ? "border-4 border-yellow-400 shadow-lg shadow-yellow-400/40"
            : "border-gray-500/30"
        }`}
      >
        <h5 className="text-xs font-bold text-gray-300 mb-1 text-center">
          Round {roundNum}
        </h5>

        <div className="flex justify-center gap-1 mb-1">
          {roundData.map((questionStatus, idx) =>
            renderQuestionStatus(questionStatus, idx + 1, false)
          )}
        </div>

        <div className="text-center">
          <div
            className={`text-sm font-bold ${
              isRoundWinner ? "text-yellow-300" : "text-gray-200"
            }`}
          >
            {roundTotal} pts
          </div>
        </div>
      </div>
    );
  };

  const currentRoundData = getCurrentRoundData();
  const teamMembers = players
    .filter((p) => p.teamId === team.id)
    .map((p) => p.name);

  // Mobile compact view
  const mobileCompactView = (
    <div
      className={`relative rounded p-3 transition-all ${
        isActive ? `border-2` : "border border-gray-300"
      } ${isPlayerTeam ? "border-yellow-400/50 bg-yellow-400/10" : ""}`}
      style={
        isActive
          ? {
              borderColor: activeBorderColor,
              borderWidth: "2px",
              borderStyle: "solid",
              backgroundColor: activeBackgroundColor ?? "#FFFFFF",
            }
          : {
              backgroundColor: "#FFFFFF",
            }
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-bold mb-1 flex items-center gap-1">
            {team.name}
            {/* {isPlayerTeam && (
              <span className="text-yellow-400 text-xs">👤</span>
            )} */}
          </h3>
          <div className="text-xl font-bold text-gray-900">
            {team.currentRoundScore || 0} pts
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg
            className={`w-5 h-5 transition-transform ${
              isExpanded ? "rotate-180" : ""
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

      {/* Expanded overlay */}
      {isExpanded && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsExpanded(false)}
          />
          <div className="fixed inset-x-4 top-20 max-h-[calc(100vh-5rem)] bg-white rounded-lg shadow-2xl z-50 overflow-y-auto p-4">
            {" "}
            <div className="flex justify-center items-center mb-4 relative">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {team.name}
                {/* {isPlayerTeam && <span className="text-yellow-400">👤</span>} */}
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute right-0 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {/* {isPlayerTeam && playerName && (
              <div className="text-xs text-yellow-600 mb-2 font-medium text-center">
                {playerName}
              </div>
            )} */}
            <div
              className={`text-2xl font-bold mb-4 ${colorClasses.primary} text-center`}
            >
              {team.currentRoundScore || 0}
            </div>
            <div
              className={`bg-[#FEFCF0] rounded shadow-xl p-2 mb-3 border-red-500/30 ${
                currentRound === 4 ? "pb-3" : ""
              }`}
            >
              <h4 className="text-sm font-bold text-red-300 mb-2 text-center">
                {currentRound === 0 ? "Toss-up Round" : `Round ${currentRound}`}
              </h4>

              {currentRound === 4 ? (
                <div className="flex flex-col items-center gap-1 mb-2">
                  <div className="flex justify-center gap-1">
                    {currentRoundData
                      .slice(0, 4)
                      .map((questionStatus, idx) =>
                        renderQuestionStatus(questionStatus, idx + 1, true)
                      )}
                  </div>
                  <div className="flex justify-center gap-1">
                    {currentRoundData
                      .slice(4, 7)
                      .map((questionStatus, idx) =>
                        renderQuestionStatus(questionStatus, idx + 5, true)
                      )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center gap-1 mb-2">
                  {currentRoundData.map((questionStatus, idx) =>
                    renderQuestionStatus(questionStatus, idx + 1, true)
                  )}
                </div>
              )}
            </div>
            {currentRound >= 2 && (
              <button
                data-testid={`view-team${teamIndex + 1}-round-history`}
                onClick={() => setShowRoundHistory(true)}
                className="w-full mb-3 bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-2 text-sm font-medium transition-colors"
              >
                View Round History
              </button>
            )}
            <div className="mb-4 pt-10 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-black mb-3 text-center">
                Team Members
              </h4>
              <div className="space-y-2">
                {teamMembers
                  .filter((member) => member.trim() !== "")
                  .map((member) => (
                    <div
                      key={member}
                      className="flex items-center justify-center p-2 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span className="text-center text-gray-800 font-medium">
                        {member}
                      </span>
                      {playerName === member && (
                        <span className="ml-2 text-yellow-500 text-sm font-semibold">
                          👤
                        </span>
                      )}
                    </div>
                  ))}
              </div>

              {teamMembers.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No team members found
                </div>
              )}
            </div>
            <div className="bg-white text-black rounded px-2 py-1 text-center border-2 border-gray-300">
              <div className="text-xl font-bold">{getTeamRoundTotal(team)}</div>
              <div className="text-xs">Total Score</div>
            </div>
          </div>
          {/* Round History Popup */}
          {showRoundHistory && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50"
                onClick={() => setShowRoundHistory(false)}
              />
              <div className="fixed inset-x-4 top-20 max-h-[calc(100vh-5rem)] bg-white rounded-lg shadow-2xl z-50 overflow-y-auto p-4">
                {" "}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Round History</h3>
                  <button
                    data-testid="close-round-history-button"
                    onClick={() => setShowRoundHistory(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                {currentRound >= 2 && (
                  <div className="mb-3">
                    {renderRoundSummary(1, questionData.round1)}
                  </div>
                )}
                {currentRound >= 3 && (
                  <div className="mb-3">
                    {renderRoundSummary(2, questionData.round2)}
                  </div>
                )}
                {currentRound >= 4 && (
                  <div className="mb-3">
                    {renderRoundSummary(3, questionData.round3)}
                  </div>
                )}
              </div>
            </>
          )}
          {showPlayerList && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50"
                onClick={() => setShowPlayerList(false)}
              />
              <div className="fixed inset-x-4 top-20 bottom-20 bg-white rounded-lg shadow-2xl z-50 overflow-y-auto p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">
                    Team Members - {team.name}
                  </h3>
                  <button
                    onClick={() => setShowPlayerList(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3">
                  {teamMembers
                    .filter((member) => member.trim() !== "")
                    .map((member, index) => (
                      <div
                        key={member}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="font-medium text-gray-800">
                          {member}
                        </span>
                        {playerName === member && (
                          <span className="text-yellow-500 text-sm font-semibold bg-yellow-50 px-2 py-1 rounded">
                            👤
                          </span>
                        )}
                      </div>
                    ))}
                </div>

                {teamMembers.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No team members found
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );

  // Desktop view (original)
  const desktopView = (
    <div
      className={`rounded p-3 h-full flex flex-col transition-all 
      ${isActive ? `border-2 border-red-500` : "border border-gray-300"} 
      ${isPlayerTeam ? "border-yellow-400/50 bg-yellow-400/10" : ""}`}
      style={
        isActive
          ? {
              borderColor: activeBorderColor,
              borderWidth: "2px",
              borderStyle: "solid",
              backgroundColor: activeBackgroundColor ?? "#FFFFFF",
            }
          : {
              backgroundColor: "#FFFFFF",
            }
      }
    >
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
          {team.name}
          {/* {isPlayerTeam && <span className="text-yellow-400">👤</span>} */}
        </h3>
        {/* {isPlayerTeam && playerName && (
          <div className="text-xs text-yellow-300 mb-2 font-medium">
            {playerName}
          </div>
        )} */}
        <div
          className={`text-2xl font-bold mb-1 animate-score ${colorClasses.primary}`}
        >
          {team.currentRoundScore || 0}
        </div>
      </div>

      {/* Active round summary */}
      <div
        className={`bg-[#FEFCF0] rounded shadow-xl p-2 mb-3 border-red-500/30 ${
          currentRound === 4 ? "pb-3" : ""
        }`}
      >
        <h4 className="text-sm font-bold text-red-300 mb-2 text-center">
          {currentRound === 0 ? "Toss-up Round" : `Round ${currentRound}`}
        </h4>

        {currentRound === 4 ? (
          <div className="flex flex-col items-center gap-1 mb-2">
            <div className="flex justify-center gap-1">
              {currentRoundData
                .slice(0, 4)
                .map((questionStatus, idx) =>
                  renderQuestionStatus(questionStatus, idx + 1, true)
                )}
            </div>
            <div className="flex justify-center gap-1">
              {currentRoundData
                .slice(4, 7)
                .map((questionStatus, idx) =>
                  renderQuestionStatus(questionStatus, idx + 5, true)
                )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-1 mb-2">
            {currentRoundData.map((questionStatus, idx) =>
              renderQuestionStatus(questionStatus, idx + 1, true)
            )}
          </div>
        )}
      </div>

      {currentRound >= 2 && (
        <button
          data-testid={`view-team${teamIndex + 1}-round-history`}
          onClick={() => setShowRoundHistory(true)}
          className="w-full mb-3 bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-2 text-sm font-medium transition-colors"
        >
          View Round History
        </button>
      )}

      <div className="mb-3 pt-2">
        <h4 className="text-xs font-semibold text-black mb-2 text-center">
          All Team Members
        </h4>
        <div className="space-y-1 pt-1">
          {teamMembers
            .filter((member) => member.trim() !== "")
            .map((member) => (
              <div
                key={member}
                className="text-center  bg-[#FEFCF0] shadow-lg rounded h-6 "
              >
                {member}
                {playerName === member && "👤"}
              </div>
            ))}
        </div>
      </div>

      <div className="flex-grow"></div>

      <div className="bg-white text-black rounded px-2 py-1 text-center">
        <div className="text-xl font-bold">{getTeamRoundTotal(team)}</div>
        <div className="text-xs">Total Score</div>
      </div>

      {/* Round History Popup */}
      {showRoundHistory && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowRoundHistory(false)}
          />
          <div className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-96 top-20 max-h-[calc(100vh-5rem)] bg-white rounded-lg shadow-2xl z-50 overflow-y-auto p-4">
            {" "}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Round History</h3>
              <button
                data-testid="close-round-history-button"
                onClick={() => setShowRoundHistory(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {currentRound >= 2 && (
              <div className="mb-3">
                {renderRoundSummary(1, questionData.round1)}
              </div>
            )}
            {currentRound >= 3 && (
              <div className="mb-3">
                {renderRoundSummary(2, questionData.round2)}
              </div>
            )}
            {currentRound >= 4 && (
              <div className="mb-3">
                {renderRoundSummary(3, questionData.round3)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="block md:hidden">{mobileCompactView}</div>
      <div className="hidden md:block h-full">{desktopView}</div>
    </>
  );
};

export default TeamPanel;
