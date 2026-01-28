// Drummer GUI V2 - Complete Workstation (Restored & Fixed)
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 15px;
        background: #222;
        color: #fff;
        font-family: 'Verdana', sans-serif;
        border-radius: 8px;
        width: 500px;
        border: 2px solid #555;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        user-select: none;
        touch-action: none;
    `;

    // --- HELPER: Custom Slider ---
    // Robust custom slider to replace native input and prevent drag issues
    const createCustomSlider = (min, max, value, width, height, onChange) => {
        const wrap = document.createElement('div');
        // Ensure styling ensures visibility
        wrap.style.cssText = `
            width: ${width}px; height: ${height}px; 
            background: #111; 
            border: 1px solid #444; 
            border-radius: ${height / 2}px; 
            position: relative; 
            cursor: pointer; 
            touch-action: none;
            flex-shrink: 0; /* Prevent flex collapse */
        `;

        const track = document.createElement('div');
        const trackH = 2;
        const trackTop = (height - trackH) / 2;
        track.style.cssText = `
            position: absolute; top: ${trackTop}px; left: 5px; right: 5px; 
            height: ${trackH}px; background: #555; pointer-events: none;
        `;

        const thumbSize = height - 6;
        const thumbTop = 2; // (height - thumbSize)/2 roughly
        const thumb = document.createElement('div');
        thumb.style.cssText = `
            width: ${thumbSize}px; height: ${thumbSize}px; 
            background: #ccc; border-radius: 50%;
            position: absolute; top: 3px; 
            box-shadow: 0 1px 3px #000;
            pointer-events: none;
            transform: translateX(-50%);
        `;

        wrap.appendChild(track);
        wrap.appendChild(thumb);

        // State
        let localVal = value;

        const updateUI = (val) => {
            // Clamp
            val = Math.max(min, Math.min(max, val));
            const norm = (val - min) / (max - min);
            const availW = width - 10; // 5px padding each side
            const left = 5 + (norm * availW);
            thumb.style.left = `${left}px`;
        };

        const processEvent = (clientX) => {
            const rect = wrap.getBoundingClientRect();
            let x = clientX - rect.left - 5;
            const availW = width - 10;
            x = Math.max(0, Math.min(x, availW));
            const norm = x / availW;
            const distinctVal = min + norm * (max - min);
            updateUI(distinctVal);
            onChange(distinctVal);
        };

        let isDragging = false;

        wrap.addEventListener('pointerdown', (e) => {
            e.stopPropagation(); e.preventDefault();
            wrap.setPointerCapture(e.pointerId);
            isDragging = true;
            thumb.style.background = "#fff";
            processEvent(e.clientX);
        });

        wrap.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            e.stopPropagation(); e.preventDefault();
            processEvent(e.clientX);
        });

        wrap.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            isDragging = false;
            wrap.releasePointerCapture(e.pointerId);
            thumb.style.background = "#ccc";
        });

        // Expose method to set from external (e.g. if plugin updates param)
        wrap.setValue = (v) => {
            localVal = v;
            updateUI(v);
        };

        updateUI(localVal);
        return wrap;
    };

    // --- TOP BAR ---
    const topBar = document.createElement('div');
    topBar.style.cssText = "display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 15px; gap: 10px;";

    // Logo
    const logo = document.createElement('div');
    logo.innerHTML = "<span style='color:#f80; font-weight:bold;'>TR</span>-ZERO";
    logo.style.fontSize = "18px";

    // Preset
    const presets = ["Electro", "Tech House", "Breakbeat", "Trap"];
    const presetData = {
        "Electro": { kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
        "Tech House": { kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0] },
        "Breakbeat": { kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
        "Trap": { kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }
    };

    const presetSelect = document.createElement('select');
    presetSelect.style.cssText = "background: #333; color: #fff; border: 1px solid #555; padding: 2px; font-size: 10px; width: 80px;";
    presets.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k; opt.textContent = k; presetSelect.appendChild(opt);
    });

    const stopComp = (e) => e.stopPropagation();
    presetSelect.addEventListener('pointerdown', stopComp);
    presetSelect.addEventListener('mousedown', stopComp);
    presetSelect.addEventListener('click', stopComp);
    presetSelect.addEventListener('change', (e) => {
        const p = presetData[e.target.value];
        if (p) plugin.audioNode.loadPreset(p);
    });

    // Transport
    const transport = document.createElement('div');
    transport.style.cssText = "display: flex; gap: 5px;";

    let isPlaying = true;
    const btnStyle = "width: 25px; height: 25px; border-radius: 4px; display: flex; justify-content: center; align-items: center; cursor: pointer; font-weight: bold;";
    const playBtn = document.createElement('div');
    playBtn.textContent = "▶"; playBtn.style.cssText = btnStyle;
    const stopBtn = document.createElement('div');
    stopBtn.textContent = "■"; stopBtn.style.cssText = btnStyle;

    const updateTransport = () => {
        playBtn.style.background = isPlaying ? "#0f0" : "#333";
        playBtn.style.color = isPlaying ? "#000" : "#aaa";
        stopBtn.style.background = isPlaying ? "#333" : "#f00";
        stopBtn.style.color = isPlaying ? "#aaa" : "#000";
        plugin.audioNode.setTransport(isPlaying);
    };

    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (plugin.audioContext.state === 'suspended') plugin.audioContext.resume();
        isPlaying = true; updateTransport();
    });
    playBtn.addEventListener('pointerdown', stopComp);

    stopBtn.addEventListener('click', (e) => { e.stopPropagation(); isPlaying = false; updateTransport(); });
    stopBtn.addEventListener('pointerdown', stopComp);
    updateTransport();

    transport.appendChild(playBtn);
    transport.appendChild(stopBtn);

    // Header Tempo
    const tempoWrap = document.createElement('div');
    tempoWrap.style.cssText = "display: flex; align-items: center; gap: 5px;";
    const tempoVal = document.createElement('div');
    tempoVal.textContent = "120"; tempoVal.style.fontSize = "12px"; tempoVal.style.width = "25px";

    let currentBPM = 120;

    // Shared update function
    const onTempoChange = (val) => {
        const v = Math.round(val);
        if (v === currentBPM) return;
        currentBPM = v;
        tempoVal.textContent = v;
        plugin.audioNode.setParamValue('tempo', v);
        // Sync sliders
        if (headerSlider && headerSlider.setValue) headerSlider.setValue(v);
        if (bottomSlider && bottomSlider.setValue) bottomSlider.setValue(v);
    };

    const headerSlider = createCustomSlider(60, 200, 120, 80, 20, onTempoChange);

    tempoWrap.appendChild(headerSlider);
    tempoWrap.appendChild(tempoVal);

    // Vol
    const volWrap = document.createElement('div');
    volWrap.style.cssText = "display: flex; flex-direction: column; align-items: center;";
    const volLabel = document.createElement('div');
    volLabel.textContent = "VOL"; volLabel.style.fontSize = "9px";

    const volKnob = document.createElement('div');
    volKnob.style.cssText = "width: 25px; height: 25px; border-radius: 50%; background: #444; border: 1px solid #777; position: relative; cursor: row-resize; touch-action: none;";
    const volInd = document.createElement('div');
    volInd.style.cssText = "width: 2px; height: 50%; background: #fff; position: absolute; top: 2px; left: 50%; margin-left: -1px; transform-origin: bottom center;";
    volKnob.appendChild(volInd);

    let isDragVol = false, startY = 0, startVol = 1.0;
    const updateVol = (v) => {
        const deg = -135 + (v * 270);
        volInd.style.transform = `rotate(${deg}deg)`;
        plugin.audioNode.setParamValue('volume', v);
    };
    volKnob.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); e.preventDefault(); volKnob.setPointerCapture(e.pointerId);
        isDragVol = true; startY = e.clientY; startVol = plugin.audioNode.getParamValue('volume') || 1.0;
    });
    volKnob.addEventListener('pointermove', (e) => {
        if (!isDragVol) return;
        e.stopPropagation();
        const delta = (startY - e.clientY) * 0.01;
        updateVol(Math.max(0, Math.min(1, startVol + delta)));
    });
    volKnob.addEventListener('pointerup', (e) => { isDragVol = false; volKnob.releasePointerCapture(e.pointerId); });
    updateVol(1.0);

    volWrap.appendChild(volKnob);
    volWrap.appendChild(volLabel);

    topBar.appendChild(logo);
    topBar.appendChild(presetSelect);
    topBar.appendChild(tempoWrap);
    topBar.appendChild(transport);
    topBar.appendChild(volWrap);

    container.appendChild(topBar);

    // --- SECTIONS ---
    const sectionBar = document.createElement('div');
    sectionBar.style.cssText = "display: flex; gap: 5px; width: 100%; margin-bottom: 10px;";
    const sectionBtns = {};
    let currentSection = 'A';
    ['A', 'B', 'C'].forEach(sec => {
        const btn = document.createElement('div');
        btn.textContent = sec;
        btn.style.cssText = "width: 30px; height: 20px; background: #333; color: #aaa; font-size: 10px; display: flex; justify-content: center; align-items: center; cursor: pointer; border: 1px solid #444;";
        btn.addEventListener('click', (e) => { e.stopPropagation(); currentSection = sec; updateSections(); plugin.audioNode.setSection(sec); });
        btn.addEventListener('pointerdown', stopComp);
        sectionBtns[sec] = btn;
        sectionBar.appendChild(btn);
    });
    const updateSections = () => {
        Object.keys(sectionBtns).forEach(s => {
            sectionBtns[s].style.background = s === currentSection ? "#f80" : "#333";
            sectionBtns[s].style.color = s === currentSection ? "#000" : "#aaa";
        });
    };
    updateSections();
    container.appendChild(sectionBar);

    // --- GRID ---
    const grid = document.createElement('div');
    grid.style.cssText = "display: flex; flex-direction: column; gap: 8px; width: 100%;";
    const instruments = ['hat', 'snare', 'kick'];
    const colors = { hat: '#ccc', snare: '#f0f', kick: '#f80' };
    const rows = {};

    instruments.forEach(inst => {
        const row = document.createElement('div');
        row.style.cssText = "display: flex; gap: 2px; align-items: center;";
        const label = document.createElement('div');
        label.textContent = inst.substring(0, 2).toUpperCase();
        label.style.cssText = "width: 25px; font-size: 10px; color: #888; font-weight: bold;";
        row.appendChild(label);

        rows[inst] = [];
        for (let i = 0; i < 16; i++) {
            const btn = document.createElement('div');
            btn.style.cssText = "width: 24px; height: 32px; background: #333; border-radius: 2px; cursor: pointer; border-bottom: 2px solid #111;";
            if (i % 4 === 0) btn.style.marginLeft = "4px";

            let active = false;
            const updateVisual = (val) => {
                active = val;
                btn.style.background = active ? colors[inst] : '#333';
                btn.style.boxShadow = active ? `0 0 5px ${colors[inst]}` : 'none';
            };
            // Default Init (Will be overwritten by pattern dump usually)
            if (inst === 'kick' && i % 4 === 0) updateVisual(true);
            if (inst === 'hat') updateVisual(true);

            btn.addEventListener('click', (e) => { e.stopPropagation(); updateVisual(!active); plugin.audioNode.setPattern(inst, i, active ? 1 : 0, currentSection); });
            btn.addEventListener('pointerdown', stopComp);

            rows[inst].push({ el: btn, update: updateVisual });
            row.appendChild(btn);
        }
        grid.appendChild(row);
    });
    container.appendChild(grid);

    // --- BOTTOM TEMPO (BIG SLIDER) ---
    const bottomBar = document.createElement('div');
    bottomBar.style.cssText = "width: 100%; margin-top: 15px; display: flex; align-items: center; gap: 10px;";
    const bTempoLabel = document.createElement('div');
    bTempoLabel.textContent = "BPM MAIN"; bTempoLabel.style.fontSize = "10px";

    // CUSTOM SLIDER for bottom too
    const bottomSlider = createCustomSlider(60, 200, 120, 420, 20, onTempoChange);

    bottomBar.appendChild(bTempoLabel);
    bottomBar.appendChild(bottomSlider);
    container.appendChild(bottomBar);

    // --- LISTENERS ---
    plugin.audioNode.onPatternChange((section, pattern) => {
        if (section !== currentSection) return;
        instruments.forEach(inst => {
            const track = pattern[inst];
            if (track) track.forEach((val, idx) => {
                if (rows[inst][idx]) rows[inst][idx].update(val > 0.5);
            });
        });
    });

    let prevStep = -1;
    plugin.audioNode.onStep((step) => {
        requestAnimationFrame(() => {
            if (prevStep !== -1) {
                instruments.forEach(inst => {
                    if (rows[inst][prevStep]) rows[inst][prevStep].el.style.borderColor = "#111";
                });
            }
            instruments.forEach(inst => {
                if (rows[inst][step]) rows[inst][step].el.style.borderColor = "#fff";
            });
            prevStep = step;
        });
    });

    return container;
}
