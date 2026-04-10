document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // UI Elements
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const scoreBox = document.getElementById('current-score-box');
    const overlay = document.getElementById('game-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayText = document.getElementById('overlay-text');
    const startBtn = document.getElementById('start-btn');
    
    // Game Constants
    const gridSize = 20;
    const tileCount = canvas.width / gridSize;
    
    // Game State
    let snake = [];
    let food = { x: 0, y: 0 };
    let dx = 0;
    let dy = 0;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let isGameRunning = false;
    let hasMovedThisFrame = false;
    let lastRenderTime = 0;
    let gameSpeed = 8; // moves per second

    // Initialize high score display
    highScoreElement.textContent = highScore;

    function initGame() {
        // Reset snake to middle (length 3 to start)
        const startX = Math.floor(tileCount / 2);
        const startY = Math.floor(tileCount / 2);
        snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        
        score = 0;
        gameSpeed = 8;
        scoreElement.textContent = score;
        scoreBox.classList.remove('pulse');
        
        // Initial velocity (moving right)
        dx = 1;
        dy = 0;
        
        isGameRunning = true;
        
        placeFood();
        hideOverlay();
        
        // requestAnimationFrame loop setup
        requestAnimationFrame(gameLoop);
    }

    function gameLoop(currentTime) {
        if (!isGameRunning) return;
        
        window.requestAnimationFrame(gameLoop);
        
        const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
        if (secondsSinceLastRender < 1 / gameSpeed) return;
        
        lastRenderTime = currentTime;
        hasMovedThisFrame = false;
        
        update();
        draw();
    }

    function update() {
        // Move snake
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };
        
        // Wall collision (wrap around)
        if (head.x < 0) head.x = tileCount - 1;
        if (head.x >= tileCount) head.x = 0;
        if (head.y < 0) head.y = tileCount - 1;
        if (head.y >= tileCount) head.y = 0;
        
        // Self collision - game over
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameOver();
                return;
            }
        }
        
        snake.unshift(head); // Add new head
        
        // Check food collision
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            scoreElement.textContent = score;
            
            // animate score
            scoreBox.classList.remove('pulse');
            void scoreBox.offsetWidth; // trigger reflow
            scoreBox.classList.add('pulse');
            
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // Increment speed slightly every 50 points
            if (score % 50 === 0) {
                gameSpeed += 0.5;
            }
            
            placeFood();
        } else {
            snake.pop(); // Remove tail if no food eaten
        }
    }

    function draw() {
        // Clear canvas with transparency to let CSS grid show through
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw food with glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff3366';
        ctx.fillStyle = '#ff3366';
        
        // Make food slightly smaller than grid size and round
        const cX = food.x * gridSize + gridSize / 2;
        const cY = food.y * gridSize + gridSize / 2;
        ctx.beginPath();
        ctx.arc(cX, cY, gridSize/2 - 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw snake
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff88';
        
        for (let i = 0; i < snake.length; i++) {
            // Head is slightly different color/brighter
            ctx.fillStyle = i === 0 ? '#ffffff' : '#00ff88';
            
            // Draw slightly padded rounded rectangle for snake segments
            const x = snake[i].x * gridSize + 2;
            const y = snake[i].y * gridSize + 2;
            const size = gridSize - 4;
            
            // Fallback for older browsers
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(x, y, size, size, 4);
                ctx.fill();
            } else {
                ctx.fillRect(x, y, size, size);
            }
        }
        
        // Reset shadow for performance
        ctx.shadowBlur = 0;
    }

    function placeFood() {
        let newX, newY;
        let onSnake = true;
        while(onSnake) {
            newX = Math.floor(Math.random() * tileCount);
            newY = Math.floor(Math.random() * tileCount);
            onSnake = snake.some(segment => segment.x === newX && segment.y === newY);
        }
        food = { x: newX, y: newY };
    }

    function gameOver() {
        isGameRunning = false;
        showOverlay('GAME OVER', `Final Score: ${score}`);
        startBtn.textContent = 'PLAY AGAIN';
    }

    function showOverlay(title, text) {
        overlayTitle.textContent = title;
        overlayText.textContent = text;
        overlay.classList.remove('hidden');
    }

    function hideOverlay() {
        overlay.classList.add('hidden');
    }

    function changeDirection(newDx, newDy) {
        if (!isGameRunning || hasMovedThisFrame) return;
        
        // Prevent 180 degree turns
        if ((newDx === 1 && dx === -1) || 
            (newDx === -1 && dx === 1) || 
            (newDy === 1 && dy === -1) || 
            (newDy === -1 && dy === 1)) {
            return;
        }
        
        dx = newDx;
        dy = newDy;
        hasMovedThisFrame = true;
    }

    // Event Listeners
    window.addEventListener('keydown', (e) => {
        // Prevent default scrolling for arrows and space
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }

        if (e.key === ' ' || e.key === 'Enter') {
            if (!isGameRunning) initGame();
            return;
        }

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                changeDirection(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                changeDirection(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                changeDirection(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                changeDirection(1, 0);
                break;
        }
    });

    startBtn.addEventListener('click', initGame);

    // Mobile controls (using touchstart for better responsiveness)
    const addControlListener = (id, newDx, newDy) => {
        const btn = document.getElementById(id);
        const handler = (e) => {
            e.preventDefault(); // Prevent double firing on touch devices
            changeDirection(newDx, newDy);
        };
        btn.addEventListener('touchstart', handler);
        btn.addEventListener('mousedown', handler);
    };

    addControlListener('up-btn', 0, -1);
    addControlListener('down-btn', 0, 1);
    addControlListener('left-btn', -1, 0);
    addControlListener('right-btn', 1, 0);

    // Initial abstract draw for background aesthetics
    draw();
});
