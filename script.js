/**
 * A História de Apolo - Motor Interativo
 * Recursos:
 * - Música Calma Medieval (Lira/Harpa & Lareira) nos Capítulos 1 a 4
 * - Transição Automática de Cor para Modo Escuro no Capítulo 5 em diante
 * - Música de Batalha (Tambores de Guerra & Tensão Arcana) no Capítulo 5 em diante
 * - Crossfade suave de áudio & partículas dinâmicas
 */

document.addEventListener('DOMContentLoaded', () => {

    /* --------------------------------------------------------------------------
       1. Canvas de Partículas (Brasas Aconchegantes <-> Almas Espectrais)
       -------------------------------------------------------------------------- */
    const canvas = document.getElementById('ambient-canvas');
    let ctx = null;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const particles = [];
    const PARTICLE_COUNT = 35;

    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = height + Math.random() * 40;
                this.size = Math.random() * 2.2 + 1;
                this.speedY = Math.random() * 0.6 + 0.3;
                this.speedX = (Math.random() - 0.5) * 0.4;
                this.alpha = Math.random() * 0.5 + 0.2;
                this.fadeRate = Math.random() * 0.003 + 0.001;
            }

            update() {
                this.y -= this.speedY;
                this.x += this.speedX;
                this.alpha -= this.fadeRate;
                if (this.alpha <= 0 || this.y < -10) {
                    this.reset();
                }
            }

            draw() {
                const isGrimoire = document.body.classList.contains('theme-grimoire');
                const color = isGrimoire
                    ? (Math.random() > 0.3 ? '56, 214, 184' : '120, 255, 230')
                    : (Math.random() > 0.3 ? '240, 165, 70' : '220, 90, 30');

                ctx.save();
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${color}, ${this.alpha})`;
                ctx.shadowBlur = isGrimoire ? 8 : 4;
                ctx.shadowColor = `rgba(${color}, 0.7)`;
                ctx.fill();
                ctx.restore();
            }
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = new Particle();
            p.y = Math.random() * height;
            particles.push(p);
        }

        function animateParticles() {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    /* --------------------------------------------------------------------------
       2. Motor de Áudio Web Audio API (Trilha Calma & Trilha de Batalha)
       -------------------------------------------------------------------------- */
    let audioCtx = null;
    let isAudioPlaying = false;
    let currentAudioMode = 'calm'; // 'calm' ou 'battle'

    let masterGain = null;
    let calmMasterGain = null;
    let battleMasterGain = null;

    // Geradores da Trilha Calma (Harpa/Lira + Lareira suave)
    let calmHarpTimer = null;
    let calmNoiseSource = null;
    let calmPadOsc1 = null;
    let calmPadOsc2 = null;

    // Geradores da Trilha de Batalha (Tambores de Guerra + Tensão Arcana)
    let battleDrumTimer = null;
    let battleDroneOsc = null;
    let battleBassTimer = null;

    function initAudioEngine() {
        if (audioCtx) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();

        // Master
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);

        // Sub-master Calma
        calmMasterGain = audioCtx.createGain();
        calmMasterGain.gain.setValueAtTime(currentAudioMode === 'calm' ? 0.6 : 0.001, audioCtx.currentTime);
        calmMasterGain.connect(masterGain);

        // Sub-master Batalha
        battleMasterGain = audioCtx.createGain();
        battleMasterGain.gain.setValueAtTime(currentAudioMode === 'battle' ? 0.6 : 0.001, audioCtx.currentTime);
        battleMasterGain.connect(masterGain);

        // --- Iniciar Trilha Calma ---
        initCalmMusic();

        // --- Iniciar Trilha de Batalha ---
        initBattleMusic();

        // Fade-in geral
        masterGain.gain.exponentialRampToValueAtTime(0.55, audioCtx.currentTime + 1.5);
    }

    /* --- TRILHA CALMA: Harpa Medieval e Lareira Suave --- */
    function initCalmMusic() {
        // 1. Som suave de lenha estalando / brisa
        const bufferSize = audioCtx.sampleRate * 2;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.015 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 2.5;
        }

        calmNoiseSource = audioCtx.createBufferSource();
        calmNoiseSource.buffer = noiseBuffer;
        calmNoiseSource.loop = true;

        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(320, audioCtx.currentTime);

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.2, audioCtx.currentTime);

        calmNoiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(calmMasterGain);
        calmNoiseSource.start();

        // 2. Acorde pad suave de fundo (D menor quente e relaxante)
        calmPadOsc1 = audioCtx.createOscillator();
        calmPadOsc1.type = 'sine';
        calmPadOsc1.frequency.setValueAtTime(146.83, audioCtx.currentTime); // D3

        calmPadOsc2 = audioCtx.createOscillator();
        calmPadOsc2.type = 'triangle';
        calmPadOsc2.frequency.setValueAtTime(220.00, audioCtx.currentTime); // A3

        const padFilter = audioCtx.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(280, audioCtx.currentTime);

        const padGain = audioCtx.createGain();
        padGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

        calmPadOsc1.connect(padFilter);
        calmPadOsc2.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(calmMasterGain);

        calmPadOsc1.start();
        calmPadOsc2.start();

        // 3. Sequenciador de notas de harpa/lute acústica suave (Modo Dórico/Menor de fantasia)
        const calmNotes = [
            220.00, // A3
            261.63, // C4
            293.66, // D4
            329.63, // E4
            392.00, // G4
            440.00, // A4
            523.25, // C5
            587.33  // D5
        ];

        // Frases melódicas calmas de fantasia
        const melodyPatterns = [
            [2, 4, 3, 5, 4, 2, 1, 0],
            [0, 2, 4, 5, 3, 2, 1, 2],
            [2, 3, 4, 6, 5, 4, 3, 2],
            [0, 3, 2, 1, 2, 4, 3, 0]
        ];

        let patternIdx = 0;
        let noteStep = 0;

        function playHarpPluck(freq, time) {
            if (!audioCtx || currentAudioMode !== 'calm' || !isAudioPlaying) return;

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            // Timbre doce de corda acústica
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, time);
            filter.frequency.exponentialRampToValueAtTime(300, time + 1.2);

            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.18, time + 0.03); // Ataque suave
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8); // Ressonância natural

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(calmMasterGain);

            osc.start(time);
            osc.stop(time + 2.0);
        }

        calmHarpTimer = setInterval(() => {
            if (!isAudioPlaying || currentAudioMode !== 'calm') return;
            const currentPattern = melodyPatterns[patternIdx];
            const noteIndex = currentPattern[noteStep];
            const freq = calmNotes[noteIndex];

            playHarpPluck(freq, audioCtx.currentTime);

            // Ocasionalmente toca uma segunda nota em harmonia doce
            if (noteStep === 0 || noteStep === 4) {
                const harmonyFreq = calmNotes[(noteIndex + 2) % calmNotes.length] / 2;
                playHarpPluck(harmonyFreq, audioCtx.currentTime + 0.05);
            }

            noteStep++;
            if (noteStep >= currentPattern.length) {
                noteStep = 0;
                patternIdx = (patternIdx + 1) % melodyPatterns.length;
            }
        }, 900); // Andamento calmo e relaxante (~66 BPM)
    }

    /* --- TRILHA DE BATALHA: Tambores de Guerra & Tensão Arcana --- */
    function initBattleMusic() {
        // 1. Zumbido profundo de cripta e tempestade necromântica
        battleDroneOsc = audioCtx.createOscillator();
        battleDroneOsc.type = 'sawtooth';
        battleDroneOsc.frequency.setValueAtTime(55, audioCtx.currentTime); // A1 grave

        const droneFilter = audioCtx.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.setValueAtTime(140, audioCtx.currentTime);

        const droneGain = audioCtx.createGain();
        droneGain.gain.setValueAtTime(0.15, audioCtx.currentTime);

        battleDroneOsc.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(battleMasterGain);
        battleDroneOsc.start();

        // 2. Sintetizador de Tambor de Guerra (Kick/Tom profundo)
        function playWarDrum(isAccent, time) {
            if (!audioCtx || currentAudioMode !== 'battle' || !isAudioPlaying) return;

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            const baseFreq = isAccent ? 95 : 75;
            osc.frequency.setValueAtTime(baseFreq, time);
            osc.frequency.exponentialRampToValueAtTime(32, time + 0.25);

            gain.gain.setValueAtTime(isAccent ? 0.35 : 0.22, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

            osc.connect(gain);
            gain.connect(battleMasterGain);

            osc.start(time);
            osc.stop(time + 0.4);

            // Adiciona ruído de impacto / couro de tambor
            if (isAccent) {
                const noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
                const nData = noiseBuf.getChannelData(0);
                for (let i = 0; i < nData.length; i++) nData[i] = (Math.random() * 2 - 1) * 0.2;
                const nSource = audioCtx.createBufferSource();
                nSource.buffer = noiseBuf;
                const nFilter = audioCtx.createBiquadFilter();
                nFilter.type = 'bandpass';
                nFilter.frequency.setValueAtTime(600, time);
                const nGain = audioCtx.createGain();
                nGain.gain.setValueAtTime(0.25, time);
                nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
                nSource.connect(nFilter);
                nFilter.connect(nGain);
                nGain.connect(battleMasterGain);
                nSource.start(time);
            }
        }

        // 3. Riff de Tensão / Violoncelo de Batalha Staccato
        const battleNotes = [73.42, 82.41, 87.31, 98.00, 110.00]; // D2, E2, F2, G2, A2
        function playTensionStaccato(freq, time) {
            if (!audioCtx || currentAudioMode !== 'battle' || !isAudioPlaying) return;

            const osc = audioCtx.createOscillator();
            const filter = audioCtx.createBiquadFilter();
            const gain = audioCtx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(500, time);
            filter.frequency.exponentialRampToValueAtTime(150, time + 0.22);

            gain.gain.setValueAtTime(0.12, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(battleMasterGain);

            osc.start(time);
            osc.stop(time + 0.28);
        }

        let drumStep = 0;
        // Padrão de batalha em 128 BPM (ritmo constante e épico)
        battleDrumTimer = setInterval(() => {
            if (!isAudioPlaying || currentAudioMode !== 'battle') return;

            const time = audioCtx.currentTime;
            const isHeavyHit = (drumStep % 4 === 0);
            const isOffbeat = (drumStep % 2 === 1);

            playWarDrum(isHeavyHit, time);

            if (isOffbeat) {
                const note = battleNotes[drumStep % battleNotes.length];
                playTensionStaccato(note, time);
            }

            drumStep = (drumStep + 1) % 16;
        }, 234); // ~128 BPM
    }

    /* --- CROSSFADE SUAVE ENTRE MÚSICAS --- */
    function setAudioTrack(mode) {
        if (currentAudioMode === mode) return;
        currentAudioMode = mode;

        const audioLabel = document.getElementById('audio-label');
        if (audioLabel && isAudioPlaying) {
            audioLabel.textContent = mode === 'battle' ? 'Batalha' : 'Calma';
        }

        if (!audioCtx || !calmMasterGain || !battleMasterGain) return;

        const now = audioCtx.currentTime;
        if (mode === 'battle') {
            // Suaviza saída da calma e entrada da batalha
            calmMasterGain.gain.cancelScheduledValues(now);
            battleMasterGain.gain.cancelScheduledValues(now);

            calmMasterGain.gain.setValueAtTime(calmMasterGain.gain.value, now);
            calmMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

            battleMasterGain.gain.setValueAtTime(Math.max(0.0001, battleMasterGain.gain.value), now);
            battleMasterGain.gain.exponentialRampToValueAtTime(0.65, now + 1.4);
        } else {
            // Suaviza saída da batalha e retorno da calma
            battleMasterGain.gain.cancelScheduledValues(now);
            calmMasterGain.gain.cancelScheduledValues(now);

            battleMasterGain.gain.setValueAtTime(battleMasterGain.gain.value, now);
            battleMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

            calmMasterGain.gain.setValueAtTime(Math.max(0.0001, calmMasterGain.gain.value), now);
            calmMasterGain.gain.exponentialRampToValueAtTime(0.65, now + 1.4);
        }
    }

    /* --------------------------------------------------------------------------
       3. Transição Dinâmica ao Rolar a Página (Capítulo 5 = Modo Escuro + Batalha)
       -------------------------------------------------------------------------- */
    const chapter5 = document.getElementById('capitulo-5');
    const progressBar = document.getElementById('progress-bar');
    const chapters = document.querySelectorAll('.story-chapter');
    const chapterLinks = document.querySelectorAll('.chapter-link');
    const themeBtn = document.getElementById('theme-btn');

    let isManualThemeOverride = false;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
        }

        // Identifica capítulo ativo
        let currentChapterId = '';
        chapters.forEach(chapter => {
            const top = chapter.offsetTop - 180;
            const height = chapter.offsetHeight;
            if (scrollTop >= top && scrollTop < top + height) {
                currentChapterId = chapter.getAttribute('id');
            }
        });

        if (currentChapterId) {
            chapterLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${currentChapterId}`);
            });
        }

        // Verificação do Capítulo 5 para transição automática de tema e música
        if (chapter5) {
            const triggerPoint = chapter5.offsetTop - 300;
            const isInBattleSection = scrollTop >= triggerPoint;

            if (isInBattleSection) {
                // Transição automática para modo escuro no Cap. 5 em diante
                if (!isManualThemeOverride && !document.body.classList.contains('theme-grimoire')) {
                    document.body.className = 'theme-grimoire';
                }
                // Transição para trilha de batalha
                setAudioTrack('battle');
            } else {
                // Retorno automático para pergaminho claro nos Capítulos 1 a 4
                if (!isManualThemeOverride && document.body.classList.contains('theme-grimoire')) {
                    document.body.className = 'theme-parchment';
                }
                // Retorno para trilha calma
                setAudioTrack('calm');
            }
        }
    });

    /* --------------------------------------------------------------------------
       4. Botão de Áudio (Play / Pause)
       -------------------------------------------------------------------------- */
    const audioToggle = document.getElementById('audio-toggle');
    const audioLabel = document.getElementById('audio-label');

    if (audioToggle) {
        audioToggle.addEventListener('click', () => {
            if (!isAudioPlaying) {
                if (!audioCtx) {
                    initAudioEngine();
                } else if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                    masterGain.gain.exponentialRampToValueAtTime(0.55, audioCtx.currentTime + 1.2);
                }
                isAudioPlaying = true;
                audioToggle.classList.add('active');
                if (audioLabel) audioLabel.textContent = currentAudioMode === 'battle' ? 'Batalha' : 'Calma';
            } else {
                if (audioCtx && masterGain) {
                    masterGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
                    setTimeout(() => {
                        audioCtx.suspend();
                    }, 600);
                }
                isAudioPlaying = false;
                audioToggle.classList.remove('active');
                if (audioLabel) audioLabel.textContent = 'Música';
            }
        });
    }

    /* --------------------------------------------------------------------------
       5. Alternador Manual de Tema
       -------------------------------------------------------------------------- */
    if (themeBtn) {
        const themes = ['theme-parchment', 'theme-grimoire', 'theme-vellum'];
        let currentThemeIndex = 0;

        themeBtn.addEventListener('click', () => {
            isManualThemeOverride = true;
            currentThemeIndex = (currentThemeIndex + 1) % themes.length;
            document.body.className = themes[currentThemeIndex];
        });
    }

    /* --------------------------------------------------------------------------
       6. Menu Gaveta de Capítulos
       -------------------------------------------------------------------------- */
    const indexToggle = document.getElementById('index-toggle');
    const chapterDrawer = document.getElementById('chapter-drawer');
    const closeDrawer = document.getElementById('close-drawer');

    if (indexToggle && chapterDrawer) {
        indexToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            chapterDrawer.classList.toggle('open');
        });

        if (closeDrawer) {
            closeDrawer.addEventListener('click', () => {
                chapterDrawer.classList.remove('open');
            });
        }

        document.addEventListener('click', (e) => {
            if (!chapterDrawer.contains(e.target) && !indexToggle.contains(e.target)) {
                chapterDrawer.classList.remove('open');
            }
        });

        chapterLinks.forEach(link => {
            link.addEventListener('click', () => {
                chapterDrawer.classList.remove('open');
                isManualThemeOverride = false; // Restaura transição automática ao navegar
            });
        });
    }

    /* --------------------------------------------------------------------------
       7. Ajuste de Tamanho de Fonte
       -------------------------------------------------------------------------- */
    const fontDecrease = document.getElementById('font-decrease');
    const fontIncrease = document.getElementById('font-increase');
    let currentFontSize = 1.22;

    function applyFontSize(size) {
        document.documentElement.style.setProperty('--story-font-size', `${size}rem`);
    }

    if (fontIncrease) {
        fontIncrease.addEventListener('click', () => {
            if (currentFontSize < 1.6) {
                currentFontSize += 0.08;
                applyFontSize(currentFontSize);
            }
        });
    }

    if (fontDecrease) {
        fontDecrease.addEventListener('click', () => {
            if (currentFontSize > 0.95) {
                currentFontSize -= 0.08;
                applyFontSize(currentFontSize);
            }
        });
    }

    /* --------------------------------------------------------------------------
       8. Modal Lightbox de Ilustrações
       -------------------------------------------------------------------------- */
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalClose = document.getElementById('modal-close');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const illustrations = document.querySelectorAll('.parchment-illustration');

    illustrations.forEach(figure => {
        const frame = figure.querySelector('.illustration-frame');
        const img = figure.querySelector('img');
        const titleEl = figure.querySelector('.fig-title');
        const descEl = figure.querySelector('.fig-desc');

        if (frame && img) {
            frame.addEventListener('click', () => {
                modalImg.src = img.src;
                modalTitle.textContent = titleEl ? titleEl.textContent : 'Ilustração';
                modalDesc.textContent = descEl ? descEl.textContent : '';
                modal.classList.add('active');
                modal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            });
        }
    });

    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

});
