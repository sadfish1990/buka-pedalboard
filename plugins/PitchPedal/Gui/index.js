// PitchPedal GUI - Whammy Style (Fixed Events)
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: row;
        padding: 20px;
        background: #cc0000; /* Ferrari Red */
        color: #fff;
        font-family: 'Impact', sans-serif;
        border-radius: 8px;
        width: 380px;
        height: 250px;
        border: 4px solid #990000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        user-select: none;
        gap: 20px;
        touch-action: none; /* Critical for touch screens */
    `;

    // LEFT COLUMN: Controls & Logo
    const leftCol = document.createElement('div');
    leftCol.style.cssText = "display: flex; flex-direction: column; justify-content: space-between; flex: 1; align-items: center;";

    // Logo
    const logo = document.createElement('div');
    logo.textContent = "WHAMMY";
    logo.style.cssText = `
        font-size: 40px;
        height: 100%;
        text-align: center;
        writing-mode: vertical-rl;
        text-shadow: 3px 3px 0 #990000;
        opacity: 0.9;
        cursor: default;
    `;

    // Mode Knob Container
    const knobContainer = document.createElement('div');
    knobContainer.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 5px; margin-bottom: 20px;";

    const knobLabel = document.createElement('div');
    knobLabel.textContent = "HARMONY";
    knobLabel.style.fontSize = "12px";

    // Mode Knob
    const knobSize = 60;
    const knob = document.createElement('div');
    knob.style.cssText = `
        width: ${knobSize}px;
        height: ${knobSize}px;
        background: #111;
        border-radius: 50%;
        border: 3px solid #fff;
        position: relative;
        cursor: pointer;
        touch-action: none;
    `;

    const knobInd = document.createElement('div');
    knobInd.style.cssText = `
        width: 4px; height: 50%; background: #fff; position: absolute; top: 5px; left: 50%; margin-left: -2px; transform-origin: center bottom; pointer-events: none;
    `;
    knob.appendChild(knobInd);

    // Modes labels
    const modes = ["+1 OCT", "+2 OCT", "-1 OCT", "DETUNE"];
    const modeLabel = document.createElement('div');
    modeLabel.textContent = "+1 OCT";
    modeLabel.style.cssText = "font-family: monospace; background: #000; padding: 2px 5px; font-size: 14px; color: #cc0000; border: 1px solid #fff;";

    let currentMode = 0;

    const updateMode = (m) => {
        modeLabel.textContent = modes[m];
        const deg = -135 + (m * 90);
        knobInd.style.transform = `rotate(${deg}deg)`;
        plugin.audioNode.setParamValue('mode', m);
    };

    // KNOB EVENTS - ROBUST
    let isDragKnob = false;
    let startY_Knob = 0;

    const stopComp = (e) => { e.stopPropagation(); }; // Separate function to reference

    // 1. Prevent Drag Propagation
    // Modern browsers use pointer events which bubble up if not stopped
    knob.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        isDragKnob = true;
        startY_Knob = e.clientY;
        knob.setPointerCapture(e.pointerId);
    });

    knob.addEventListener('mousedown', (e) => { e.stopPropagation(); }); // Redundant but safe
    knob.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: false });
    knob.addEventListener('click', stopComp);

    // 2. Handle Drag/Click logic
    knob.addEventListener('pointermove', (e) => {
        if (!isDragKnob) return;
        e.stopPropagation();
        e.preventDefault();

        if (Math.abs(e.clientY - startY_Knob) > 20) {
            currentMode = (currentMode + 1) % 4;
            updateMode(currentMode);
            startY_Knob = e.clientY;
        }
    });

    knob.addEventListener('pointerup', (e) => {
        e.stopPropagation();
        isDragKnob = false;
        // If it was a short click without much drag, treat as click-to-change
        // But pointermove logic above handles drag-to-change.
        // Let's rely on click event for tap-to-change if drag didn't happen?
        // Actually, simple click listener covers tap.
        knob.releasePointerCapture(e.pointerId);
    });

    knob.addEventListener('click', (e) => {
        e.stopPropagation();
        currentMode = (currentMode + 1) % 4;
        updateMode(currentMode);
    });

    knobContainer.appendChild(knobLabel);
    knobContainer.appendChild(knob);
    knobContainer.appendChild(modeLabel);

    leftCol.appendChild(knobContainer);

    // RIGHT COLUMN: The Pedal
    const rightCol = document.createElement('div');
    rightCol.style.cssText = "flex: 1; display: flex; justify-content: center; align-items: center; position: relative;";

    const pedalBg = document.createElement('div');
    pedalBg.style.cssText = `
        width: 100px;
        height: 200px;
        background: #333;
        border-radius: 4px;
        position: relative;
        border: 2px solid #000;
        box-shadow: inset 0 0 20px #000;
    `;

    const treadle = document.createElement('div');
    treadle.style.cssText = `
        width: 90px;
        height: 80px;
        background: url('https://www.transparenttextures.com/patterns/carbon-fibre.png'), #1a1a1a;
        border: 1px solid #555;
        border-radius: 4px;
        position: absolute;
        left: 3px;
        bottom: 5px; /* Start at Heel (0%) */
        cursor: grab;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0 5px 10px rgba(0,0,0,0.8);
        touch-action: none;
    `;

    const gripLines = document.createElement('div');
    gripLines.style.cssText = "width: 70%; height: 60%; border-top: 2px solid #444; border-bottom: 2px solid #444; pointer-events: none;";
    treadle.appendChild(gripLines);

    // Slider Logic
    const minBottom = 5;
    const maxBottom = 115;
    const travel = maxBottom - minBottom;

    let startBottom = minBottom;

    const updatePedal = (val) => {
        const bottom = minBottom + (val * travel);
        treadle.style.bottom = `${bottom}px`;
        plugin.audioNode.setParamValue('pedal', val);
        const tilt = 10 - (val * 20);
        treadle.style.transform = `perspective(500px) rotateX(${tilt}deg)`;
    };

    // PEDAL EVENTS - ROBUST
    treadle.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        treadle.setPointerCapture(e.pointerId);

        isDragging = true;
        startY = e.clientY;
        const currentBot = parseFloat(treadle.style.bottom) || minBottom;
        startBottom = currentBot;
        treadle.style.cursor = 'grabbing';
    });

    let isDragging = false;
    let startY = 0;

    treadle.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        e.stopPropagation();
        e.preventDefault();

        const delta = startY - e.clientY; // Moving up increases bottom
        let newBottom = startBottom + delta;
        newBottom = Math.max(minBottom, Math.min(newBottom, maxBottom));

        const norm = (newBottom - minBottom) / travel;
        updatePedal(norm);
    });

    treadle.addEventListener('pointerup', (e) => {
        e.stopPropagation();
        isDragging = false;
        treadle.style.cursor = 'grab';
        treadle.releasePointerCapture(e.pointerId);
    });

    // Safety
    treadle.addEventListener('mousedown', stopComp);
    treadle.addEventListener('touchstart', stopComp);
    treadle.addEventListener('click', stopComp);

    // Init
    updatePedal(0);
    updateMode(0);

    pedalBg.appendChild(treadle);
    rightCol.appendChild(pedalBg);

    container.appendChild(leftCol);
    container.appendChild(rightCol);

    return container;
}
