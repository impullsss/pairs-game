import { useState, useEffect } from "react";
import "./styles.scss";

const DEFAULT_SIZE = 4;

const COLOR_PRESET = [
  "#e63946",
  "#f77f00",
  "#fcbf49",
  "#ffd166",
  "#06d6a0",
  "#118ab2",
  "#073b4c",
  "#9b5de5",
  "#ff6b6b",
  "#6a4c93",
  "#00b4d8",
  "#8ac926",
];

function shuffle(array: any[]) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeTiles(size: number) {
  const total = size * size;
  if (total % 2 !== 0) throw new Error("Нужно четное количество ячеек");
  const pairs = total / 2;
  const colors = [];
  for (let i = 0; i < pairs; i++) {
    colors.push(COLOR_PRESET[i % COLOR_PRESET.length]);
  }
  const combined = shuffle([...colors, ...colors]);

  return combined.map((value, index) => ({
    id: index,
    value,
    revealed: false,
    matched: false,
  }));
}

export default function App() {
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [tiles, setTiles] = useState(() => makeTiles(DEFAULT_SIZE));
  const [first, setFirst] = useState<number |null>(null);
  const [second, setSecond] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  function resetGame(sz = size) {
    setTiles(makeTiles(sz));
    setFirst(null);
    setSecond(null);
    setMoves(0);
    setPairsFound(0);
    setDisabled(false);
    setSeconds(0);
    setRunning(false);
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    resetGame(size);
  }, [size]);

  useEffect(() => {
    const totalPairs = (size * size) / 2;
    if (pairsFound === totalPairs) {
      setRunning(false);
      setDisabled(true);
    }
  }, [pairsFound, size]);

  function handleTileClick(idx: number) {
    if (disabled) return;
    const tile = tiles[idx];
    if (tile.revealed || tile.matched) return;
    if (!running) setRunning(true);

    const next = tiles.slice();
    next[idx] = { ...tile, revealed: true };
    setTiles(next);

    if (first === null) {
      setFirst(idx);
      return;
    }

    setSecond(idx);
  }

  useEffect(() => {
    if (second === null) return;

    if (first === null) {
      setSecond(null);
      return;
    }

    setDisabled(true);
    setMoves((m) => m + 1);

    const checkTimeout = setTimeout(() => {
      const t1 = tiles[first];
      const t2 = tiles[second];

      if (!t1 || !t2) {
        setFirst(null);
        setSecond(null);
        setDisabled(false);
        return;
      }

      if (t1.value === t2.value) {
        const next = tiles.slice();
        next[first] = { ...t1, matched: true, revealed: true };
        next[second] = { ...t2, matched: true, revealed: true };
        setTiles(next);
        setPairsFound((p) => p + 1);
      } else {
        const next = tiles.slice();
        next[first] = { ...t1, revealed: false };
        next[second] = { ...t2, revealed: false };
        setTiles(next);
      }

      setFirst(null);
      setSecond(null);
      setDisabled(false);
    }, 500);

    return () => clearTimeout(checkTimeout);
  }, [second]);

  const total = size * size;
  const totalPairs = total / 2;
  const isWon = pairsFound === totalPairs;

  return (
    <div className="app">
      <header className="header">
        <h1>Найди пару</h1>
        <div className="controls">
          <label>
            Поле:
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            >
              <option value={2}>2×2</option>
              <option value={4}>4×4</option>
              <option value={6}>6×6</option>
            </select>
          </label>
          <button onClick={() => resetGame(size)}>Restart</button>
        </div>
      </header>

      <div className="stats">
        <div>
          Ходов: <strong>{moves}</strong>
        </div>
        <div>
          Пар:{" "}
          <strong>
            {pairsFound}/{totalPairs}
          </strong>
        </div>
        <div>
          Время:{" "}
          <strong>
            {Math.floor(seconds / 60)
              .toString()
              .padStart(2, "0")}
            :{(seconds % 60).toString().padStart(2, "0")}
          </strong>
        </div>
      </div>

      <main className="board-wrap">
        <div className={`board grid-${size}`}>
          {tiles.map((t, idx) => (
            <button
              key={t.id}
              className={`tile ${t.revealed || t.matched ? "revealed" : ""} ${
                t.matched ? "matched" : ""
              }`}
              onClick={() => handleTileClick(idx)}
              disabled={t.matched || disabled}
              aria-pressed={t.revealed || t.matched}
            >
              <div className="tile-inner">
                <div className="face face-front" />
                <div
                  className="face face-back"
                  style={{ background: t.value }}
                />
              </div>
            </button>
          ))}
        </div>

        {isWon && (
          <div className="modal">
            <div className="modal-card">
              <h2>Победа!</h2>
              <p>
                Ты открыл все плитки за <strong>{moves}</strong> ходов и{" "}
                {Math.floor(seconds / 60)}:
                {(seconds % 60).toString().padStart(2, "0")}.
              </p>
              <button onClick={() => resetGame(size)}>Играть снова</button>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <small>Реализация: React + SCSS</small>
      </footer>
    </div>
  );
}
