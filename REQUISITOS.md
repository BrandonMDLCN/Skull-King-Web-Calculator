# Documento de Requisitos y Reglas de Negocio - Skull King

Este documento detalla todas las reglas de negocio, lógica matemática y requerimientos del sistema actuales de la aplicación, pensado como referencia para futuras modificaciones a la infraestructura.

## 1. Configuración de la Partida
- **Número de Rondas:** La partida se puede configurar para jugar a **5** o **10** rondas. Esto debe definirse antes de que inicie la primera ronda.
- **Jugadores (Tripulación):** Se pueden añadir múltiples jugadores de forma dinámica. Como regla estricta, **todos los jugadores deben tener un nombre** asignado antes de poder pasar a la siguiente ronda.
- **Estado de Partida:** Una vez que se avanza a la primera ronda, los ajustes principales (como cambiar el límite de rondas) deben bloquearse.

## 2. Variables por Jugador en cada Ronda
Para cada jugador, la tabla registra 4 métricas en cada ronda:
1. **Apuesta (`apuestaHecha`):** Cantidad de bazas que el jugador predice que va a ganar (mínimo 0).
2. **Ganadas (`apuestaGanada`):** Cantidad de bazas que realmente ganó el jugador (mínimo 0).
3. **Extra (`puntosExtra`):** Puntos adicionales obtenidos por capturar cartas valiosas u otras bonificaciones (mínimo 0).
4. **Efecto Pirata (`efectoPirata`):** Un modificador especial que puede oscilar entre **-2** y **+2**.

## 3. Lógica de Puntuación
La base del cálculo interno es unitaria, pero **para la vista al usuario todo el puntaje se multiplica por 10** en la interfaz (1 punto interno = 10 puntos mostrados).

La evaluación de los puntos por ronda se realiza con las siguientes condiciones:

**A. Éxito (Acertó la apuesta: `Apuesta == Ganadas`)**
- Si apostó **0** y ganó **0**: Recibe **1 punto base** + `Extra` + `Efecto Pirata`.
- Si apostó **> 0** y ganó exactamente lo que apostó: Recibe puntos iguales a la `Apuesta` + `Extra` + `Efecto Pirata`.

**B. Fracaso (Falló la apuesta: `Apuesta != Ganadas`)**
- Se calcula la diferencia absoluta: `Diferencia = |Apuesta - Ganadas|`.
- Los puntos iniciales de la ronda se vuelven **negativos** equivalentes a esa diferencia (ej. Fallar por 2 cuesta -2 puntos base).
- **Manejo del Efecto Pirata en Fracaso:**
  - Si el efecto era **negativo (< 0)**: Significa que el pirata predijo un evento perjudicial o negativo. Al fallar la apuesta, se asume que cumplió ese efecto, por lo que se **suma** el valor absoluto de ese efecto como un "premio" parcial o reducción del daño.
  - Si el efecto era **positivo (> 0)**: Significa que el pirata predijo un evento beneficioso. Al fallar la apuesta, se asume que no lo cumplió, por lo que es penalizado **restando** ese efecto positivo de sus puntos de ronda.

## 4. Multiplicadores por Ronda
Existen rondas críticas donde la puntuación total de la ronda sufre un incremento multiplicativo antes de sumarse al global:
- **Rondas Estándar:** Multiplicador **x1**.
- **Penúltima Ronda:** Multiplicador **x2** (ej. Ronda 4 de 5, o Ronda 9 de 10).
- **Última Ronda:** Multiplicador **x3** (ej. Ronda 5 de 5, o Ronda 10 de 10).

*(El multiplicador se aplica a la sumatoria de puntos de la ronda evaluada, incluyendo los puntos negativos del fracaso).*

## 5. Reinicio Inter-Ronda y Persistencia
- Tras calcular una ronda, el registro completo se guarda en un **Historial** visual (mostrado en orden inverso, es decir, la más reciente arriba).
- A los jugadores se les suma o resta su puntuación de la ronda al puntaje acumulado.
- Sus variables de la ronda en curso (`apuestaHecha`, `apuestaGanada`, `puntosExtra`, `efectoPirata`) se **restablecen a 0** para comenzar limpios la siguiente ronda.

## 6. Sistema de Poderes ("Pergamino de Poderes")
El juego implementa "modificadores de casa" visuales para los usuarios, que explican qué hacer según la acción del juego (afectan indirectamente a los inputs de Extras y Apuestas):
- **Rojo:** Cambia 2 cartas.
- **Amarillo:** Todos toman 1 carga.
- **Verde:** Apuesta +1 o -1.
- **Azul:** Apuesta Bonus -+(0, 10, 20).

## 7. Fin de la Partida
- El juego finaliza cuando la `rondaActual` alcanza el `maxRondas`.
- En este punto, el ganador (o los ganadores en caso de un empate, donde se evalúa el puntaje máximo) se muestra a través de un **Modal (GanadorModal)**.
- Se debe proveer siempre la funcionalidad de "Nuevo Juego" que blanquea el historial, devuelve la ronda a 0, y limpia por completo los puntos y variables de la tripulación.