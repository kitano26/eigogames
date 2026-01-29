function create () {
    // store current user input
    this.currentInput = ''; 

    // Display user input text
    this.userText = this.add.text(10, 10, 'HELLO', {
        fontFamily: 'Arial',
        fontSize: 32,
        color: '#000000',
    });

    // Listen for keyboard input
	this.input.keyboard.on('keydown', (event) => {
        if (event.repeat) {
            return;
        }

		const key = event.key.toLowerCase();

        // only process 1 key at a time a-z only
        if (key.length === 1 && key >= 'a' && key <= 'z') {
            this.currentInput += key;                       // append key to current input
            this.userText.setText(this.currentInput);       // update displayed text
            console.log(this.currentInput);
        }

        if(key === 'backspace') {
            this.currentInput = this.currentInput.slice(0, -1); // remove last character
            this.userText.setText(this.currentInput);           // update displayed text
        }

        if(key === 'enter') {
            this.currentInput = '';                             // clear input
            this.userText.setText(this.currentInput);           // update displayed text
        }

	});
}


const config = {
  type: Phaser.AUTO,
  width: 640,
	height: 360,
	backgroundColor: "b9eaff",

  scene: {
		create
	}
}

const game = new Phaser.Game(config)
