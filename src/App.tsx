import { useState } from "react";
import "./App.css";

type Team = "red" | "white";

type Player = {
  id: number;
  name: string;
  team: Team;
  x: number;
  y: number;
};

const initialPlayers: Player[] = [
  { id: 1, name: "Red 1", team: "red", x: 60, y: 40 },
  { id: 2, name: "Red 2", team: "red", x: 60, y: 110 },
  { id: 3, name: "Red 3", team: "red", x: 60, y: 180 },
  { id: 4, name: "Red 4", team: "red", x: 60, y: 250 },
  { id: 5, name: "Red 5", team: "red", x: 180, y: 70 },
  { id: 6, name: "Red 6", team: "red", x: 180, y: 160 },
  { id: 7, name: "Red 7", team: "red", x: 180, y: 250 },
  { id: 8, name: "Red 8", team: "red", x: 180, y: 340 },

  { id: 9, name: "White 1", team: "white", x: 690, y: 40 },
  { id: 10, name: "White 2", team: "white", x: 690, y: 110 },
  { id: 11, name: "White 3", team: "white", x: 690, y: 180 },
  { id: 12, name: "White 4", team: "white", x: 690, y: 250 },
  { id: 13, name: "White 5", team: "white", x: 570, y: 70 },
  { id: 14, name: "White 6", team: "white", x: 570, y: 160 },
  { id: 15, name: "White 7", team: "white", x: 570, y: 250 },
  { id: 16, name: "White 8", team: "white", x: 570, y: 340 },
];

export default function App() {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [newName, setNewName] = useState("");
  const [team, setTeam] = useState<Team>("red");

  const movePlayer = (id: number, x: number, y: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, x, y } : p))
    );
  };

  const addPlayer = () => {
    if (!newName.trim()) return;

    const nextId = players.length
      ? Math.max(...players.map((p) => p.id)) + 1
      : 1;

    setPlayers([
      ...players,
      {
        id: nextId,
        name: newName,
        team,
        x: team === "red" ? 100 : 650,
        y: 420,
      },
    ]);

    setNewName("");
  };

  return (
    <div className="app">
      <h1>Football Team Board</h1>

      <div className="controls">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Player name"
        />
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value as Team)}
        >
          <option value="red">Red team</option>
          <option value="white">White team</option>
        </select>
        <button onClick={addPlayer}>Add Player</button>
      </div>

      <div className="pitch">
        <div className="midline"></div>
        <div className="center-circle"></div>

        {players.map((player) => (
          <DraggablePlayer
            key={player.id}
            player={player}
            onMove={movePlayer}
          />
        ))}
      </div>
    </div>
  );
}

function DraggablePlayer({
  player,
  onMove,
}: {
  player: Player;
  onMove: (id: number, x: number, y: number) => void;
}) {
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const pitch = document.querySelector(".pitch");
    if (!pitch) return;

    const rect = pitch.getBoundingClientRect();

    const x = e.clientX - rect.left - 25;
    const y = e.clientY - rect.top - 25;

    const boundedX = Math.max(0, Math.min(x, rect.width - 50));
    const boundedY = Math.max(0, Math.min(y, rect.height - 50));

    onMove(player.id, boundedX, boundedY);
  };

  return (
    <div
      className={`player ${player.team}`}
      draggable
      onDragEnd={handleDragEnd}
      style={{ left: `${player.x}px`, top: `${player.y}px` }}
    >
      {player.name}
    </div>
  );
}
