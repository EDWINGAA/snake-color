import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, PanResponder, Platform } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

const GRID_SIZE = 15;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 7, y: 7 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_SPEED = 200;          // prueba 160 si quieres más ritmo
const SPEED_MULTIPLIER = 0.985;     // 1.5 % más rápido
const SWIPE_THRESHOLD = 8;          // más sensible para móvil

export default function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(randomFood(INITIAL_SNAKE));
  const [score, setScore] = useState(0);
  const [snakeColor, setSnakeColor] = useState("green");
  const [isGameOver, setIsGameOver] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  // Refs para loop estable
  const dirRef = useRef(INITIAL_DIRECTION);
  const snakeRef = useRef(INITIAL_SNAKE);
  const isGameOverRef = useRef(false);
  const hasSwipedRef = useRef(false);

  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);

  // Loop de movimiento (no depende de snake/direction)
  useEffect(() => {
    if (isGameOver) return;
    const id = setInterval(() => moveSnake(), speed);
    return () => clearInterval(id);
  }, [speed, isGameOver]);

  // === CONTROLES POR TECLADO (WEB/PC) ===
  useEffect(() => {
    if (Platform.OS !== "web") return;

    function onKeyDown(e: KeyboardEvent) {
      if (isGameOverRef.current) return;

      const key = e.key.toLowerCase();
      if (["arrowup", "w"].includes(key)) {
        e.preventDefault();
        safeSetDirection({ x: 0, y: -1 });
      } else if (["arrowdown", "s"].includes(key)) {
        e.preventDefault();
        safeSetDirection({ x: 0, y: 1 });
      } else if (["arrowleft", "a"].includes(key)) {
        e.preventDefault();
        safeSetDirection({ x: -1, y: 0 });
      } else if (["arrowright", "d"].includes(key)) {
        e.preventDefault();
        safeSetDirection({ x: 1, y: 0 });
      } else if (key === " " && isGameOverRef.current) {
        // espacio para reintentar (opcional)
        e.preventDefault();
        resetGame();
      }
    }

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown as any);
  }, []);

  function moveSnake() {
    const snakeNow = snakeRef.current;
    const dir = dirRef.current;

    const head = { x: snakeNow[0].x + dir.x, y: snakeNow[0].y + dir.y };

    // Colisiones
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      triggerGameOver();
      return;
    }
    for (let part of snakeNow) {
      if (part.x === head.x && part.y === head.y) {
        triggerGameOver();
        return;
      }
    }

    let newSnake = [head, ...snakeNow];

    if (head.x === food.x && head.y === food.y) {
      const nextScore = score + 1;
      setScore(nextScore);
      setFood(randomFood(newSnake));
      setSnakeColor(randomColor());
      setSpeed(prev => Math.max(40, prev * SPEED_MULTIPLIER));

      if (nextScore % 10 === 0) {
        setShowConfetti(false);
        setTimeout(() => setShowConfetti(true), 0);
      }
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }

  // Evitar giro 180°
  function safeSetDirection(nextDir: { x: number; y: number }) {
    const cur = dirRef.current;
    if (cur.x + nextDir.x === 0 && cur.y + nextDir.y === 0) return;
    dirRef.current = nextDir;
  }

  function triggerGameOver() { setIsGameOver(true); }

  function resetGame() {
    const start = INITIAL_SNAKE;
    setSnake(start);
    snakeRef.current = start;
    dirRef.current = INITIAL_DIRECTION;
    setFood(randomFood(start));
    setScore(0);
    setSnakeColor("green");
    setIsGameOver(false);
    setShowConfetti(false);
    setSpeed(INITIAL_SPEED);
  }

  const boardSize = GRID_SIZE * CELL_SIZE;
  const { width } = Dimensions.get("window");

  // Gestos táctiles (móvil)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isGameOver,
      onMoveShouldSetPanResponder: (_, g) =>
        !isGameOver && (Math.abs(g.dx) > SWIPE_THRESHOLD || Math.abs(g.dy) > SWIPE_THRESHOLD),
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => { hasSwipedRef.current = false; },
      onPanResponderMove: (_, g) => {
        if (hasSwipedRef.current) return;
        const { dx, dy } = g;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > SWIPE_THRESHOLD) { safeSetDirection({ x: 1, y: 0 }); hasSwipedRef.current = true; }
          else if (dx < -SWIPE_THRESHOLD) { safeSetDirection({ x: -1, y: 0 }); hasSwipedRef.current = true; }
        } else {
          if (dy > SWIPE_THRESHOLD) { safeSetDirection({ x: 0, y: 1 }); hasSwipedRef.current = true; }
          else if (dy < -SWIPE_THRESHOLD) { safeSetDirection({ x: 0, y: -1 }); hasSwipedRef.current = true; }
        }
      },
      onPanResponderRelease: () => { hasSwipedRef.current = false; },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Text style={styles.score}>Puntuación: {score}</Text>

      <View
        style={[styles.board, { width: boardSize, height: boardSize }]}
        {...panResponder.panHandlers}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
          const x = index % GRID_SIZE;
          const y = Math.floor(index / GRID_SIZE);
          let backgroundColor = "#eee";
          if (food.x === x && food.y === y) backgroundColor = "red";
          snake.forEach(part => {
            if (part.x === x && part.y === y) backgroundColor = snakeColor;
          });
          return (
            <View
              key={index}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor,
                borderWidth: 0.5,
                borderColor: "#ddd",
              }}
            />
          );
        })}
      </View>

      {isGameOver && (
        <View style={styles.overlay}>
          <Text style={styles.gameOverTitle}>GAME OVER</Text>
          <Text style={{ color: "#fff", marginBottom: 10 }}>Puntuación: {score}</Text>
          <View onTouchEnd={resetGame} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </View>
          {Platform.OS === "web" && (
            <Text style={{ color: "#fff", marginTop: 8, opacity: 0.85 }}>
              Pulsa <b>Espacio</b> para reiniciar
            </Text>
          )}
        </View>
      )}

      {showConfetti && (
        <ConfettiCannon
          count={150}
          origin={{ x: width / 2, y: 0 }}
          fadeOut
          autoStart
          explosionSpeed={500}
          fallSpeed={3000}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  score: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  board: { backgroundColor: "#eee", flexDirection: "row", flexWrap: "wrap", position: "relative" },
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center",
    paddingHorizontal: 24,
  },
  gameOverTitle: { fontSize: 36, color: "#fff", fontWeight: "bold", marginBottom: 6 },
  retryBtn: { backgroundColor: "#fff", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryText: { fontSize: 18, fontWeight: "bold", color: "#333" },
});

// helpers
function randomFood(curSnake: {x:number;y:number}[]) {
  while (true) {
    const candidate = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    const collides = curSnake.some(p => p.x === candidate.x && p.y === candidate.y);
    if (!collides) return candidate;
  }
}
function randomColor() {
  const colors = ["green", "blue", "red", "orange", "purple", "pink"];
  return colors[Math.floor(Math.random() * colors.length)];
}
