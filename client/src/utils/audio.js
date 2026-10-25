// Simple Web Audio API sound effects for game events
class SoundEffects {
  playPop() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Audio context might be blocked before user interaction
    }
  }

  playWin() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [300, 400, 500, 600];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.1);
      });
    } catch (e) {}
  }
}

export const sounds = new SoundEffects();