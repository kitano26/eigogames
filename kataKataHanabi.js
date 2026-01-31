class KataKataHanabi extends Phaser.Scene {
    constructor() {
        super({ key: 'KataKataHanabi' });
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
        this.load.image('fireworkTrail', 'assets/images/fireworkTrail.png');
    }

    /**
     * Set up the scene
     */
    create() {
        // Add launcher sprite
        this.launcherXInitial = 0;
        this.launcherYInitial = 250;

        this.launcher = this.add.sprite(this.launcherXInitial, this.launcherYInitial, 'redLauncher');
        this.launcher.setScale(0.1);
        this.launcher.xSpeed = 0.8;
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
        this.wordList = ['hanabi', 'firework', 'sparkle', 'rocket'];
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
    }

    /**
     * Update scene
     */
    update() {
        // Move launcher
        this.launcher.x += this.launcher.xSpeed;

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

        const key = event.key.toLowerCase();    // Normalize to lowercase
        
        // Only process a-z keys
        if (key.length === 1 && key >= 'a' && key <= 'z') {
            // Check if key matches next letter in target word
            if (key === this.targetWord.charAt(this.userInput.length)) {
                this.userInput += key;                                              // Append key to user input
                this.correctText = `[color=green]${this.userInput}[/color]`;        // Only make correct letters in green
                this.targetWordText.setText(this.correctText + this.targetWord.slice(this.userInput.length)); // Update displayed text
            }

            // Check if user input matches target word
            if (this.userInput === this.targetWord) {
                // Stop moving launcher temporarily
                this.launcher.xSpeed = 0;
                this.launcher.x

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

    /**
     * Launch firework from (x, y)
     */
    launchFirework() {
        this.launcher.setTexture('redLauncherFired');
        this.launcher.angle = Phaser.Math.Between(-30, 30); // slight random angle
        
        // Move rocket up using a tween
        this.tweens.add({
            targets: this.launcher,
            y: Phaser.Math.Between(this.launcher.y - 200, this.launcher.y - 100),  // height of the launch
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
                    this.launcher.xSpeed = 0.8;
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
}


/**
 * Phaser game configuration
 */
const config = {
    type: Phaser.AUTO,
    width: 800,
	height: 360,
	backgroundColor: "#0b1c2d",
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    scene: KataKataHanabi,
}

const game = new Phaser.Game(config)
