/**
 * SparkHeim Games – Penalty Kick Mini Game
 * Click to shoot. Score 5 to win.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('penaltyCanvas');
  const scoreEl = document.getElementById('penaltyScore');
  const restartBtn = document.getElementById('penaltyRestart');

  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  let score = 0;
  let gameOver = false;
  let ballX, ballY, ballVx, ballVy;
  let keeperX, keeperTargetX;
  let phase = 'aim'; // aim | shoot | result
  let resultMsg = '';

  const BALL_R = 12;
  const BALL_START_X = W / 2;
  const BALL_START_Y = H - 120;
  const GOAL_TOP = 80;
  const GOAL_BOTTOM = 220;
  const GOAL_LEFT = 100;
  const GOAL_RIGHT = W - 100;
  const KEEPER_Y = 100;
  const KEEPER_W = 60;
  const KEEPER_H = 25;

  function draw() {
    ctx.fillStyle = '#f7f5f2';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#8a9e8c';
    ctx.fillRect(0, H - 150, W, 150);

    ctx.strokeStyle = '#2c2c2c';
    ctx.lineWidth = 4;
    ctx.strokeRect(GOAL_LEFT, GOAL_TOP, GOAL_RIGHT - GOAL_LEFT, GOAL_BOTTOM - GOAL_TOP);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(GOAL_LEFT + 2, GOAL_TOP + 2, GOAL_RIGHT - GOAL_LEFT - 4, GOAL_BOTTOM - GOAL_TOP - 4);

    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(keeperX - KEEPER_W / 2, KEEPER_Y - KEEPER_H / 2, KEEPER_W, KEEPER_H);

    ctx.fillStyle = '#c9b99a';
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2c2c2c';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (phase === 'result' && resultMsg) {
      ctx.fillStyle = 'rgba(44, 44, 44, 0.9)';
      ctx.font = 'bold 24px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(resultMsg, W / 2, H / 2 - 20);
      if (!gameOver) {
        ctx.font = '16px Helvetica, Arial, sans-serif';
        ctx.fillText('Click to continue', W / 2, H / 2 + 10);
      } else {
        ctx.fillText('Click Play again to restart', W / 2, H / 2 + 10);
      }
    }

    if (phase === 'aim') {
      ctx.fillStyle = 'rgba(44, 44, 44, 0.5)';
      ctx.font = '14px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click where you want to shoot', W / 2, H - 50);
    }
  }

  function resetShot() {
    ballX = BALL_START_X;
    ballY = BALL_START_Y;
    ballVx = 0;
    ballVy = 0;
    keeperX = W / 2;
    keeperTargetX = GOAL_LEFT + Math.random() * (GOAL_RIGHT - GOAL_LEFT - KEEPER_W);
    phase = 'aim';
    resultMsg = '';
  }

  function kick(targetX, targetY) {
    const dx = targetX - ballX;
    const dy = targetY - ballY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 12;
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
        if (score >= 5) {
          resultMsg = 'You win!';
          gameOver = true;
          if (scoreEl) scoreEl.textContent = score;
          phase = 'result';
          draw();
        } else {
          resultMsg = 'GOAL!';
        }
      } else {
        resultMsg = saved ? 'Saved!' : 'Miss!';
      }
      phase = 'result';
      if (scoreEl) scoreEl.textContent = score;
      return true;
    }
    return false;
  }

  function update() {
    if (phase === 'shoot') {
      ballX += ballVx;
      ballY += ballVy;
      keeperX += (keeperTargetX - keeperX) * 0.15;

      if (checkGoal()) return;
      if (ballY < -BALL_R || ballX < -BALL_R || ballX > W + BALL_R) {
        resultMsg = 'Miss!';
        phase = 'result';
      }
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);

    if (phase === 'aim') {
      kick(x, Math.min(y, GOAL_TOP + 50));
    } else if (phase === 'result' && !gameOver) {
      resetShot();
    }
  }

  function init() {
    score = 0;
    gameOver = false;
    if (scoreEl) scoreEl.textContent = '0';
    resetShot();
    loop();
  }

  canvas.addEventListener('click', handleClick);

  restartBtn?.addEventListener('click', function () {
    init();
  });

  init();
})();
