// Configura o canvas e o contexto de renderização
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1080;
canvas.height = 720;

// Tamanho do personagem e itens
const catSize = 80;
const itemSize = 30;

// Carrega os fundos para cada fase
const backgrounds = ['images/background1.png', 'images/background2.png', 'images/background3.png'].map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

// Configurações dos personagens
const characters = {
    fast: {
        sprite: new Image(),
        speed: 7,
        jump: -12,
        frames: {
            idle: { row: 0, colStart: 0, colEnd: 3 },
            jumping: { row: 1, colStart: 0, colEnd: 6 },
            hurt: { row: 2, colStart: 0, colEnd: 5 },
            walking: { row: 3, colStart: 0, colEnd: 7 }
        }
    },
    balanced: {
        sprite: new Image(),
        speed: 5,
        jump: -15,
        frames: {
            idle: { row: 0, colStart: 0, colEnd: 3 },
            jumping: { row: 1, colStart: 0, colEnd: 6 },
            hurt: { row: 2, colStart: 0, colEnd: 5 },
            walking: { row: 3, colStart: 0, colEnd: 7 }
        }
    },
    highJumper: {
        sprite: new Image(),
        speed: 3,
        jump: -18,
        frames: {
            idle: { row: 0, colStart: 0, colEnd: 3 },
            jumping: { row: 1, colStart: 0, colEnd: 6 },
            hurt: { row: 2, colStart: 0, colEnd: 5 },
            walking: { row: 3, colStart: 0, colEnd: 7 }
        }
    }
};

// Define a fonte das sprites dos personagens
characters.fast.sprite.src = 'images/fast_sprite.png';
characters.balanced.sprite.src = 'images/balanced_sprite.png';
characters.highJumper.sprite.src = 'images/highJumper_sprite.png';

let selectedCharacter;

// Configurações dos inimigos para cada fase
const enemyConfigs = [
    { sprite: 'images/enemy1.png', width: 50, height: 50 },
    { sprite: 'images/enemy2.png', width: 75, height: 60 },
    { sprite: 'images/enemy3.png', width: 85, height: 80 }
];

// Carrega as sprites dos inimigos
const enemySprites = enemyConfigs.map(config => {
    const img = new Image();
    img.src = config.sprite;
    return img;
});

// Carrega as sprites dos itens
const milkSprite = new Image();
milkSprite.src = 'images/milk.png';

const catfoodSprite = new Image();
catfoodSprite.src = 'images/catfood.png';

const poisonSprite = new Image();
poisonSprite.src = 'images/poison.png';

const rottenMeatSprite = new Image();
rottenMeatSprite.src = 'images/rotten_meat.png';

// Carrega outras sprites
const hitSprite = new Image();
hitSprite.src = 'images/RED.png';

const blackCatSprite = new Image();
blackCatSprite.src = 'images/blackcat.png';

const deathSprite = new Image();
deathSprite.src = 'images/morte.png';

// Carrega os ícones de vida e morte
const lifeIcon = new Image();
lifeIcon.src = 'images/Life.png';

const deathIcon = new Image();
deathIcon.src = 'images/Death.png';

// Carrega os efeitos sonoros
const jumpSound = new Audio('audios/jump.mp3');
const enemySound = new Audio('audios/bark.mp3');
const catSound = new Audio('audios/meow.mp3')
const gameWinSound = new Audio('audios/game-win.mp3');
const gameOverSound = new Audio('audios/game-over.mp3');
const pointPlusSound = new Audio('audios/plus.mp3');
const pointMinusSound = new Audio('audios/minus.mp3');
const phaseSounds = [
    new Audio('audios/fase1.mp3'),
    new Audio('audios/fase2.mp3'),
    new Audio('audios/fase3.mp3')
];

let currentPhaseSound;

// Função para tocar um som
function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}

// Variáveis do jogo
let catX, catY, catVelocityY, health, points, gameOver, gameWon, isJumping, facingLeft, catState, frameIndex;
let enemies = [];
let items = [];

const gravity = 0.5;
let frameCount = {
    idle: 4,
    walking: 8,
    jumping: 7,
    hurt: 6
};
let hitAnimationFrame = 0;
let hitAnimationActive = false;
let hurtAnimationComplete = true;

const keys = {
    ArrowRight: false,
    ArrowLeft: false,
    ArrowUp: false,
    KeyW: false,
    KeyA: false,
    KeyD: false
};

let lastFrameTime = 0;
let lastEnemyFrameTime = 0;
let lastItemFrameTime = 0;
let frameDuration = 75;
let enemyFrameDuration = 200;
let itemFrameDuration = 1000;
let gameDuration = 60000;
let startTime;
let currentPhase = 0;

