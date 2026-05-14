const AudioFX = (() => {
  let context;
  let master;
  let enabled = false;

  function init() {
    if (context) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }

    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0.28;
    master.connect(context.destination);
  }

  function unlock() {
    init();

    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      context.resume();
    }

    enabled = true;
  }

  function tone({ frequency, duration, type = "sine", volume = 0.25, slideTo }) {
    if (!context || !enabled) {
      return;
    }

    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);

    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  function noise({ duration = 0.25, volume = 0.16, filter = 900 }) {
    if (!context || !enabled) {
      return;
    }

    const bufferSize = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = context.createBufferSource();
    const gain = context.createGain();
    const biquad = context.createBiquadFilter();
    const now = context.currentTime;

    biquad.type = "bandpass";
    biquad.frequency.setValueAtTime(filter, now);
    biquad.frequency.exponentialRampToValueAtTime(filter * 2.8, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.buffer = buffer;
    source.connect(biquad);
    biquad.connect(gain);
    gain.connect(master);
    source.start(now);
  }

  function planetChange() {
    noise({ duration: 0.32, volume: 0.1, filter: 520 });
    tone({ frequency: 180, slideTo: 520, duration: 0.28, type: "triangle", volume: 0.14 });
    setTimeout(() => {
      tone({ frequency: 740, slideTo: 980, duration: 0.12, type: "sine", volume: 0.08 });
    }, 80);
  }

  function openPanel() {
    tone({ frequency: 260, slideTo: 620, duration: 0.18, type: "sine", volume: 0.16 });
    setTimeout(() => {
      tone({ frequency: 880, duration: 0.12, type: "triangle", volume: 0.11 });
    }, 90);
  }

  function closePanel() {
    tone({ frequency: 520, slideTo: 180, duration: 0.18, type: "triangle", volume: 0.13 });
    noise({ duration: 0.16, volume: 0.06, filter: 420 });
  }

  function hover() {
    tone({ frequency: 880, duration: 0.045, type: "sine", volume: 0.045 });
  }

  return {
    unlock,
    planetChange,
    openPanel,
    closePanel,
    hover
  };
})();

document.addEventListener("pointerdown", AudioFX.unlock, { once: true });
document.addEventListener("keydown", AudioFX.unlock, { once: true });

document.querySelectorAll("label.menu").forEach((planetButton) => {
  planetButton.addEventListener("click", () => {
    AudioFX.unlock();
    AudioFX.planetChange();
  });

  planetButton.addEventListener("mouseenter", () => {
    AudioFX.hover();
  });
});

document.querySelectorAll(".planet_description label").forEach((readButton) => {
  readButton.addEventListener("click", () => {
    AudioFX.unlock();
    AudioFX.openPanel();
  });
});

document.querySelectorAll(".closeBig").forEach((closeButton) => {
  closeButton.addEventListener("click", () => {
    AudioFX.unlock();
    AudioFX.closePanel();
  });
});
