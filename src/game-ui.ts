import './style.css'

// UI Elements
export const scoreDisplay = document.getElementById('score') as HTMLElement;
export const timerDisplay = document.getElementById('timer') as HTMLElement;
export const gameOverScreen = document.getElementById('game-over') as HTMLElement;
export const startScreen = document.getElementById('start-screen') as HTMLElement;
export const finalScoreDisplay = document.getElementById('final-score') as HTMLElement;
export const gameOverReasonDisplay = document.getElementById('game-over-reason') as HTMLElement;

// UI Functions
export function updateScore(points: number) {
  const currentScore = parseInt(scoreDisplay.textContent || '0');
  scoreDisplay.textContent = (currentScore + points).toString();
}

export function gameOver(reason = 'time') {
  document.exitPointerLock();
  gameOverScreen.style.display = 'flex';
  
  const score = parseInt(scoreDisplay.textContent || '0');
  finalScoreDisplay.textContent = score.toString();
  
  let reasonText = '';
  if (reason === 'time') {
    reasonText = 'Time\'s up!';
  } else if (reason === 'fell') {
    reasonText = 'You fell out of the arena!';
  }
  
  gameOverReasonDisplay.textContent = reasonText;
}

export function showStartScreen() {
  startScreen.style.display = 'flex';
}

export function hideStartScreen() {
  startScreen.style.display = 'none';
}

export function resetTimer() {
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.textContent = '60';
    timerElement.classList.remove('warning', 'danger');
  }
}

export function updateTimerDisplay(remainingTime: number) {
  if (timerDisplay) {
    timerDisplay.textContent = Math.ceil(remainingTime).toString();
    
    if (remainingTime <= 10) {
      timerDisplay.classList.add('danger');
      timerDisplay.classList.remove('warning');
    } else if (remainingTime <= 20) {
      timerDisplay.classList.add('warning');
      timerDisplay.classList.remove('danger');
    }
  }
}

export function setAimingState(isAiming: boolean) {
  if (isAiming) {
    document.body.classList.add('aiming');
  } else {
    document.body.classList.remove('aiming');
  }
}

export function setPointerLockState(isLocked: boolean) {
  if (isLocked) {
    document.body.classList.add('pointer-locked');
  } else {
    document.body.classList.remove('pointer-locked');
  }
}

export function setGameActiveState(isActive: boolean) {
  if (isActive) {
    document.body.classList.add('game-active');
  } else {
    document.body.classList.remove('game-active');
  }
} 