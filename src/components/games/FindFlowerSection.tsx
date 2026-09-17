import { useEffect, useMemo, useState } from "react";

interface FindFlowerSectionProps {
  token: string | null;
  isAuthenticated: boolean;
  currentUsername?: string;
}

type GameStatus = "playing" | "won" | "lost";

interface FlowerCell {
  hasFlower: boolean;
  adjacentFlowers: number;
  isRevealed: boolean;
  isPlanted: boolean;
}

interface RankingEntry {
  id: number;
  maxScore: number;
  bestTimeSeconds: number | null;
  bestMoves: number | null;
  updatedAt: string | null;
  user: {
    id: number;
    name: string;
    username: string;
  } | null;
}

interface GameResult {
  score: number;
  timeSeconds: number;
  moves: number;
}

const ROWS = 8;
const COLS = 8;
const FLOWER_COUNT = 10;
const TOTAL_SAFE_CELLS = ROWS * COLS - FLOWER_COUNT;

const createEmptyBoard = (): FlowerCell[][] => {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      hasFlower: false,
      adjacentFlowers: 0,
      isRevealed: false,
      isPlanted: false,
    })),
  );
};

const cloneBoard = (board: FlowerCell[][]): FlowerCell[][] =>
  board.map((row) => row.map((cell) => ({ ...cell })));

const inBounds = (row: number, col: number) =>
  row >= 0 && row < ROWS && col >= 0 && col < COLS;

const forEachNeighbor = (
  row: number,
  col: number,
  callback: (neighborRow: number, neighborCol: number) => void,
) => {
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) continue;
      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;
      if (inBounds(nextRow, nextCol)) {
        callback(nextRow, nextCol);
      }
    }
  }
};

const computeAdjacentFlowers = (board: FlowerCell[][]) => {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row][col].hasFlower) {
        board[row][col].adjacentFlowers = 0;
        continue;
      }

      let nearbyFlowers = 0;
      forEachNeighbor(row, col, (neighborRow, neighborCol) => {
        if (board[neighborRow][neighborCol].hasFlower) {
          nearbyFlowers += 1;
        }
      });

      board[row][col].adjacentFlowers = nearbyFlowers;
    }
  }
};

const placeFlowers = (
  board: FlowerCell[][],
  safeRow: number,
  safeCol: number,
) => {
  const availableIndexes: number[] = [];
  for (let index = 0; index < ROWS * COLS; index += 1) {
    const row = Math.floor(index / COLS);
    const col = index % COLS;
    if (row === safeRow && col === safeCol) continue;
    availableIndexes.push(index);
  }

  for (let index = availableIndexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = availableIndexes[index];
    availableIndexes[index] = availableIndexes[swapIndex];
    availableIndexes[swapIndex] = current;
  }

  for (let index = 0; index < FLOWER_COUNT; index += 1) {
    const selected = availableIndexes[index];
    const row = Math.floor(selected / COLS);
    const col = selected % COLS;
    board[row][col].hasFlower = true;
  }

  computeAdjacentFlowers(board);
};

const revealConnectedCells = (board: FlowerCell[][], row: number, col: number) => {
  const queue: Array<[number, number]> = [[row, col]];

  while (queue.length > 0) {
    const [currentRow, currentCol] = queue.shift() as [number, number];
    const cell = board[currentRow][currentCol];

    if (cell.isRevealed || cell.isPlanted) continue;

    cell.isRevealed = true;

    if (cell.hasFlower || cell.adjacentFlowers !== 0) continue;

    forEachNeighbor(currentRow, currentCol, (neighborRow, neighborCol) => {
      const neighbor = board[neighborRow][neighborCol];
      if (!neighbor.isRevealed && !neighbor.hasFlower) {
        queue.push([neighborRow, neighborCol]);
      }
    });
  }
};

const revealAllFlowers = (board: FlowerCell[][]) => {
  for (const row of board) {
    for (const cell of row) {
      if (cell.hasFlower) {
        cell.isRevealed = true;
      }
    }
  }
};

const countRevealedSafeCells = (board: FlowerCell[][]) =>
  board.reduce((total, row) => {
    return (
      total +
      row.reduce((count, cell) => {
        if (!cell.hasFlower && cell.isRevealed) return count + 1;
        return count;
      }, 0)
    );
  }, 0);

const countPlantedCells = (board: FlowerCell[][]) =>
  board.reduce(
    (total, row) => total + row.reduce((count, cell) => count + (cell.isPlanted ? 1 : 0), 0),
    0,
  );

