import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

const GRID_SIZE = 15;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 7, y: 7 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };

export default function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(randomFood());
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [snakeColor, setSnakeColor] = useState("green");
  const [isGameOver, setIsGameOver] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Movimiento automático
  useEffect(() => {
    if (isGameOver) return;
    const interval = setInterval(moveSnake, 200);
    return () => clearInterval(interval);
  }, [snake, direction, isGameOver]);

  // Función para mover la serpiente
  function moveSnake() {
    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y,
    };

    // Game over si se sale del tablero
    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE
    ) {
      triggerGameOver();
      return;
    }

    // Game over si choca consigo misma
    for (let part of snake) {
      if (part.x === head.x && part.y === head.y) {
        triggerGameOver();
        return;
      }
    }

    const newSnake = [head, ...snake];

    // Comer comida
    if (head.x === food.x && head.y === food.y) {
      const nextScore = score + 1;
      setScore(nextScore);
      setFood(randomFood());
      setSnakeColor(randomColor()); // cambia color al anotar

      // Celebrar cada múltiplo de 10
      if (nextScore > 0 && nextScore % 10 === 0) {
        // Mostrar confeti brevemente
        setShowConfetti(false); // reinicia para volver a disparar
        setTimeout(() => setShowConfetti(true), 0);
      }
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }

  // Evitar cambio de dirección inversa inmediata
  function safeSetDirection(nextDir: { x: number; y: number }) {
    if (isGameOver) return;
    const current = direction;
    // Si intenta ir en sentido contrario en el mismo eje, ignorar
    if (current.x + nextDir.x === 0 && current.y + nextDir.y === 0) return;
    setDirection(nextDir);
  }

  function triggerGameOver() {
    setIsGameOver(true);
  }

  // Reiniciar juego
  function resetGame() {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(randomFood());
    setScore(0);
    setSnakeColor("green");
    setIsGameOver(false);
    setShowConfetti(false);
  }

  // Generar comida aleatoria que no caiga encima de la serpiente
  function randomFood() {
    while (true) {
      const candidate = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const collides = snake.some((p) => p.x === candidate.x && p.y === candidate.y);
      if (!collides) return candidate;
    }
  }

  // Generar color aleatorio
  function randomColor() {
    const colors = ["green", "blue", "red", "orange", "purple", "pink"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  const boardSize = GRID_SIZE * CELL_SIZE;
  const { width } = Dimensions.get("window");

  return (
    <View style={styles.container}>
      <Text style={styles.score}>Puntuación: {score}</Text>

      {/* Tablero */}
      <View
        style={[
          styles.board,
          {
            width: boardSize,
            height: boardSize,
          },
        ]}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
          const x = index % GRID_SIZE;
          const y = Math.floor(index / GRID_SIZE);

          let backgroundColor = "#eee";

          // Comida
          if (food.x === x && food.y === y) {
            backgroundColor = "red";
          }

          // Serpiente
          snake.forEach((part) => {
            if (part.x === x && part.y === y) {
              backgroundColor = snakeColor;
            }
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

      {/* Controles */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => safeSetDirection({ x: 0, y: -1 })}>
          <Text style={styles.button}>⬆️</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => safeSetDirection({ x: -1, y: 0 })}>
            <Text style={styles.button}>⬅️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => safeSetDirection({ x: 1, y: 0 })}>
            <Text style={styles.button}>➡️</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => safeSetDirection({ x: 0, y: 1 })}>
          <Text style={styles.button}>⬇️</Text>
        </TouchableOpacity>
      </View>

      {/* Overlay Game Over */}
      {isGameOver && (
        <View style={styles.overlay}>
          <Text style={styles.gameOverTitle}>GAME OVER</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={resetGame}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confeti en múltiplos de 10 */}
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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  score: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  board: {
    backgroundColor: "#eee",
    flexDirection: "row",
    flexWrap: "wrap",
    position: "relative",
  },
  controls: {
    marginTop: 20,
    alignItems: "center",
  },
  button: {
    fontSize: 30,
    margin: 10,
  },
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  gameOverTitle: {
    fontSize: 36,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
});