// Função para resetar as variáveis do jogo
function resetGameVariables() {
    catX = canvas.width / 2;
    catY = canvas.height - catSize - 10;
    catVelocityY = 0;
    health = 7;
    points = 0;
    gameOver = false;
    gameWon = false;
    isJumping = false;
    facingLeft = false;
    catState = 'idle';
    frameIndex = 0;
    enemies = [];
    items = [];
    hitAnimationFrame = 0;
    hitAnimationActive = false;
    hurtAnimationComplete = true;
    lastFrameTime = 0;
    lastEnemyFrameTime = 0;
    lastItemFrameTime = 0;
    startTime = Date.now();
}

// Função para selecionar o personagem
function selectCharacter(character) {
    selectedCharacter = characters[character];
    startGame();
}

// Função para desenhar os ícones de vida
function drawLives() {
    for (let i = 0; i < 7; i++) {
        const img = i < health ? lifeIcon : deathIcon;
        ctx.drawImage(img, 150 + i * 35, 10, 30, 30);
    }
}

// Função para iniciar o jogo
function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('winScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    canvas.style.display = 'block';
    startPhase(0);
}

// Função para iniciar uma fase específica
function startPhase(phase) {
    currentPhase = phase;
    resetGameVariables();
    if (currentPhaseSound) currentPhaseSound.pause();
    currentPhaseSound = phaseSounds[phase];
    currentPhaseSound.loop = true;
    currentPhaseSound.play();

    requestAnimationFrame(update);
}

// Event listeners para detectar teclas pressionadas
window.addEventListener('keydown', (e) => {
    if (e.code in keys || ['KeyW', 'KeyA', 'KeyD'].includes(e.code)) {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code in keys || ['KeyW', 'KeyA', 'KeyD'].includes(e.code)) {
        keys[e.code] = false;
    }
});

// Função para spawnar inimigos
function spawnEnemy() {
    const enemyConfig = enemyConfigs[currentPhase];
    const enemyY = 635;
    const enemyX = Math.random() < 0.5 ? -enemyConfig.width : canvas.width;
    const direction = enemyX === -enemyConfig.width ? 1 : -1;
    enemies.push({
        x: enemyX,
        y: enemyY,
        width: enemyConfig.width,
        height: enemyConfig.height,
        direction,
        frameIndex: 0
    });
}

// Função para spawnar itens
function spawnItem() {
    const itemY = -itemSize;
    const itemX = Math.random() * (canvas.width - itemSize);
    const itemType = Math.floor(Math.random() * 4);
    let sprite;
    if (itemType === 0) sprite = milkSprite;
    else if (itemType === 1) sprite = catfoodSprite;
    else if (itemType === 2) sprite = poisonSprite;
    else sprite = rottenMeatSprite;
    items.push({ x: itemX, y: itemY, size: itemSize, type: itemType, sprite });
}

// Função para desenhar o personagem
function drawCharacter(ctx, character, state, frameIndex, x, y, width, height, facingLeft) {
    const { row, colStart, colEnd } = character.frames[state];
    const sprite = character.sprite;
    const numFrames = colEnd - colStart + 1;
    const spriteWidth = sprite.width / 8;
    const spriteHeight = sprite.height / 4;

    const sx = (colStart + frameIndex) * spriteWidth;
    const sy = row * spriteHeight;

    ctx.save();
    if (facingLeft) {
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, sx, sy, spriteWidth, spriteHeight, -x - width, y, width, height);
    } else {
        ctx.drawImage(sprite, sx, sy, spriteWidth, spriteHeight, x, y, width, height);
    }
    ctx.restore();
}

