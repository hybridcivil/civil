/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NumVocalis Web Audio Synthesizer
 * Plays numeric sentences with distinct acoustic variations:
 * - Vowels: Bright, resonant bell/sine tones
 * - Consonants: Rich, lower frequency triangle/saw tones
 * - Word Separator (00): Soft click / woodblock pause
 */

class AudioSynthEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private stopRequested = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getContext(): AudioContext {
    return this.initContext();
  }

  /**
   * Play a single tone corresponding to a character/token
   */
  public playTone(freq: number, type: 'vowel' | 'consonant' | 'separator' | 'punctuation' | 'digit', durationMs = 180): Promise<void> {
    const ctx = this.initContext();
    return new Promise((resolve) => {
      const now = ctx.currentTime;
      const durationSec = durationMs / 1000;

      if (type === 'separator') {
        // Soft woodblock click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + durationSec * 0.4);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec * 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + durationSec * 0.4);

        setTimeout(resolve, durationMs);
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'vowel') {
        // High, pure bell sine chime with harmonic overtone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Add a soft second harmonic
        const overtone = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(freq * 2, now);
        overtoneGain.gain.setValueAtTime(0.04, now);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
        overtone.connect(overtoneGain);
        overtoneGain.connect(ctx.destination);
        overtone.start(now);
        overtone.stop(now + durationSec);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
      } else if (type === 'consonant') {
        // Textured triangle with fast percussive decay
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
      } else {
        // Digits / Punctuation
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);

        osc.connect(filter);
        filter.connect(gain);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + durationSec);

        setTimeout(resolve, durationMs);
        return;
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationSec);

      setTimeout(resolve, durationMs);
    });
  }

  /**
   * Play an entire sequence of tokens
   */
  public async playSequence(
    tokens: { frequencyHz: number; type: 'vowel' | 'consonant' | 'separator' | 'punctuation' | 'digit'; code: string }[],
    speedMultiplier = 1,
    onStep?: (index: number) => void,
    onComplete?: () => void
  ): Promise<void> {
    if (this.isPlaying) {
      this.stop();
    }

    this.isPlaying = true;
    this.stopRequested = false;

    const baseDuration = Math.max(60, Math.floor(180 / speedMultiplier));

    for (let i = 0; i < tokens.length; i++) {
      if (this.stopRequested) break;

      const tok = tokens[i];
      if (onStep) onStep(i);

      // Add a slight pause for word separation
      const duration = tok.type === 'separator' ? baseDuration * 1.4 : baseDuration;
      await this.playTone(tok.frequencyHz, tok.type, duration);
    }

    this.isPlaying = false;
    this.stopRequested = false;
    if (onStep) onStep(-1);
    if (onComplete) onComplete();
  }

  public stop() {
    this.stopRequested = true;
    this.isPlaying = false;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioSynth = new AudioSynthEngine();
