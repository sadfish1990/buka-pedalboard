// PitchShifter GUI - Red Whammy Style
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #d32f2f; /* Deep Red */
        width: 250px;
        height: 380px;
        border-radius: 8px;
        border: 4px solid #b71c1c;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        user-select: none;
        font-family: 'Arial Black', sans-serif;
        color: #fff;
    `;

    // Title
    const title = document.createElement('div');
    title.innerHTML = "PITCH<br>SHIFTER";
    title.style.cssText = "font-size: 28px; line-height: 28px; text-align: center; margin-bottom: 40px; text-shadow: 2px 2px 0px #000;";
    container.appendChild(title);

    // Big Main Pitch Knob
    const pitchWrap = document.createElement('div');
    pitchWrap.style.cssText = "position: relative; width: 120px; height: 120px; display: flex; justify-content: center; align-items: center; margin-bottom: 40px;";

    const knob = document.createElement('div');
    knob.style.cssText = `
        width: 100px; height: 100px; border-radius: 50%;
        background: #111; border: 4px solid #fff;
        position: relative; cursor: pointer;
        box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    `;

    // Indicator Dot
    const dot = document.createElement('div');
    dot.style.cssText = `
        width: 12px; height: 12px; background: #fff; border-radius: 50%;
        position: absolute; top: 10px; left: 50%; margin-left: -6px;
        transform-origin: 50% 40px; /* Pivots around center */
    `;
    knob.appendChild(dot);
    pitchWrap.appendChild(knob);

    // LED Display for Pitch Value
    const display = document.createElement('div');
    display.innerText = "0";
    display.style.cssText = `
        position: absolute; top: -30px; 
        background: #000; color: #f00; font-family: 'Courier New', monospace;
        padding: 2px 8px; border: 1px solid #555; font-size: 16px; border-radius: 4px;
    `;
    pitchWrap.appendChild(display);

    // Pitch Logic
    let pitchVal = 0;
    const updatePitch = (v) => {
        // Step to integers?
        pitchVal = Math.round(Math.max(-24, Math.min(24, v)));

        // Calculate Graphic Rotation (-135 to 135 deg)
        // Range 48 semitones total (-24 to 24)
        const norm = (pitchVal + 24) / 48; // 0..1
        const deg = -135 + (norm * 270);
        dot.style.transform = `rotate(${deg}deg)`; // Actually rotating the dot logic needs fix
        // Simpler: Rotate the whole knob div is easier
        knob.style.transform = `rotate(${deg}deg)`;

        display.innerText = (pitchVal > 0 ? "+" : "") + pitchVal;
        plugin.audioNode.setParamValue('pitch', pitchVal);
    };

    let isDrag = false;
    let startY = 0;

    knob.addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation(); // Critical to stop pedal drag
        e.stopImmediatePropagation();
        isDrag = true;
        startY = e.clientY;
        knob.setPointerCapture(e.pointerId);
    });

    knob.addEventListener('pointermove', e => {
        if (!isDrag) return;
        e.preventDefault();
        e.stopPropagation(); // Stop parent scroll/drag
        e.stopImmediatePropagation();
        // Sensitivity
        const delta = (startY - e.clientY) * 0.1;
        updatePitch(pitchVal + delta);
        startY = e.clientY;
    });

    knob.addEventListener('pointerup', e => {
        e.stopPropagation();
        isDrag = false;
        knob.releasePointerCapture(e.pointerId);
    });

    container.appendChild(pitchWrap);

    // Mix Knob (Small)
    const mixWrap = document.createElement('div');
    mixWrap.style.cssText = "display: flex; flex-direction: column; align-items: center; margin-bottom: 20px;";

    const mixKnob = document.createElement('div');
    mixKnob.style.cssText = `
        width: 50px; height: 50px; border-radius: 50%;
        background: #222; border: 2px solid #ccc;
        position: relative; cursor: pointer;
    `;
    const mixLine = document.createElement('div');
    mixLine.style.cssText = `width: 2px; height: 40%; background: #fff; position: absolute; top: 5px; left: 50%; margin-left: -1px; transform-origin: bottom center;`;
    mixKnob.appendChild(mixLine);

    const mixLbl = document.createElement('div');
    mixLbl.innerText = "DRY / WET";
    mixLbl.style.fontSize = "12px"; mixLbl.style.marginTop = "5px";

    let mixVal = 0.5;
    const updateMix = (v) => {
        mixVal = Math.max(0, Math.min(1, v));
        const deg = -135 + (mixVal * 270);
        mixLine.style.transform = `rotate(${deg}deg)`;
        plugin.audioNode.setParamValue('mix', mixVal);
    };

    mixKnob.addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        isDrag = true;
        startY = e.clientY;
        mixKnob.setPointerCapture(e.pointerId);
    });

    mixKnob.addEventListener('pointermove', e => {
        if (!isDrag) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const delta = (startY - e.clientY) * 0.01;
        updateMix(mixVal + delta);
        startY = e.clientY;
    });

    mixKnob.addEventListener('pointerup', e => {
        e.stopPropagation();
        isDrag = false;
        mixKnob.releasePointerCapture(e.pointerId);
    });

    updateMix(0.5);
    updatePitch(0);

    mixWrap.appendChild(mixKnob);
    mixWrap.appendChild(mixLbl);
    container.appendChild(mixWrap);

    // Bypass
    const footer = document.createElement('div');
    footer.style.marginTop = "auto";
    const sw = document.createElement('div');
    sw.style.cssText = "width: 40px; height: 40px; background: radial-gradient(#aaa, #666); border-radius: 50%; border: 3px solid #333; cursor: pointer;";
    const led = document.createElement('div');
    led.style.cssText = "width: 10px; height: 10px; background: #f00; border-radius: 50%; margin: 0 auto 5px auto; box-shadow: 0 0 5px #f00;";

    let isBypassed = false;
    sw.addEventListener('click', () => {
        isBypassed = !isBypassed;
        plugin.audioNode.setBypass(isBypassed);
        led.style.background = isBypassed ? "#333" : "#f00";
        led.style.boxShadow = isBypassed ? "none" : "0 0 5px #f00";
    });

    footer.appendChild(led);
    footer.appendChild(sw);
    container.appendChild(footer);

    return container;
}
