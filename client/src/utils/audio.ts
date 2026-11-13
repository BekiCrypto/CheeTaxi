class SoundEffects {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playBeep(freq = 600, type: OscillatorType = 'sine', duration = 0.15) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio playback can be silenced if user hasn't interacted
    }
  }

  playIncomingRideAlert() {
    this.playBeep(880, 'triangle', 0.2);
    setTimeout(() => this.playBeep(1100, 'triangle', 0.25), 180);
    setTimeout(() => this.playBeep(1320, 'triangle', 0.3), 360);
  }

  playRideAccepted() {
    this.playBeep(523.25, 'sine', 0.15); // C5
    setTimeout(() => this.playBeep(659.25, 'sine', 0.15), 150); // E5
    setTimeout(() => this.playBeep(783.99, 'sine', 0.3), 300); // G5
  }

  playPaymentSuccess() {
    this.playBeep(587.33, 'sine', 0.15); // D5
    setTimeout(() => this.playBeep(880, 'sine', 0.35), 160); // A5
  }
}

export const sounds = new SoundEffects();
