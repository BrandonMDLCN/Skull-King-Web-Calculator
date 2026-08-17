# 🏴‍☠️ Reglas e Instrucciones de Juego - Skull King ☠️

## 1. Preparación de la Partida
- El líder de la sala crea la partida, definiendo si se jugarán **5 o 10 rondas**.
- Los jugadores se unen usando el código de la sala. Todos deben tener un nombre asignado.
- Una vez iniciada la primera ronda, las configuraciones quedan bloqueadas y comienza la aventura.

## 2. Dinámica de cada Ronda
En cada ronda, luego de jugar las bazas, se deben registrar 4 valores por jugador:
- **Apuesta:** Cuántas bazas predijiste que ibas a ganar al inicio de la ronda (mínimo 0).
- **Ganadas:** Las bazas que realmente ganaste.
- **Puntos Extra:** Puntos adicionales obtenidos por capturar cartas valiosas (sirenas, piratas, etc.).
- **Efecto Pirata:** Un modificador especial que puede ir de -2 a +2.

## 3. Sistema de Puntuación (Puntos mostrados x10)
*Nota interna: La aplicación calcula la base en unidades, pero multiplica todo por 10 para tu puntaje final visible (ej. 1 punto base = 10 puntos en pantalla).*

### ✅ Éxito (Cumpliste tu apuesta exactamente)
- **Si apostaste 0 y ganaste 0:** Recibes 10 puntos base + Extras + Efectos Pirata.
- **Si apostaste > 0 y ganaste tu apuesta:** Recibes (Apuesta x 10) + Extras + Efectos Pirata.

### ❌ Fracaso (No acertaste tu apuesta)
- Se calcula por cuántas bazas fallaste (Diferencia = |Apuesta - Ganadas|).
- Tus puntos iniciales de la ronda se vuelven **negativos** equivalentes a esa diferencia multiplicada por 10 (ej. Fallar por 2 bazas resta 20 puntos base).
- **Manejo del Efecto Pirata al fallar:**
  - Si el efecto era **negativo (< 0)** (predijiste algo perjudicial), se **suma** a tus puntos parciales para reducir el daño.
  - Si el efecto era **positivo (> 0)** (predijiste algo beneficioso y fallaste), se te penaliza **restando** dicho efecto.

## 4. Rondas Críticas (Multiplicadores)
¡Presta atención al final de la partida, el botín y los riesgos son mayores!
- **Rondas Normales:** Puntuación normal (x1).
- **Penúltima Ronda** (ej. Ronda 4 de 5, o 9 de 10): ¡Todos los puntos (positivos o negativos) valen el **DOBLE (x2)**!
- **Última Ronda** (ej. Ronda 5 de 5, o 10 de 10): ¡Todos los puntos valen el **TRIPLE (x3)**!

## 5. 📜 Pergamino de Poderes (Comodines Pirata)
Durante el juego, ciertas acciones otorgan poderes o modificadores especiales. Estos son sus efectos:
- 🔴 **Pirata Rojo:** Puedes ver 2 cartas del mazo, e intercambiarlas si te funcionan.
- 🟡 **Pirata Amarillo:** Todos juegan una baza más, es decir, todos toman una carta del mazo.
- 🟢 **Pirata Verde:** Puedes modificar tu apuesta inicial sumándole o restándole 1 (+1 o -1).
- 🔵 **Pirata Azul:** Se te permite hacer una segunda apuesta. Esta es una apuesta "Bonus" (+-10 o +-20 puntos) acerca de si vas o no a cumplir la primera apuesta que hiciste.