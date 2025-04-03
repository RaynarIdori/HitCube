import '../assets/style.css'

export const scoreDisplay = document.getElementById('score') as HTMLElement;
export const timerDisplay = document.getElementById('timer') as HTMLElement;
export const gameOverScreen = document.getElementById('game-over') as HTMLElement;
export const startScreen = document.getElementById('start-screen') as HTMLElement;
export const finalScoreDisplay = document.getElementById('final-score') as HTMLElement;
export const gameOverReasonDisplay = document.getElementById('game-over-reason') as HTMLElement;

export function updateScore(points: number) {
  scoreDisplay.textContent = (parseInt(scoreDisplay.textContent || '0') + points).toString();
}

export function gameOver(reason = 'time') {
  document.exitPointerLock();
  gameOverScreen.style.display = 'flex';
  finalScoreDisplay.textContent = (parseInt(scoreDisplay.textContent || '0')).toString();
  gameOverReasonDisplay.textContent = reason === 'time' ? 'Time\'s up!' : 'You fell out of the arena!';
}

export function showStartScreen() {
  startScreen.style.display = 'flex';
}

export function hideStartScreen() {
  startScreen.style.display = 'none';
}

export function resetTimer() {
  if (timerDisplay) {
    timerDisplay.textContent = '60';
    timerDisplay.classList.remove('warning', 'danger');
  }
}

export function updateTimerDisplay(remainingTime: number) {
  if (timerDisplay) {
    timerDisplay.textContent = Math.ceil(remainingTime).toString();
    const isDanger = remainingTime <= 10;
    timerDisplay.classList.remove(isDanger ? 'warning' : 'danger');
    timerDisplay.classList.add(isDanger ? 'danger' : remainingTime <= 20 ? 'warning' : '');
  }
}

export const setAimingState = (isAiming: boolean) =>
  document.body.classList[isAiming ? 'add' : 'remove']('aiming');

export const setPointerLockState = (isLocked: boolean) =>
  document.body.classList[isLocked ? 'add' : 'remove']('pointer-locked');

export const setGameActiveState = (isActive: boolean) =>
  document.body.classList[isActive ? 'add' : 'remove']('game-active');