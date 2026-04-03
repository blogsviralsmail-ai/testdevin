// Sound effects using Web Audio API - no external files needed

const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

function ensureContext() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
  ensureContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playDiceRollSound() {
  ensureContext();
  // Rattle/shake effect - rapid short tones
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      playTone(200 + Math.random() * 300, 0.05, 'triangle', 0.1);
    }, i * 60);
  }
  // Final thud
  setTimeout(() => {
    playTone(150, 0.15, 'sine', 0.2);
  }, 380);
}

export function playPieceMoveSound() {
  ensureContext();
  playTone(500, 0.08, 'sine', 0.12);
}

export function playPiecePlaceSound() {
  ensureContext();
  playTone(600, 0.12, 'triangle', 0.15);
}

export function playCaptureSound() {
  ensureContext();
  // Dramatic capture sound
  playTone(800, 0.1, 'square', 0.15);
  setTimeout(() => playTone(600, 0.1, 'square', 0.12), 100);
  setTimeout(() => playTone(400, 0.15, 'square', 0.1), 200);
}

export function playPieceOutSound() {
  ensureContext();
  // Piece exits home - rising tone
  playTone(400, 0.1, 'sine', 0.15);
  setTimeout(() => playTone(600, 0.1, 'sine', 0.15), 100);
  setTimeout(() => playTone(800, 0.12, 'sine', 0.18), 200);
}

export function playWinSound() {
  ensureContext();
  // Victory fanfare
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.2), i * 200);
  });
}

export function playSixRolledSound() {
  ensureContext();
  // Exciting double beep for rolling a 6
  playTone(880, 0.1, 'sine', 0.18);
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.2), 120);
}

export function playTurnSound() {
  ensureContext();
  // Subtle notification for your turn
  playTone(660, 0.08, 'sine', 0.1);
  setTimeout(() => playTone(880, 0.1, 'sine', 0.12), 100);
}

export function playFinishSound() {
  ensureContext();
  // Piece reaches home
  playTone(523, 0.1, 'sine', 0.15);
  setTimeout(() => playTone(659, 0.1, 'sine', 0.15), 100);
  setTimeout(() => playTone(784, 0.1, 'sine', 0.15), 200);
  setTimeout(() => playTone(1047, 0.2, 'sine', 0.2), 300);
}