const computeScore = (
  elapsedSeconds: number,
  moves: number,
  plantedCells: number,
) => {
  const baseScore = 3000;
  const speedBonus = Math.max(0, 1200 - elapsedSeconds * 8);
  const precisionBonus = Math.max(
    0,
    400 - Math.abs(plantedCells - FLOWER_COUNT) * 40,
  );
  const movePenalty = moves * 3;
  return Math.max(100, baseScore + speedBonus + precisionBonus - movePenalty);
};

const getCellLabel = (cell: FlowerCell) => {
  if (!cell.isRevealed) {
    return cell.isPlanted ? "🚩" : "";
  }

  if (cell.hasFlower) return "🌸";
  if (cell.adjacentFlowers > 0) return String(cell.adjacentFlowers);
  return "";
};

export function FindFlowerSection({
  token,
  isAuthenticated,
  currentUsername,
}: FindFlowerSectionProps) {
  const [board, setBoard] = useState<FlowerCell[][]>(() => createEmptyBoard());
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [hasPlacedFlowers, setHasPlacedFlowers] = useState(false);
  const [roundStartAt, setRoundStartAt] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [latestResult, setLatestResult] = useState<GameResult | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [scoreFeedback, setScoreFeedback] = useState<string | null>(null);

  const revealedSafeCells = useMemo(() => countRevealedSafeCells(board), [board]);
  const plantedCells = useMemo(() => countPlantedCells(board), [board]);

  const loadRanking = async () => {
    setIsLoadingRanking(true);
    setRankingError(null);
    try {
      const response = await fetch("/api/find-the-flower/ranking");
      if (!response.ok) {
        setRankingError("No se pudo cargar el ranking");
        setRanking([]);
        return;
      }

      const data = await response.json();
      setRanking(Array.isArray(data) ? (data as RankingEntry[]) : []);
    } catch {
      setRankingError("No se pudo cargar el ranking");
      setRanking([]);
    } finally {
      setIsLoadingRanking(false);
    }
  };

  const submitScore = async (result: GameResult) => {
    if (!isAuthenticated || !token) {
      setScoreFeedback("Inicia sesión para guardar tu puntaje en el ranking.");
      return;
    }

    try {
      const response = await fetch("/api/find-the-flower/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          score: result.score,
          timeSeconds: result.timeSeconds,
          moves: result.moves,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setScoreFeedback(data.error || "No se pudo guardar el puntaje");
        return;
      }

      setScoreFeedback(
        data.updated
          ? "¡Nuevo puntaje guardado en el ranking!"
          : "Partida completada. Tu mejor puntaje se mantiene.",
      );
      await loadRanking();
    } catch {
      setScoreFeedback("No se pudo guardar el puntaje");
    }
  };

  useEffect(() => {
    void loadRanking();
  }, []);

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setGameStatus("playing");
    setHasPlacedFlowers(false);
    setRoundStartAt(null);
    setMoveCount(0);
    setLatestResult(null);
    setScoreFeedback(null);
  };

  const revealCell = (row: number, col: number) => {
    if (gameStatus !== "playing") return;

    const current = board[row][col];
    if (current.isRevealed || current.isPlanted) return;

    const nextBoard = cloneBoard(board);
    const nextMoveCount = moveCount + 1;

    if (!roundStartAt) {
      setRoundStartAt(Date.now());
    }

    if (!hasPlacedFlowers) {
      placeFlowers(nextBoard, row, col);
      setHasPlacedFlowers(true);
    }

    const target = nextBoard[row][col];

    if (target.hasFlower) {
      target.isRevealed = true;
      revealAllFlowers(nextBoard);
      setBoard(nextBoard);
      setMoveCount(nextMoveCount);
      setGameStatus("lost");
      return;
    }

    revealConnectedCells(nextBoard, row, col);
    const safeRevealed = countRevealedSafeCells(nextBoard);

    if (safeRevealed >= TOTAL_SAFE_CELLS) {
      revealAllFlowers(nextBoard);
      setGameStatus("won");

      const elapsedSeconds = Math.max(
        1,
        Math.floor((Date.now() - (roundStartAt || Date.now())) / 1000),
      );
      const nextPlantedCells = countPlantedCells(nextBoard);
      const score = computeScore(
        elapsedSeconds,
        nextMoveCount,
        nextPlantedCells,
      );
      const result = {
        score,
        timeSeconds: elapsedSeconds,
        moves: nextMoveCount,
      };
      setLatestResult(result);
      void submitScore(result);
    }

    setBoard(nextBoard);
    setMoveCount(nextMoveCount);
  };

  const togglePlant = (
    event: React.MouseEvent<HTMLButtonElement>,
    row: number,
    col: number,
  ) => {
    event.preventDefault();
    if (gameStatus !== "playing") return;

    const current = board[row][col];
    if (current.isRevealed) return;

    if (!current.isPlanted && plantedCells >= FLOWER_COUNT) {
      return;
    }

    const nextBoard = cloneBoard(board);
    nextBoard[row][col].isPlanted = !nextBoard[row][col].isPlanted;
    setBoard(nextBoard);
    setMoveCount((previous) => previous + 1);
  };

  const statusMessage =
    gameStatus === "won"
      ? "Ganaste. Encontraste todas las flores sin dañar el jardín."
      : gameStatus === "lost"
        ? "Apareció una flor oculta. Intenta una nueva partida."
        : "Descubre las celdas seguras. Usa banderas para marcar sospechas.";

  return (
    <section className="box find-flower-box">
      <div className="find-flower-header">
        <h2>Encuentra la flor</h2>
        <p>
          Versión ecológica de buscaminas: marca con banderas y evita abrir flores
          ocultas.
        </p>
      </div>

      <div className="find-flower-stats">
        <span className="find-flower-pill">Flores ocultas: {FLOWER_COUNT}</span>
        <span className="find-flower-pill">
          Banderas disponibles: {FLOWER_COUNT - plantedCells}
        </span>
        <span className="find-flower-pill">
          Celdas seguras: {revealedSafeCells}/{TOTAL_SAFE_CELLS}
        </span>
        <span className="find-flower-pill">Movimientos: {moveCount}</span>
      </div>

      <p className={`find-flower-status ${gameStatus}`}>{statusMessage}</p>
      {latestResult && (
        <p className="find-flower-last-result">
          Puntaje: <strong>{latestResult.score}</strong> · Tiempo: {latestResult.timeSeconds}s · Movimientos: {latestResult.moves}
        </p>
      )}
      {scoreFeedback && <p className="find-flower-feedback">{scoreFeedback}</p>}

      <div
        className="find-flower-grid"
        role="grid"
        aria-label="Tablero Encuentra la flor"
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const numberClass =
              cell.isRevealed && !cell.hasFlower && cell.adjacentFlowers > 0
                ? ` n-${cell.adjacentFlowers}`
                : "";

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                role="gridcell"
                className={`find-flower-cell${cell.isRevealed ? " revealed" : ""}${
                  cell.isPlanted ? " planted" : ""
                }${cell.isRevealed && cell.hasFlower ? " flower" : ""}${numberClass}`}
                aria-label={`Fila ${rowIndex + 1}, columna ${colIndex + 1}`}
                onClick={() => revealCell(rowIndex, colIndex)}
                onContextMenu={(event) => togglePlant(event, rowIndex, colIndex)}
              >
                {getCellLabel(cell)}
              </button>
            );
          }),
        )}
      </div>

      <div className="button-row find-flower-actions">
        <button type="button" onClick={resetGame}>
          Nueva partida
        </button>
      </div>

      <p className="small muted">
        Clic izquierdo: revelar celda. Clic derecho: colocar o quitar bandera.
      </p>

      <div className="find-flower-ranking">
        <div className="find-flower-ranking-header">
          <h3>Ranking de puntajes máximos</h3>
          <button type="button" className="secondary" onClick={() => void loadRanking()}>
            Actualizar
          </button>
        </div>

        {isLoadingRanking ? <p>Cargando ranking...</p> : null}
        {rankingError ? <p className="error">{rankingError}</p> : null}

        {!isLoadingRanking && !rankingError && ranking.length === 0 ? (
          <p>No hay puntajes aún.</p>
        ) : null}

        {!isLoadingRanking && ranking.length > 0 ? (
          <div className="find-flower-ranking-table-wrap">
            <table className="default-table find-flower-ranking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Puntaje máximo</th>
                  <th>Mejor tiempo</th>
                  <th>Movimientos</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry, index) => {
                  const isCurrentUser =
                    currentUsername && entry.user?.username === currentUsername;

                  return (
                    <tr
                      key={`ranking-${entry.id}`}
                      className={isCurrentUser ? "find-flower-current-user" : ""}
                    >
                      <td>{index + 1}</td>
                      <td>{entry.user?.username || "usuario"}</td>
                      <td>{entry.maxScore}</td>
                      <td>
                        {entry.bestTimeSeconds == null
                          ? "-"
                          : `${entry.bestTimeSeconds}s`}
                      </td>
                      <td>{entry.bestMoves == null ? "-" : entry.bestMoves}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