// Função para atualizar o estado do jogo
function update(timestamp) {
    if (gameOver || gameWon) return;

    if (timestamp - lastFrameTime >= frameDuration) {
        frameIndex = (frameIndex + 1) % frameCount[catState];
        if (hitAnimationActive) {
            hitAnimationFrame = (hitAnimationFrame + 1) % frameCount.hurt;
            if (hitAnimationFrame === 0) {
                hitAnimationActive = false;
                hurtAnimationComplete = true; // Marca a animação de hurt como completa
            }
        }
        lastFrameTime = timestamp;
    }

    if (timestamp - lastEnemyFrameTime >= enemyFrameDuration) {
        enemies.forEach(enemy => {
            enemy.frameIndex = (enemy.frameIndex + 1) % 7;
        });
        lastEnemyFrameTime = timestamp;
    }

    if (timestamp - lastItemFrameTime >= itemFrameDuration) {
        spawnItem();
        lastItemFrameTime = timestamp;
    }

    if (!hitAnimationActive && hurtAnimationComplete) { // Executa os movimentos apenas se a animação de hurt estiver completa
        if ((keys.ArrowRight || keys.KeyD) && catX < canvas.width - catSize) {
            catX += selectedCharacter.speed;
            facingLeft = false;
            if (!isJumping) catState = 'walking';
        } else if ((keys.ArrowLeft || keys.KeyA) && catX > 0) {
            catX -= selectedCharacter.speed;
            facingLeft = true;
            if (!isJumping) catState = 'walking';
        } else if (!isJumping) {
            catState = 'idle';
        }

        if ((keys.ArrowUp || keys.KeyW) && catY > 0 && !isJumping) {
            isJumping = true;
            playSound(jumpSound);
            catVelocityY = selectedCharacter.jump;
            catState = 'jumping';
        }

        if (isJumping) {
            catVelocityY += gravity;
            catY += catVelocityY;
            if (catY > canvas.height - catSize - 10) {
                catY = canvas.height - catSize - 10;
                catVelocityY = 0;
                isJumping = false;
                if (keys.ArrowRight || keys.ArrowLeft || keys.KeyD || keys.KeyA) {
                    catState = 'walking';
                } else {
                    catState = 'idle';
                }
            }
        }
    }

    enemies.forEach(enemy => {
        enemy.x += enemy.direction * (currentPhase + 2); // Incremento mais gradual
        if (enemy.x < -enemy.width || enemy.x > canvas.width + enemy.width) {
            enemies.shift();
        }
    });

    items.forEach(item => {
        item.y += (currentPhase + 1); // Incremento mais gradual
        if (item.y > canvas.height + item.size) {
            items.shift();
        }
    });

    checkCollision();

    const timeLeft = Math.max(0, gameDuration - (Date.now() - startTime));

    if (health <= 0) {
        gameOver = true;
        playSound(gameOverSound);
        catState = 'hurt';
        document.getElementById('gameCanvas').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'block';
        document.getElementById('finalScore').textContent = points;
        requestAnimationFrame(drawGameOverScreen);
    }

    if (points >= 1000) {
        gameWon = true;
        proceedToNextPhase(); // Prosegue automaticamente para a próxima fase
    } else if (timeLeft <= 0) {
        gameOver = true;
        playSound(gameOverSound);
        document.getElementById('gameCanvas').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'block';
        document.getElementById('finalScore').textContent = points;
        requestAnimationFrame(drawGameOverScreen);
    }

    draw(timeLeft);
    requestAnimationFrame(update);
}

// Função para verificar colisões
function checkCollision() {
    enemies.forEach(enemy => {
        const enemyHitboxWidth = enemy.width * 0.8; // Reduz a hitbox para 80% do tamanho original
        const enemyHitboxHeight = enemy.height * 0.8; // Reduz a hitbox para 80% do tamanho original
        if (
            catX < enemy.x + enemyHitboxWidth &&
            catX + catSize > enemy.x &&
            catY < enemy.y + enemyHitboxHeight &&
            catY + catSize > enemy.y
        ) {
            if (hurtAnimationComplete) { // Inicia a animação de hurt apenas se a anterior estiver completa
                health -= 1;
                points = Math.max(0, points - 10);
                hitAnimationActive = true;
                hurtAnimationComplete = false; // Marca a animação de hurt como incompleta
                hitAnimationFrame = 0;
                catState = 'hurt';
                playSound(enemySound);
                playSound(catSound)
                enemies.splice(enemies.indexOf(enemy), 1);
            }
        }
    });

    items.forEach(item => {
        const itemHitboxSize = item.size * 0.8; // Reduz a hitbox para 80% do tamanho original
        if (
            catX < item.x + itemHitboxSize &&
            catX + catSize > item.x &&
            catY < item.y + itemHitboxSize &&
            catY + catSize > item.y
        ) {
            if (item.type === 0 || item.type === 1) {
                points += 50;
                playSound(pointPlusSound);
            } else {
                health -= 1;
                playSound(pointMinusSound);
                playSound(catSound)
                hitAnimationActive = true;
                hurtAnimationComplete = false; // Marca a animação de hurt como incompleta
                hitAnimationFrame = 0;
                catState = 'hurt';
            }
            items.splice(items.indexOf(item), 1);
        }
    });
}

// Função para desenhar a tela do jogo
function draw(timeLeft) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgrounds[currentPhase], 0, 0, canvas.width, canvas.height);

    drawCharacter(ctx, selectedCharacter, catState, frameIndex, catX, catY, catSize, catSize, facingLeft);

    enemies.forEach(enemy => {
        ctx.save();
        if (enemy.direction === 1) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                enemySprites[currentPhase],
                enemy.frameIndex * enemySprites[currentPhase].width / 7, 0,
                enemySprites[currentPhase].width / 7, enemySprites[currentPhase].height,
                -enemy.x - enemy.width, enemy.y,
                enemy.width, enemy.height
            );
        } else {
            ctx.drawImage(
                enemySprites[currentPhase],
                enemy.frameIndex * enemySprites[currentPhase].width / 7, 0,
                enemySprites[currentPhase].width / 7, enemySprites[currentPhase].height,
                enemy.x, enemy.y,
                enemy.width, enemy.height
            );
        }
        ctx.restore();
    });

    items.forEach(item => {
        ctx.drawImage(
            item.sprite,
            0, 0,
            item.sprite.width, item.sprite.height,
            item.x, item.y,
            item.size, item.size
        );
    });

    ctx.fillStyle = 'blueviolet';
    ctx.font = '18px monospace';
    ctx.fillText(`Points: ${points}`, 10, 40);
    ctx.fillText(`Time Left: ${(timeLeft / 1000).toFixed(1)}s`, canvas.width - 150, 20);

    drawLives();
}

