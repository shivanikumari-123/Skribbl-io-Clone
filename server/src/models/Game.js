export class Game {
  constructor(settings, onStateChange, onTick, onRoundEnd, onHintUpdate) {
    this.settings = settings || {
      rounds: 3,
      drawTime: 80,
      wordCategory: 'general',
      hints: 2,
    };
    
    this.onStateChange = onStateChange;
    this.onTick = onTick;
    this.onRoundEnd = onRoundEnd;
    this.onHintUpdate = onHintUpdate;

    this.phase = 'LOBBY'; // LOBBY, WORD_CHOICE, DRAWING, ROUND_END, GAME_OVER
    this.currentRound = 1;
    this.totalRounds = this.settings.rounds || 3;
    this.currentDrawerId = null;
    this.currentWord = '';
    this.currentHintMask = '';
    this.wordChoices = [];
    this.players = [];
    this.drawerQueue = [];
    this.timer = null;
    this.timeLeft = 0;
    this.canvasHistory = [];

    // Full word lists by category
    this.wordLists = {
      general: ['pizza', 'apple', 'banana', 'guitar', 'house', 'rocket', 'castle', 'dolphin', 'dragon', 'laptop', 'bicycle', 'camera'],
      animals: ['elephant', 'penguin', 'kangaroo', 'giraffe', 'octopus', 'cheetah', 'koala', 'flamingo', 'hedgehog'],
      objects: ['keyboard', 'umbrella', 'backpack', 'telescope', 'microscope', 'compass', 'lantern', 'anchor']
    };
  }

  getWordList() {
    const category = this.settings.wordCategory || 'general';
    return this.wordLists[category] || this.wordLists.general;
  }

  start(players) {
    if (!players || players.length < 2) return false;

    this.players = players;
    this.currentRound = 1;
    this.phase = 'WORD_CHOICE';
    this.drawerQueue = [...players.map((p) => p.id)];
    
    this.players.forEach((p) => {
      p.score = 0;
      p.hasGuessed = false;
    });

    this.startNextTurn();
    return true;
  }

  startNextTurn() {
    this.clearTimer();
    this.canvasHistory = [];

    if (this.drawerQueue.length === 0) {
      if (this.currentRound >= this.totalRounds) {
        this.phase = 'GAME_OVER';
        this.onStateChange();
        this.onRoundEnd();
        return;
      } else {
        this.currentRound++;
        this.drawerQueue = [...this.players.map((p) => p.id)];
      }
    }

    this.currentDrawerId = this.drawerQueue.shift();
    this.phase = 'WORD_CHOICE';

    this.players.forEach((p) => {
      p.hasGuessed = false;
    });

    const pool = this.getWordList();
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    this.wordChoices = shuffled.slice(0, 3);
    this.currentWord = '';
    this.currentHintMask = '';

    this.timeLeft = 15; // 15 seconds to choose a word
    this.onStateChange();

    this.timer = setInterval(() => {
      this.timeLeft--;
      this.onTick(this.timeLeft);

      if (this.timeLeft <= 0) {
        const defaultWord = this.wordChoices[0] || 'pizza';
        this.selectWord(defaultWord);
      }
    }, 1000);
  }

  selectWord(word) {
    if (this.phase !== 'WORD_CHOICE') return;

    this.clearTimer();

    const wordText = typeof word === 'string' ? word : (word?.word || word?.text || this.wordChoices[0] || '');
    this.currentWord = wordText.trim().toLowerCase();
    
    this.phase = 'DRAWING';
    this.currentHintMask = this.currentWord.replace(/[a-zA-Z]/g, '_');
    this.timeLeft = this.settings.drawTime || 80;

    this.onStateChange();

    const hintIntervals = this.calculateHintIntervals();

    this.timer = setInterval(() => {
      this.timeLeft--;
      this.onTick(this.timeLeft);

      if (hintIntervals.includes(this.timeLeft)) {
        this.revealNextHint();
      }

      if (this.timeLeft <= 0) {
        this.endRound();
      }
    }, 1000);
  }

  calculateHintIntervals() {
    const hintCount = this.settings.hints || 2;
    const interval = Math.floor(this.timeLeft / (hintCount + 1));
    const times = [];
    for (let i = 1; i <= hintCount; i++) {
      times.push(this.timeLeft - interval * i);
    }
    return times;
  }

  revealNextHint() {
    if (!this.currentWord) return;
    const wordArray = this.currentWord.split('');
    const maskArray = this.currentHintMask.split('');

    const hiddenIndices = [];
    maskArray.forEach((char, idx) => {
      if (char === '_') hiddenIndices.push(idx);
    });

    if (hiddenIndices.length <= 1) return;

    const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    maskArray[randomIndex] = wordArray[randomIndex];
    this.currentHintMask = maskArray.join('');

    if (typeof this.onHintUpdate === 'function') {
      this.onHintUpdate(this.currentHintMask);
    }
  }

  checkGuess(input) {
    if (this.phase !== 'DRAWING' || !this.currentWord) {
      return { isCorrect: false, isClose: false };
    }

    const guessText = typeof input === 'string' ? input : (input?.text || input?.word || '');
    const cleanGuess = guessText.trim().toLowerCase();
    const target = this.currentWord.trim().toLowerCase();

    if (cleanGuess === target) {
      return { isCorrect: true, isClose: false };
    }

    if (this.isCloseGuess(cleanGuess, target)) {
      return { isCorrect: false, isClose: true };
    }

    return { isCorrect: false, isClose: false };
  }

  isCloseGuess(guess, target) {
    if (Math.abs(guess.length - target.length) > 2) return false;
    let diff = 0;
    const maxLen = Math.max(guess.length, target.length);
    for (let i = 0; i < maxLen; i++) {
      if (guess[i] !== target[i]) diff++;
    }
    return diff <= 2 && diff > 0;
  }

  calculatePoints() {
    const base = 100;
    const timeBonus = Math.floor((this.timeLeft / (this.settings.drawTime || 80)) * 400);
    return base + Math.max(0, timeBonus);
  }

  endRound() {
    this.clearTimer();
    this.phase = 'ROUND_END';
    this.currentHintMask = this.currentWord;
    this.onStateChange();
    this.onRoundEnd();

    setTimeout(() => {
      if (this.phase !== 'GAME_OVER') {
        this.startNextTurn();
      }
    }, 5000);
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}