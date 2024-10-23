const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let paddleWidth = 100, paddleHeight = 20, paddleX;
let ballX, ballY, ballDX, ballDY, ballRadius = 12;
let bricks = [];
let score = 0, gameStarted = false, lives = 3;
let difficulty = 'easy';
let levelCleared = false; // 控制過關動畫的變數
let clearAnimationFrame = 0; // 用於顯示動畫的幀數
// 球的尾跡效果相關變數
const trailLength = 15; // 尾跡的長度
let ballTrail = []; // 存儲球的歷史位置

// 定義磚塊行數與列數
let brickRowCount;
let brickColumnCount = 8;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 15;
const brickOffsetTop = 30;
let brickOffsetLeft;

// 計算磚塊間隔使得左右兩邊的間距一致
function calculateBrickOffsetLeft() {
    const totalBrickWidth = brickColumnCount * (brickWidth + brickPadding) - brickPadding;
    brickOffsetLeft = (canvas.width - totalBrickWidth) / 2;
}

document.addEventListener("mousemove", mouseMoveHandler);

function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = Math.max(0, Math.min(relativeX - paddleWidth / 2, canvas.width - paddleWidth));
    }
}

// 初始化磚塊
function initBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            let hits = 1; // 默認為1次擊打即可破壞
            
            // 根據難度設置不同的擊打次數
            if (difficulty === 'medium') {
                hits = r % 2 === 0 ? 1 : 2;
            } else if (difficulty === 'hard') {
                hits = r % 3 === 0 ? 1 : 2;
                if (r % 5 === 0) {
                    hits = 3;
                }
            }
            
            bricks[c][r] = { x: 0, y: 0, status: 1, hits: hits };
        }
    }
}

function startGame(selectedDifficulty) {
    // 設定難度
    difficulty = selectedDifficulty;
    
    // 根據難度設定球的速度
    if (difficulty === 'medium') {
        ballDX = 5;
        ballDY = -5;
        brickRowCount = 6;
    } else if (difficulty === 'hard') {
        ballDX = 8;
        ballDY = -8;
        brickRowCount = 7;
    } else {
        ballDX = 3;
        ballDY = -3;
        brickRowCount = 5;
    }
    
    score = 0;
    lives = 3;
    paddleX = (canvas.width - paddleWidth) / 2;
    ballX = canvas.width / 2;
    ballY = canvas.height - 30;
    ballTrail = []; // 清空尾跡數組

    initBricks();
    calculateBrickOffsetLeft();
    gameStarted = true;
    document.getElementById("menu").style.display = 'none';
    canvas.style.display = 'block';
    draw(); // 開始遊戲循環
}

function updateBallDirection() {
    // 確認球打到擋板上
    if (ballY + ballDY > canvas.height - paddleHeight - ballRadius) {
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
            let relativeX = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
            ballDX = relativeX * 5;
            ballDY = -ballDY;
        }
    }
}

// 繪製擋板
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

// 繪製球
function drawBall() {
    // 繪製尾跡
    for (let i = 0; i < ballTrail.length; i++) {
        ctx.beginPath();
        ctx.arc(ballTrail[i].x, ballTrail[i].y, ballRadius * (1 - (i / trailLength)), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 149, 221," + (1 - (i / trailLength)) + ")"; // 漸變透明度
        ctx.fill();
        ctx.closePath();
    }

    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

// 繪製磚塊
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);

                if (bricks[c][r].hits === 3) {
                    ctx.fillStyle = "#FF0000"; // 3次擊打的磚塊為紅色
                } else if (bricks[c][r].hits === 2) {
                    ctx.fillStyle = "#FFA500"; // 2次擊打的磚塊為橙色
                } else {
                    ctx.fillStyle = "#0095DD"; // 1次擊打的磚塊為藍色
                }

                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// 碰撞檢測
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                if (ballX > b.x && ballX < b.x + brickWidth && ballY > b.y && ballY < b.y + brickHeight) {
                    ballDY = -ballDY;
                    b.hits--; // 擊打次數減少
                    if (b.hits <= 0) {
                        b.status = 0;
                        score++;
                    }
                    
                    // 判斷是否所有磚塊都已被擊破
                    let allBricksCleared = true;
                    for (let c = 0; c < brickColumnCount; c++) {
                        for (let r = 0; r < brickRowCount; r++) {
                            if (bricks[c][r].status === 1) {
                                allBricksCleared = false;
                                break;
                            }
                        }
                        if (!allBricksCleared) break;
                    }
                    
                    if (allBricksCleared) {
                        levelCleared = true; // 啟動過關動畫
                        setTimeout(() => {
                            startGame(difficulty); // 這裡可以選擇是否重置或進入下一關
                        }, 1500); // 延遲 1.5 秒後重置遊戲
                    }
                }
            }
        }
    }
}
// 繪製分數
function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("分數: " + score, 8, 20);
    ctx.fillText("生命: " + lives, canvas.width - 80, 20); // 顯示生命數量
}

// 更新遊戲邏輯
function update() {
    if (!gameStarted) return;

    // 球的邊界檢查
    if (ballX + ballDX > canvas.width - ballRadius || ballX + ballDX < ballRadius) {
        ballDX = -ballDX;
    }
    if (ballY + ballDY < ballRadius) {
        ballDY = -ballDY;
    } else if (ballY + ballDY > canvas.height - ballRadius) {
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
            updateBallDirection();
        } else {
            lives--;
            if (!lives) {
                alert("遊戲結束");
                document.location.reload();
            } else {
                ballX = canvas.width / 2;
                ballY = canvas.height - 30;
                // 保持當前難度的速度
                if (difficulty === 'medium') {
                    ballDX = 5;
                    ballDY = -5;
                } else if (difficulty === 'hard') {
                    ballDX = 8;
                    ballDY = -8;
                } else {
                    ballDX = 3;
                    ballDY = -3;
                }
                paddleX = (canvas.width - paddleWidth) / 2;
            }
        }
    }

    // 更新球的位置
    ballX += ballDX;
    ballY += ballDY;

    // 更新球的尾跡
    if (ballTrail.length >= trailLength) {
        ballTrail.shift(); // 除去最舊的位置
    }
    ballTrail.push({ x: ballX, y: ballY }); // 添加當前位置

    collisionDetection();
}
function drawClearAnimation() {
    if (levelCleared) {
        clearAnimationFrame++;
        ctx.fillStyle = "rgba(0, 255, 0, 0.5)"; // 設置過關動畫的顏色
        ctx.font = "40px Arial";
        ctx.fillText("關卡通過！", canvas.width / 2 - 100, canvas.height / 2);

        // 每 10 幀更新一次顏色透明度
        if (clearAnimationFrame % 10 === 0) {
            ctx.fillStyle = `rgba(0, 255, 0, ${Math.abs(Math.sin(clearAnimationFrame / 10) * 0.5)})`;
            ctx.fillText("關卡通過！", canvas.width / 2 - 100, canvas.height / 2);
        }

        // 延遲後進入下一關
        if (clearAnimationFrame >= 150) { // 持續 150 幀後重置
            levelCleared = false;
            clearAnimationFrame = 0;
            // 可以選擇直接重置遊戲或進入下一關
            startGame(difficulty); // 重置遊戲
        }
    }
}
// 繪製遊戲
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    drawClearAnimation(); // 繪製過關動畫
    update();
    
    requestAnimationFrame(draw);
}

// 開始遊戲的選項，這裡可以放入按鈕讓玩家選擇難度
function selectDifficulty(selectedDifficulty) {
    startGame(selectedDifficulty);
}
