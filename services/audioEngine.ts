import { Note } from '../types';

/**
 * A simple synthesizer to generate FNF-style music procedurally.
 * This avoids the need for external MP3 files.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private lookahead = 25.0; 
  private scheduleAheadTime = 0.1; 
  private nextNoteIndex = 0;
  private notes: Note[] = [];
  private bpm = 120;
  private startTime = 0;
  private timerID: number | null = null;

  // Menu Music State
  private isMenuMusicPlaying: boolean = false;
  private menuLoopID: number | null = null;

  // Drum patterns
  private kickBuffer: AudioBuffer | null = null;
  private snareBuffer: AudioBuffer | null = null;
  private hatBuffer: AudioBuffer | null = null;

  constructor() {
    // Lazy init
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Prevent clipping
      this.masterGain.connect(this.ctx.destination);
      this.createDrumBuffers();
    }
  }

  public async resumeContext() {
    this.initContext();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  private createDrumBuffers() {
    if (!this.ctx) return;
    
    // Simple Kick
    const kLen = this.ctx.sampleRate * 0.1;
    this.kickBuffer = this.ctx.createBuffer(1, kLen, this.ctx.sampleRate);
    const kData = this.kickBuffer.getChannelData(0);
    for(let i=0; i<kLen; i++) kData[i] = Math.sin(i * 0.01) * Math.exp(-i * 0.005);

    // Simple Snare (Noise)
    const sLen = this.ctx.sampleRate * 0.1;
    this.snareBuffer = this.ctx.createBuffer(1, sLen, this.ctx.sampleRate);
    const sData = this.snareBuffer.getChannelData(0);
    for(let i=0; i<sLen; i++) sData[i] = (Math.random() * 2 - 1) * Math.exp(-i * 0.01);
    
    // Hat
    const hLen = this.ctx.sampleRate * 0.05;
    this.hatBuffer = this.ctx.createBuffer(1, hLen, this.ctx.sampleRate);
    const hData = this.hatBuffer.getChannelData(0);
    for(let i=0; i<hLen; i++) hData[i] = (Math.random() * 2 - 1) * Math.exp(-i * 0.05); 
  }

  // --- SFX SYSTEM ---
  public playSFX(type: 'scroll' | 'confirm' | 'back') {
    if (!this.ctx || !this.masterGain) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    gain.connect(this.masterGain);
    osc.connect(gain);

    const now = this.ctx.currentTime;

    if (type === 'scroll') {
      // High blip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'confirm') {
      // Affirmative melody
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.05); // C#
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.21);
    } else if (type === 'back') {
      // Cancel low blip
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.11);
    }
  }

  private playTone(time: number, freq: number, type: 'square' | 'sawtooth' | 'sine', duration: number = 0.1) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(time);
    osc.stop(time + duration + 0.1);
  }

  private playDrum(time: number, type: 'kick' | 'snare' | 'hat') {
    if (!this.ctx || !this.masterGain) return;
    const src = this.ctx.createBufferSource();
    if (type === 'kick') src.buffer = this.kickBuffer;
    else if (type === 'snare') src.buffer = this.snareBuffer;
    else src.buffer = this.hatBuffer;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(type === 'hat' ? 0.3 : 0.8, time);
    
    src.connect(gain);
    gain.connect(this.masterGain);
    src.start(time);
  }

  // Frequencies mapped to directions
  private getFreq(direction: string, isPlayer: boolean) {
    const base = isPlayer ? 440 : 220;
    switch(direction) {
      case 'left': return base;
      case 'down': return base * 1.125;
      case 'up': return base * 1.25;
      case 'right': return base * 1.5;
      default: return base;
    }
  }

  // --- MENU MUSIC LOGIC ---
  public startMenuMusic() {
    if (this.isMenuMusicPlaying) return;
    this.initContext();
    this.isMenuMusicPlaying = true;
    this.bpm = 102; // Slower "Menu" BPM
    this.nextBeatTime = this.ctx!.currentTime + 0.1;
    this.scheduleMenuBeat();
  }

  public stopMenuMusic() {
    this.isMenuMusicPlaying = false;
    if (this.menuLoopID) {
      cancelAnimationFrame(this.menuLoopID);
      this.menuLoopID = null;
    }
  }

  private scheduleMenuBeat() {
    if (!this.ctx || !this.isMenuMusicPlaying) return;

    const secondsPerBeat = 60.0 / this.bpm;
    
    while (this.nextBeatTime < this.ctx.currentTime + this.scheduleAheadTime) {
       // Simple chill beat
       const time = this.nextBeatTime;
       this.playTone(time, 110, 'sine', 0.3);
       this.playDrum(time, 'hat');
       if (Math.floor(time * 2) % 2 === 0) {
          this.playDrum(time, 'kick');
       } else {
          this.playTone(time, 165, 'sine', 0.1); // Harmony
       }
       this.nextBeatTime += secondsPerBeat;
    }
    
    if(this.isMenuMusicPlaying) {
         this.menuLoopID = requestAnimationFrame(this.scheduleMenuBeat.bind(this));
    }
  }

  // --- GAME LOGIC ---

  private scheduler() {
    if (!this.ctx || !this.isPlaying) return;
    
    while (this.nextNoteIndex < this.notes.length && this.notes[this.nextNoteIndex].time / 1000 < this.ctx.currentTime - this.startTime + this.scheduleAheadTime) {
      this.scheduleNote(this.notes[this.nextNoteIndex]);
      this.nextNoteIndex++;
    }
    
    if (this.isPlaying) {
      this.timerID = window.setTimeout(this.scheduler.bind(this), this.lookahead);
    }
  }
  
  private scheduleNote(note: Note) {
    if (!this.ctx) return;
    const playTime = this.startTime + (note.time / 1000);
    
    if (note.type === 'player') {
      this.playTone(playTime, this.getFreq(note.direction, true), 'square', 0.15);
    } else {
      this.playTone(playTime, this.getFreq(note.direction, false), 'sawtooth', 0.15);
    }
  }

  public async start(songBpm: number, songNotes: Note[]) {
    this.stopMenuMusic(); // Ensure menu music stops
    this.stop(); // Stop any previous game audio

    this.initContext();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }

    this.bpm = songBpm;
    this.notes = songNotes.sort((a, b) => a.time - b.time);
    this.nextNoteIndex = 0;
    this.isPlaying = true;
    this.startTime = this.ctx!.currentTime + 0.1;
    
    this.nextBeatTime = this.startTime;
    
    this.scheduler();
    this.scheduleBeat();
  }

  private nextBeatTime = 0;
  private scheduleBeat() {
    if(!this.ctx || !this.isPlaying) return;

    const secondsPerBeat = 60.0 / this.bpm;
    
    while (this.nextBeatTime < this.ctx.currentTime + this.scheduleAheadTime) {
       const beatIndex = Math.round((this.nextBeatTime - this.startTime) / secondsPerBeat);
       
       if (beatIndex % 2 === 0) {
           this.playDrum(this.nextBeatTime, 'kick');
       } else {
           this.playDrum(this.nextBeatTime, 'snare');
       }
       this.playDrum(this.nextBeatTime, 'hat');
       this.playDrum(this.nextBeatTime + (secondsPerBeat/2), 'hat');

       this.nextBeatTime += secondsPerBeat;
    }
    
    if(this.isPlaying) {
         requestAnimationFrame(this.scheduleBeat.bind(this));
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
    this.nextNoteIndex = 0;
    this.nextBeatTime = 0;
  }

  public getCurrentTime(): number {
    if (!this.ctx || !this.isPlaying) return 0;
    return (this.ctx.currentTime - this.startTime) * 1000;
  }
  
  public playFeedback(direction: string) {
     if(this.ctx) {
         this.playTone(this.ctx.currentTime, this.getFreq(direction, true), 'square', 0.1);
     }
  }
}

export const audioService = new AudioEngine();