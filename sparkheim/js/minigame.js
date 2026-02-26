/**
 * SparkHeim Games – Penalty Kick Mini Game
 * A portfolio piece demonstrating game development skills:
 * - Canvas 2D rendering, physics (gravity, drag, collision)
 * - Input handling (keyboard + mouse/touch)
 * - Game state machine, particle effects, screen shake
 * - localStorage for high score persistence
 *
 * Controls: Aim with mouse · SPACE to lock aim · SPACE in green zone to shoot
 */
(function () {
  'use strict';

  const canvas = document.getElementById('penaltyCanvas');
  const scoreEl = document.getElementById('penaltyScore');
  const highScoreEl = document.getElementById('penaltyHighScore');
  const attemptsEl = document.getElementById('penaltyAttempts');
  const restartBtn = document.getElementById('penaltyRestart');

  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Physics
  const GRAVITY = 0.35;
  const DRAG = 0.99;
  const BALL_R = 20;

  // Layout (HD: 800x1000)
  const BALL_START_X = W / 2;
  const BALL_START_Y = H - 260;
  const GOAL_TOP = 140;
  const GOAL_BOTTOM = 460;
  const GOAL_LEFT = 180;
  const GOAL_RIGHT = W - 180;
  const KEEPER_Y = 190;
  const KEEPER_W = 110;
  const KEEPER_H = 44;
  const goalW = GOAL_RIGHT - GOAL_LEFT;
  const goalH = GOAL_BOTTOM - GOAL_TOP;

  // Power meter
  const POWER_METER_W = 240;
  const POWER_METER_H = 32;
  const SWEET_SPOT_SIZE = 0.22;

  // Game state
  let score = 0;
  let attempts = 0;
  let gameOver = false;
  let ballX, ballY, ballVx, ballVy;
  let aimX, aimY;
  let keeperX, keeperTargetX;
  let phase = 'aim';
  let resultMsg = '';
  let powerMeterPos = 0.5;
  let powerMeterDir = 1;
  let powerMeterSpeed = 0.018;
  let shotPower = 0.8;
  let mouseX = W / 2;
  let mouseY = (GOAL_TOP + GOAL_BOTTOM) / 2;

  // Juice
  let screenShake = 0;
  let goalFlash = 0;
  let particles = [];

  const STORAGE_KEY = 'sparkheim_penalty_highscore';

  function getHighScore() {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    } catch { return 0; }
  }

  function setHighScore(val) {
    try {
      localStorage.setItem(STORAGE_KEY, String(val));
    } catch (_) {}
  }

  function updateUI() {
    if (scoreEl) scoreEl.textContent = score;
    const hs = getHighScore();
    if (highScoreEl) highScoreEl.textContent = hs > 0 ? hs : '—';
    if (attemptsEl) attemptsEl.textContent = attempts;
  }

  function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random();
      particles.push({
        x, y,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4 - 2,
        life: 1,
        color: color || '#c9b99a',
      });
    }
  }

  function updateParticles() {
    particles = particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= 0.04;
      return p.life > 0;
    });
  }

  function drawParticles() {
    particles.forEach((p) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function triggerGoalJuice() {
    screenShake = 12;
    goalFlash = 0.4;
    spawnParticles(ballX, ballY, 12, '#4169E1');
  }

  function draw() {
    const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
    const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    if (goalFlash > 0) {
      ctx.fillStyle = `rgba(65, 105, 225, ${goalFlash})`;
      ctx.fillRect(-100, -100, W + 200, H + 200);
      goalFlash -= 0.02;
    }

    ctx.fillStyle = '#f7f5f2';
    ctx.fillRect(0, 0, W, H);

    // Grass with subtle stripes
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(0, H - 280, W, 280);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(0, H - 280 + i * 56, W, 28);
    }

    // Goal net
    ctx.strokeStyle = 'rgba(44, 44, 44, 0.15)';
    ctx.lineWidth = 1;
    const netSize = 8;
    for (let i = 0; i <= netSize; i++) {
      const x = GOAL_LEFT + (goalW * i) / netSize;
      ctx.beginPath();
      ctx.moveTo(x, GOAL_TOP);
      ctx.lineTo(x, GOAL_BOTTOM);
      ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const y = GOAL_TOP + (goalH * i) / 6;
      ctx.beginPath();
      ctx.moveTo(GOAL_LEFT, y);
      ctx.lineTo(GOAL_RIGHT, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#2c2c2c';
    ctx.lineWidth = 8;
    ctx.strokeRect(GOAL_LEFT, GOAL_TOP, goalW, goalH);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(GOAL_LEFT + 3, GOAL_TOP + 3, goalW - 6, goalH - 6);

    if (phase === 'aim' || phase === 'power') {
      ctx.strokeStyle = 'rgba(65, 105, 225, 0.6)';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(BALL_START_X, BALL_START_Y);
      ctx.lineTo(aimX, aimY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(201, 185, 154, 0.9)';
      ctx.beginPath();
      ctx.arc(aimX, aimY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2c2c2c';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(keeperX - KEEPER_W / 2, KEEPER_Y - KEEPER_H / 2, KEEPER_W, KEEPER_H);

    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#c9b99a';
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#2c2c2c';
    ctx.lineWidth = 4;
    ctx.stroke();

    drawParticles();

    if (phase === 'power') {
      const meterX = W / 2 - POWER_METER_W / 2;
      const meterY = H - 160;
      ctx.strokeStyle = '#2c2c2c';
      ctx.lineWidth = 4;
      ctx.strokeRect(meterX, meterY, POWER_METER_W, POWER_METER_H);
      ctx.fillStyle = '#e8e4df';
      ctx.fillRect(meterX + 4, meterY + 4, POWER_METER_W - 8, POWER_METER_H - 8);

      const sweetLeft = 0.5 - SWEET_SPOT_SIZE / 2;
      const sweetRight = 0.5 + SWEET_SPOT_SIZE / 2;
      ctx.fillStyle = 'rgba(65, 105, 225, 0.5)';
      ctx.fillRect(meterX + sweetLeft * POWER_METER_W, meterY + 4, SWEET_SPOT_SIZE * POWER_METER_W, POWER_METER_H - 8);

      ctx.fillStyle = '#4169E1';
      ctx.fillRect(meterX + powerMeterPos * (POWER_METER_W - 16), meterY + 4, 16, POWER_METER_H - 8);

      ctx.font = 'bold 24px Helvetica, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('Press SPACE in sweet spot', W / 2, meterY - 16);
    }

    if (phase === 'aim') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '28px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Aim with mouse · Press SPACE to lock aim', W / 2, H - 110);
    }

    if (phase === 'result' && resultMsg) {
      ctx.fillStyle = 'rgba(44, 44, 44, 0.92)';
      ctx.fillRect(W / 2 - 200, H / 2 - 80, 400, 160);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(resultMsg, W / 2, H / 2 - 40);
      ctx.font = '30px Helvetica, Arial, sans-serif';
      ctx.fillText(gameOver ? 'Press Play again' : 'Press SPACE to continue', W / 2, H / 2 + 40);
    }

    ctx.restore();
  }

  function resetShot() {
    ballX = BALL_START_X;
    ballY = BALL_START_Y;
    ballVx = 0;
    ballVy = 0;
    keeperX = W / 2;
    keeperTargetX = GOAL_LEFT + Math.random() * (goalW - KEEPER_W);
    phase = 'aim';
    resultMsg = '';
    powerMeterPos = 0.5;
    powerMeterDir = 1;
  }

  function getPowerQuality() {
    const sweetLeft = 0.5 - SWEET_SPOT_SIZE / 2;
    const sweetRight = 0.5 + SWEET_SPOT_SIZE / 2;
    if (powerMeterPos >= sweetLeft && powerMeterPos <= sweetRight) return 1;
    if (powerMeterPos >= 0.3 && powerMeterPos <= 0.7) return 0.85;
    return 0.6;
  }

  function kick() {
    const quality = getPowerQuality();
    const baseSpeed = 14 + shotPower * 6;
    const speed = baseSpeed * quality;

    const dx = aimX - ballX;
    const dy = aimY - ballY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    ballVx = (dx / dist) * speed;
    ballVy = (dy / dist) * speed;
    phase = 'shoot';
  }

  function checkGoal() {
    if (ballY < GOAL_TOP + BALL_R) {
      const inWidth = ballX > GOAL_LEFT + BALL_R && ballX < GOAL_RIGHT - BALL_R;
      const keeperLeft = keeperX - KEEPER_W / 2;
      const keeperRight = keeperX + KEEPER_W / 2;
      const saved = inWidth && ballX > keeperLeft - BALL_R && ballX < keeperRight + BALL_R;

      if (inWidth && !saved) {
        score++;
        triggerGoalJuice();
        if (score >= 5) {
          resultMsg = 'You win!';
          gameOver = true;
          const prev = getHighScore();
          if (prev === 0 || attempts < prev) setHighScore(attempts);
          updateUI();
      phase = 'result';
      draw();
        } else {
          resultMsg = getPowerQuality() === 1 ? 'Perfect!' : 'GOAL!';
        }
      } else {
        resultMsg = saved ? 'Saved!' : 'Miss!';
      }
      phase = 'result';
      updateUI();
      return true;
    }
    return false;
  }

  function update() {
    if (screenShake > 0) screenShake -= 1;

    if (phase === 'power') {
      powerMeterPos += powerMeterDir * powerMeterSpeed;
      if (powerMeterPos >= 1) {
        powerMeterPos = 1;
        powerMeterDir = -1;
      } else if (powerMeterPos <= 0) {
        powerMeterPos = 0;
        powerMeterDir = 1;
      }
    }

    if (phase === 'shoot') {
      ballVy += GRAVITY;
      ballVx *= DRAG;
      ballVy *= DRAG;
      ballX += ballVx;
      ballY += ballVy;
      keeperX += (keeperTargetX - keeperX) * 0.12;

      if (checkGoal()) return;

      if (ballY < -BALL_R * 2 || ballX < -BALL_R * 2 || ballX > W + BALL_R * 2) {
        resultMsg = 'Miss!';
        phase = 'result';
      }

      const postLeft = ballX < GOAL_LEFT + BALL_R && ballY < GOAL_BOTTOM;
      const postRight = ballX > GOAL_RIGHT - BALL_R && ballY < GOAL_BOTTOM;
      const crossbar = ballY < GOAL_TOP + BALL_R && ballX > GOAL_LEFT && ballX < GOAL_RIGHT;
      if (postLeft || postRight) {
        ballVx *= -0.6;
        ballX = ballX < W / 2 ? GOAL_LEFT + BALL_R : GOAL_RIGHT - BALL_R;
      }
      if (crossbar && ballVy < 0) {
        ballVy *= -0.5;
        ballY = GOAL_TOP + BALL_R;
      }
    }

    updateParticles();
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  function clampAim() {
    aimX = Math.max(GOAL_LEFT + 15, Math.min(GOAL_RIGHT - 15, mouseX));
    aimY = Math.max(GOAL_TOP + 15, Math.min(GOAL_BOTTOM - 15, mouseY));
  }

  function handleAction(e) {
    if (e) e.preventDefault();
    if (phase === 'aim') {
      clampAim();
      phase = 'power';
    } else if (phase === 'power') {
      kick();
      attempts++;
    } else if (phase === 'result' && !gameOver) {
      resetShot();
    }
  }

  function handleKeydown(e) {
    if (e.code === 'Space') handleAction(e);
  }

  function handleTap(e) {
    if (e.target === canvas) handleAction(e);
  }

  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (W / rect.width);
    mouseY = (e.clientY - rect.top) * (H / rect.height);
    if (phase === 'aim') clampAim();
  }

  function handleTouch(e) {
    e.preventDefault();
    if (e.touches.length) {
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      mouseX = (t.clientX - rect.left) * (W / rect.width);
      mouseY = (t.clientY - rect.top) * (H / rect.height);
      if (phase === 'aim') clampAim();
    }
  }

  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('touchmove', handleTouch, { passive: false });
  canvas.addEventListener('touchstart', handleTouch, { passive: false });
  canvas.addEventListener('click', handleTap);
  window.addEventListener('keydown', handleKeydown);

  restartBtn?.addEventListener('click', init);

  function init() {
    score = 0;
    attempts = 0;
    gameOver = false;
    particles = [];
    resetShot();
    aimX = W / 2;
    aimY = (GOAL_TOP + GOAL_BOTTOM) / 2;
    updateUI();
    loop();
  }

  init();
})();
