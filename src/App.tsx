import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import "./App.css";

type Team = "red" | "white";
type GameType = "5" | "7" | "8";

type Player = {
  id: number;
  name: string;
  team: Team;
  x: number;
  y: number;
};

type SessionRecord = {
  id: string;
  title: string;
  date: string;
  gameType: GameType;
  locked: boolean;
  redScore: number;
  whiteScore: number;
  players: Player[];
};

const STORAGE_KEY = "lineup8s-session-history-v1";

const regularPlayers: string[] = [
  "Hardik",
  "Mez",
  "Harj",
  "Suj",
  "Abi",
  "Arnie",
  "Callum",
  "Prem",
  "Shyam",
  "Kunal",
  "Pranav",
  "Josh",
  "Kiran",
  "Pranny",
  "Sukh",
  "Dil",
  "Sandeep",
  "Amraj",
];

const gameTypeOptions: Record<
  GameType,
  { label: string; totalPlayers: number; perTeam: number }
> = {
  "5": { label: "5-a-side", totalPlayers: 10, perTeam: 5 },
  "7": { label: "7-a-side", totalPlayers: 14, perTeam: 7 },
  "8": { label: "8-a-side", totalPlayers: 16, perTeam: 8 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function shuffleNames(names: string[]): string[] {
  const arr = [...names];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

function getDefaultNames(gameType: GameType): string[] {
  return regularPlayers.slice(0, gameTypeOptions[gameType].totalPlayers);
}

function buildPlayers(names: string[], gameType: GameType): Player[] {
  const shuffled = shuffleNames(names);
  const perTeam = gameTypeOptions[gameType].perTeam;

  const topYs =
    perTeam === 5
      ? [110, 180, 250, 320, 390]
      : perTeam === 7
      ? [100, 160, 220, 280, 340, 400, 460]
      : [95, 145, 195, 245, 295, 345, 395, 445];

  const bottomYs =
    perTeam === 5
      ? [500, 570, 640, 710, 780]
      : perTeam === 7
      ? [390, 450, 510, 570, 630, 690, 750]
      : [385, 435, 485, 535, 585, 635, 685, 735];

  const topXs =
    perTeam === 5
      ? [250, 150, 350, 190, 310]
      : perTeam === 7
      ? [250, 150, 350, 120, 380, 190, 310]
      : [250, 150, 350, 120, 380, 170, 330, 250];

  const bottomXs =
    perTeam === 5
      ? [250, 150, 350, 190, 310]
      : perTeam === 7
      ? [250, 150, 350, 120, 380, 190, 310]
      : [250, 150, 350, 120, 380, 170, 330, 250];

  return shuffled.map((name, index) => {
    if (index < perTeam) {
      return {
        id: index + 1,
        name,
        team: "red",
        x: topXs[index],
        y: topYs[index],
      };
    }

    const i = index - perTeam;
    return {
      id: index + 1,
      name,
      team: "white",
      x: bottomXs[i],
      y: bottomYs[i],
    };
  });
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function App() {
  const [step, setStep] = useState<"setup" | "pitch">("setup");
  const [gameType, setGameType] = useState<GameType>("8");
  const [selectedNames, setSelectedNames] = useState<string[]>(
    getDefaultNames("8")
  );
  const [customName, setCustomName] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [locked, setLocked] = useState<boolean>(false);
  const [redScore, setRedScore] = useState<string>("0");
  const [whiteScore, setWhiteScore] = useState<string>("0");
  const [sessionTitle, setSessionTitle] = useState<string>("This Week");
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const pitchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as SessionRecord[];
      if (Array.isArray(parsed)) {
        setHistory(parsed);
      }
    } catch {
      // ignore corrupt local storage
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const config = gameTypeOptions[gameType];
  const isValidCount = selectedNames.length === config.totalPlayers;
  const redCount = players.filter((p) => p.team === "red").length;
  const whiteCount = players.filter((p) => p.team === "white").length;

  function handleGameTypeChange(nextType: GameType) {
    setGameType(nextType);
    setSelectedNames(getDefaultNames(nextType));
    setCustomName("");
  }

  function toggleRegularPlayer(name: string) {
    const exists = selectedNames.includes(name);

    if (exists) {
      setSelectedNames(selectedNames.filter((n) => n !== name));
      return;
    }

    if (selectedNames.length >= config.totalPlayers) return;
    setSelectedNames([...selectedNames, name]);
  }

  function addCustomName() {
    const cleaned = customName.trim();
    if (!cleaned) return;

    const formatted =
      cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();

    if (selectedNames.includes(formatted)) {
      setCustomName("");
      return;
    }

    if (selectedNames.length >= config.totalPlayers) return;

    setSelectedNames([...selectedNames, formatted]);
    setCustomName("");
  }

  function removeSelectedName(name: string) {
    setSelectedNames(selectedNames.filter((n) => n !== name));
  }

  function startBoard() {
    if (!isValidCount) return;
    setPlayers(buildPlayers(selectedNames, gameType));
    setStep("pitch");
    setLocked(false);
    setRedScore("0");
    setWhiteScore("0");
    setSessionTitle(`Session ${history.length + 1}`);
  }

  function reshuffleTeams() {
    if (locked) return;
    setPlayers(buildPlayers(selectedNames, gameType));
    setDraggingId(null);
  }

  function goBack() {
    setStep("setup");
    setPlayers([]);
    setDraggingId(null);
    setLocked(false);
  }

  async function saveAsImage() {
    if (!pitchRef.current) return;

    const canvas = await html2canvas(pitchRef.current, {
      backgroundColor: null,
      scale: 2,
    });

    const link = document.createElement("a");
    link.download = `${sessionTitle || "lineup"}-${gameType}-aside.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function saveSession() {
    if (players.length === 0) return;

    const record: SessionRecord = {
      id: `${Date.now()}`,
      title: sessionTitle.trim() || `Session ${history.length + 1}`,
      date: getTodayLabel(),
      gameType,
      locked,
      redScore: Number(redScore) || 0,
      whiteScore: Number(whiteScore) || 0,
      players,
    };

    setHistory([record, ...history]);
  }

  function loadSession(session: SessionRecord) {
    setGameType(session.gameType);
    setPlayers(session.players);
    setSelectedNames(session.players.map((player) => player.name));
    setSessionTitle(session.title);
    setRedScore(String(session.redScore));
    setWhiteScore(String(session.whiteScore));
    setLocked(session.locked);
    setStep("pitch");
  }

  function deleteSession(id: string) {
    setHistory(history.filter((session) => session.id !== id));
  }

  function handleDropOnPitch(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (draggingId === null || locked) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 30, rect.width - 30);
    const y = clamp(e.clientY - rect.top, 30, rect.height - 30);
    const halfway = rect.height / 2;
    const nextTeam: Team = y < halfway ? "red" : "white";

    setPlayers(
      players.map((player) =>
        player.id === draggingId
          ? { ...player, x, y, team: nextTeam }
          : player
      )
    );

    setDraggingId(null);
  }

  if (step === "setup") {
    return (
      <div className="app-shell">
        <div className="setup-page">
          <div className="setup-card">
            <h1>Lineup Builder</h1>
            <p className="setup-copy">
              Choose a format, select players, generate teams, then save the session and score for future weeks.
            </p>

            <div className="format-row">
              {(["5", "7", "8"] as GameType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={
                    gameType === type
                      ? "format-button active"
                      : "format-button"
                  }
                  onClick={() => handleGameTypeChange(type)}
                >
                  {gameTypeOptions[type].label}
                  <span>{gameTypeOptions[type].totalPlayers} players</span>
                </button>
              ))}
            </div>

            <div className="names-header">
              <h2>Select players</h2>
              <span>
                Pick exactly <strong>{config.totalPlayers}</strong> players
              </span>
            </div>

            <div className="regular-players-grid">
              {regularPlayers.map((name) => {
                const selected = selectedNames.includes(name);
                const disabled =
                  !selected && selectedNames.length >= config.totalPlayers;

                return (
                  <button
                    key={name}
                    type="button"
                    className={selected ? "player-chip selected" : "player-chip"}
                    onClick={() => toggleRegularPlayer(name)}
                    disabled={disabled}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            <div className="custom-name-row">
              <input
                className="custom-name-input"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Add a new player name"
              />
              <button
                type="button"
                className="secondary-button"
                onClick={addCustomName}
              >
                Add name
              </button>
            </div>

            <div className="selected-names-box">
              {selectedNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="selected-name-tag"
                  onClick={() => removeSelectedName(name)}
                >
                  {name} ×
                </button>
              ))}
            </div>

            <div className="status-row">
              <div className={isValidCount ? "status-pill ok" : "status-pill warn"}>
                {selectedNames.length} / {config.totalPlayers} players
              </div>
              <div className="status-hint">
                Teams will be shuffled into {config.perTeam} vs {config.perTeam}
              </div>
            </div>

            <button
              className="primary-button"
              onClick={startBoard}
              disabled={!isValidCount}
            >
              Generate teams
            </button>

            <div className="history-panel">
              <div className="history-header">
                <h2>Saved sessions</h2>
                <span>{history.length} saved</span>
              </div>

              {history.length === 0 ? (
                <p className="history-empty">No saved sessions yet.</p>
              ) : (
                <div className="history-list">
                  {history.map((session) => (
                    <div key={session.id} className="history-card">
                      <div>
                        <strong>{session.title}</strong>
                        <div className="history-meta">
                          {gameTypeOptions[session.gameType].label} • {session.date}
                        </div>
                        <div className="history-score">
                          Red {session.redScore} - {session.whiteScore} White
                        </div>
                      </div>
                      <div className="history-actions">
                        <button
                          type="button"
                          className="secondary-button small-button"
                          onClick={() => loadSession(session)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="secondary-button small-button danger-button"
                          onClick={() => deleteSession(session.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="pitch-page">
        <div className="topbar">
          <div>
            <h1>{config.label} team board</h1>
            <p>
              {locked
                ? "Teams are locked. You can save the result or export the image."
                : "Drag a player above or below halfway to switch team colour."}
            </p>
          </div>

          <div className="topbar-actions">
            <div className="team-count red-count">Red: {redCount}</div>
            <div className="team-count white-count">White: {whiteCount}</div>
            <button className="secondary-button" onClick={saveAsImage}>
              Save PNG
            </button>
            <button
              className={locked ? "secondary-button lock-button locked" : "secondary-button lock-button"}
              onClick={() => setLocked(!locked)}
            >
              {locked ? "Unlock teams" : "Lock teams"}
            </button>
            <button className="secondary-button" onClick={reshuffleTeams}>
              Reshuffle
            </button>
            <button className="secondary-button" onClick={goBack}>
              Back
            </button>
          </div>
        </div>

        <div className="session-bar">
          <input
            className="session-input"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="Session title"
          />
          <div className="score-box">
            <span>Red</span>
            <input
              type="number"
              min="0"
              value={redScore}
              onChange={(e) => setRedScore(e.target.value)}
            />
          </div>
          <div className="score-dash">-</div>
          <div className="score-box">
            <span>White</span>
            <input
              type="number"
              min="0"
              value={whiteScore}
              onChange={(e) => setWhiteScore(e.target.value)}
            />
          </div>
          <button className="primary-button save-session-button" onClick={saveSession}>
            Save session
          </button>
        </div>

        <div
          ref={pitchRef}
          className="vertical-pitch"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnPitch}
        >
          <div className="halfway-line"></div>
          <div className="center-circle"></div>
          <div className="center-spot"></div>

          <div className="penalty-box top-box"></div>
          <div className="penalty-box bottom-box"></div>
          <div className="goal-box top-goal-box"></div>
          <div className="goal-box bottom-goal-box"></div>
          <div className="goal top-goal"></div>
          <div className="goal bottom-goal"></div>

          {players.map((player) => (
            <div
              key={player.id}
              className={player.team === "red" ? "player-marker red" : "player-marker white"}
              draggable={!locked}
              onDragStart={() => setDraggingId(player.id)}
              style={{
                left: `${player.x}px`,
                top: `${player.y}px`,
                cursor: locked ? "default" : "grab",
                opacity: locked ? 0.96 : 1,
              }}
            >
              <span>{player.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