// Função para desenhar a tela de game over
function drawGameOverScreen(timestamp) {
    const gameOverCanvas = document.getElementById('gameOverCanvas');
    const gameOverCtx = gameOverCanvas.getContext('2d');

    if (!gameOverCtx.startTime) {
        gameOverCtx.startTime = timestamp;
        gameOverCtx.frameIndex = 0;
    }

    const elapsed = timestamp - gameOverCtx.startTime;
    const frameDuration = 100;

    if (elapsed >= frameDuration) {
        gameOverCtx.frameIndex = (gameOverCtx.frameIndex + 1) % 7;
        gameOverCtx.startTime = timestamp;
    }

    gameOverCtx.clearRect(0, 0, gameOverCanvas.width, gameOverCanvas.height);
    gameOverCtx.drawImage(
        deathSprite,
        gameOverCtx.frameIndex * deathSprite.width / 7, 0,
        deathSprite.width / 7, deathSprite.height,
        0, 0,
        gameOverCanvas.width, gameOverCanvas.height
    );

    if (!gameOver) {
        gameOverCtx.startTime = null;
    } else {
        requestAnimationFrame(drawGameOverScreen);
    }
}

// Função para proceder para a próxima fase
function proceedToNextPhase() {
    if (currentPhase < 2) {
        currentPhase++;
        startPhase(currentPhase);
    } else {
        showFinalScreen();
    }
}

// Função para mostrar a tela final de vitória
function showFinalScreen() {
    document.getElementById('winScreen').innerHTML = `
        <h1>Parabéns, você é um mestre gatinho!</h1>
        <canvas id="winCanvas" width="200" height="200"></canvas>
        <p>Your final score: <span id="winScore">${points}</span></p>
        <div>
            <button class="botao1" onclick="location.reload()">Play Again</button>
        </div>
    `;
    document.getElementById('winScreen').style.display = 'block';
    canvas.style.display = 'none';

    const winCanvas = document.getElementById('winCanvas');
    const winCtx = winCanvas.getContext('2d');
    const spriteWidth = blackCatSprite.width / 15;
    const spriteHeight = blackCatSprite.height;

    let frameIndex = 0;
    let lastFrameTime = 0;
    const frameDuration = 200; // Duração de cada quadro em milissegundos

    function drawWinFrame(timestamp) {
        if (!lastFrameTime) lastFrameTime = timestamp;
        const elapsed = timestamp - lastFrameTime;

        if (elapsed > frameDuration) {
            winCtx.clearRect(0, 0, winCanvas.width, winCanvas.height);
            winCtx.drawImage(
                blackCatSprite,
                frameIndex * spriteWidth, 0,
                spriteWidth, spriteHeight,
                0, 0,
                winCanvas.width, winCanvas.height
            );
            frameIndex = (frameIndex + 1) % 15;
            lastFrameTime = timestamp;
        }

        requestAnimationFrame(drawWinFrame);
    }
    requestAnimationFrame(drawWinFrame);
}

// Função para carregar todas as imagens
function allImagesLoaded(images, callback) {
    let loadedCount = 0;
    images.forEach(image => {
        image.onload = () => {
            loadedCount++;
            if (loadedCount === images.length) {
                callback();
            }
        };
        image.onerror = () => {
            console.error('Failed to load image:', image.src);
        };
    });
}

// Lista de todas as imagens a serem carregadas
const images = [
    ...backgrounds,
    characters.fast.sprite,
    characters.balanced.sprite,
    characters.highJumper.sprite,
    ...enemySprites,
    milkSprite,
    catfoodSprite,
    poisonSprite,
    rottenMeatSprite,
    hitSprite,
    blackCatSprite,
    deathSprite,
    lifeIcon,
    deathIcon
];

// Carrega todas as imagens e inicia o jogo quando concluído
allImagesLoaded(images, () => {
    console.log('All images loaded');
    document.getElementById('startScreen').style.display = 'block';
});

// Configura um intervalo para spawnar inimigos
setInterval(spawnEnemy, 3000 - currentPhase * 500); // Ajusta a frequência de spawn para ser mais suave
