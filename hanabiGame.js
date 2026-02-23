class HanabiGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HanabiGameScene' });
    }

    /**
     * Load assets into scene
     */
    preload() {
        // Load BBCode text plugin
        this.load.plugin('rexbbcodetextplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexbbcodetextplugin.min.js', true);
        
        // Load images
        this.load.image('redLauncher', 'assets/images/redLauncher.png');
        this.load.image('redLauncherFired', 'assets/images/redLauncherFired.png');
        this.load.image('spark', 'assets/particles/fireworkSpark.png');

        // Load word list
        this.load.text('words', 'assets/myPicDict.csv');
    }

    /**
     * Set up the gameplay scene
     */
    create() {
        // Initialize game state
        this.gameState = 'playing'; // can be 'playing' or 'gameOver'

        // Add launcher sprite
        this.launcherXInitial = 50;
        this.launcherYInitial = 250;

        this.launcher = this.add.sprite(this.launcherXInitial, this.launcherYInitial, 'redLauncher');
        this.launcher.isMoving = true;
        this.launcher.setScale(0.1);
        this.launcher.setDepth(-1); // send to back

        // Word box configuration
        const wordBoxWidth = 300;
        const wordBoxHeight = 60;
        const wordBoxX = (this.scale.width - wordBoxWidth) / 2;
        const wordBoxY = 280;

        // Draw word box
        this.wordBox = this.add.rectangle(wordBoxX, wordBoxY, wordBoxWidth, wordBoxHeight, 0xffffff);
        this.wordBox.setOrigin(0, 0); // top-left origin
        this.wordBox.setStrokeStyle(3, 0x00000); // border color and thickness

        // Load word list and set current target word
        const raw = this.cache.text.get('words');
        this.wordList = raw.split('\n').slice(1) .map(w => w.trim()).filter(w => /^[a-z ]+$/.test(w));
        this.targetWord =  Phaser.Math.RND.pick(this.wordList);

        // Display target word text
        this.targetWordText = this.add.rexBBCodeText(wordBoxX, wordBoxY, this.targetWord, {
            fontFamily: 'Comic Sans MS',
            fontSize: 36,
            color: '#666666ff'
        });
        this.targetWordText.setOrigin(0.5, 0.5);
        this.targetWordText.setPosition(wordBoxX + wordBoxWidth / 2, wordBoxY + wordBoxHeight / 2);
        this.targetWordText.setDepth(1); // bring to front
 
        // Store user input
        this.userInput = ''; 

        // Listen for keyboard input
        this.input.keyboard.on('keydown', this.handleKey, this);

        // Timer: 60-second countdown
        this.timeLeft = 60; // seconds
        this.timerText = this.add.text(this.scale.width - 20,
            20,
            `Time: ${this.timeLeft}`,
            {
                fontSize: '28px',
                color: '#ffd700',
                stroke: '#ffffffff',
                strokeThickness: 2
            }
            ).setOrigin(1, 0);

        this.timerText.setShadow(0, 0, '#ff00f2ff', 15, true, true);  

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.onTimerTick,
            callbackScope: this,
            loop: true
        });

        // Score
        this.score = 0;
        this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
            fontSize: '28px',
            color: '#ffffff'
        });

        // Create game over texts
        // Show game over text
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        this.gameOverText = this.add.text(centerX, centerY - 20, 'Game Over', {
            fontSize: '48px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.gameOverText.setVisible(false); // hide until game over
        
        this.highScoreText = this.add.text(centerX, centerY + 50, 'NEW HIGH SCORE!', {
            fontSize: '32px',
            color: '#72d677ff'
        }).setOrigin(0.5);
        this.highScoreText.setVisible(false); // hide until game over

        this.finalScoreText = this.add.text(centerX, centerY + 90, `Final Score: ${this.score}`, {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.finalScoreText.setVisible(false); // hide until game over

    }

    /**
     * Update scene each frame  
     */
    update(time, delta) {
        // Move launcher across screen
        if (!this.launcher.isMoving) {
            return;
        }

        const percentPerSecond = 0.2; // 20% of screen width per second
        const xSpeed = this.scale.width * percentPerSecond;

        this.launcher.x += xSpeed * (delta / 1000);

        // Reset if launcher goes off screen
        if (this.launcher.x > this.scale.width) {
            this.launcher.x = this.launcherXInitial;
            this.launcher.y = this.launcherYInitial;
            
            // Reset target word and user input
            this.setNewTargetWord();
            this.userInput = '';
            this.correctText = '';
        }
    }

    /**********************
     *   CUSTOM METHODS   *
     **********************/
    
    /**
     * Set new target word
     */
    setNewTargetWord() {
        this.targetWord = Phaser.Math.RND.pick(this.wordList);
        this.targetWordText.setText(this.targetWord);
    }
    
    /**
     * Handle keyboard input
     */
    handleKey(event) {
        if (event.repeat) {
            return;
        }

        if (this.gameState  === 'gameOver') {
            if (event.key === "Enter") {
                console.log("Restarting game...");
                this.restartGame();
            }
            return;
        }

        if (this.gameState === "playing") {
            const key = event.key.toLowerCase();    // Normalize to lowercase
        
            // Only process a-z or space keys
            if (/^[a-z ]$/.test(key)) {
                // Check if key matches next letter in target word
                if (key === this.targetWord.charAt(this.userInput.length)) {
                    this.userInput += key;                                              // Append key to user input
                    this.correctText = `[color=green]${this.userInput}[/color]`;        // Only make correct letters in green
                    this.targetWordText.setText(this.correctText + this.targetWord.slice(this.userInput.length)); // Update displayed text
                }

                // Check if user input matches target word
                if (this.userInput === this.targetWord) {
                    // Increment score
                    this.score += 100;
                    this.scoreText.setText(`Score: ${this.score}`);

                    // Stop moving launcher temporarily
                    this.launcher.isMoving = false;

                    // Launch firework
                    this.launchFirework();

                    // Select new target word
                    this.setNewTargetWord();

                    // Clear user input
                    this.userInput = '';
                    this.correctText = '';
                }
            }
        }
    }

    /**
     * Launch firework from (x, y)
     */
    launchFirework() {
        this.launcher.setTexture('redLauncherFired');
        this.launcher.angle = Phaser.Math.Between(-30, 30); // slight random angle
        
        // Move rocket up using a tween
        this.tweens.add({
            targets: this.launcher,
            y: Phaser.Math.Between(this.launcher.y - 120, this.launcher.y - 50),  // height of the launch
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                this.launcher.setVisible(false);
                // explode when reached top
                this.explodeFirework(this.launcher.x, this.launcher.y);

                // Reset launcher position after explosion
                this.time.delayedCall(600, () => {
                    this.launcher.setTexture('redLauncher');
                    this.launcher.setVisible(true);
                    this.launcher.angle = 0;
                    this.launcher.x = this.launcherXInitial;
                    this.launcher.y = this.launcherYInitial;
                    this.launcher.isMoving = true;
                });
            }
        });
    }

    /**
     * Create firework explosion at (x, y)
     */
    explodeFirework(x, y) {
        const emitter = this.add.particles(x, y, 'spark', {
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.2, end: 0 },
            lifespan: { min: 300, max: 600 },
            blendMode: 'ADD',
            quantity: 500,
            tint: [     
                0xFF0000, // deep red
                0xFF4500, // orange red
                0xFFA500, // orange
                0xFFD700, // gold
                0xFFFF00, // yellow
        ]

        });

        emitter.explode(50);
    }

    /**
     * End the game and show final score
     */
    endGame() {
        this.gameState = 'gameOver';
        this.timerEvent.remove(false); // stop timer
        this.launcher.isMoving = false; // stop launcher movement
        this.targetWordText.setText(''); // Clear target word
        this.wordBox.setVisible(false); // Hide word box           

        this.gameOverText.setVisible(true);
        this.finalScoreText.setText(`Final Score: ${this.score}`);
        this.finalScoreText.setVisible(true);

        // Get saved high score
        const savedHighScore = localStorage.getItem('kataHanabiHighScore');

        // If no high score yet OR new score is higher
        if (!savedHighScore || this.score > parseInt(savedHighScore)) {
            localStorage.setItem('kataHanabiHighScore', this.score);
            this.highScoreText.setVisible(true);
        }
    }

    /**
     * Timer tick event
     */
    onTimerTick() {
        if (this.gameState === 'gameOver') {
            return;
        }

        this.timeLeft--;

        // Update timer text
        this.timerText.setText(`Time: ${this.timeLeft}`);

        // Check for game over
        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    /**
     * Restart the game
     */
    restartGame() {
        this.scene.restart();
    }
}
