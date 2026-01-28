// MetalZone GUI - Boss MT-2 Style
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #2a2a2a;
        width: 320px;
        height: 440px;
        border-radius: 8px;
        border: 3px solid #111;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), inset 0 2px 10px rgba(255,255,255,0.1);
        user-select: none;
        font-family: 'Arial', sans-serif;
        touch-action: none;
    `;

    // BOSS logo
    const bossLogo = document.createElement('div');
    bossLogo.textContent = "BOSS";
    bossLogo.style.cssText = `
        background: #000;
        color: #fff;
        padding: 5px 25px;
        font-size: 18px;
        font-weight: bold;
        letter-spacing: 3px;
        margin-bottom: 10px;
        border-radius: 3px;
    `;
    container.appendChild(bossLogo);

    // Model name
    const model = document.createElement('div');
    model.innerHTML = "<div style='font-size:24px; font-weight:bold; color:#000; letter-spacing:1px;'>MT-2</div><div style='font-size:12px; color:#ff8800; letter-spacing:1px;'>Metal Zone</div>";
    model.style.cssText = "text-align:center; margin-bottom:20px;";
    container.appendChild(model);

    // Helper: Create Knob
    const createKnob = (label, param, defaultVal, color = "#ff8800") => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 5px;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 45px; height: 45px; border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #333, #000);
            border: 2px solid #555;
            position: relative; cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.6);
        `;

        const indicator = document.createElement('div');
        indicator.style.cssText = `
            width: 3px; height: 40%; background: ${color};
            position: absolute; top: 5px; left: 50%;
            margin-left: -1.5px; transform-origin: bottom center;
            border-radius: 2px;
        `;
        knob.appendChild(indicator);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.cssText = "font-size: 10px; font-weight: bold; color: #ccc; text-transform: uppercase;";

        let val = defaultVal;
        const update = (v) => {
            val = Math.max(0, Math.min(1, v));
            const deg = -135 + (val * 270);
            indicator.style.transform = `rotate(${deg}deg)`;
            plugin.audioNode.setParamValue(param, val);
        };

        let isDrag = false, startY = 0;
        knob.addEventListener('pointerdown', e => {
            e.stopPropagation(); e.preventDefault();
            knob.setPointerCapture(e.pointerId);
            isDrag = true; startY = e.clientY;
        });
        knob.addEventListener('pointermove', e => {
            if (!isDrag) return;
            e.stopPropagation();
            const delta = (startY - e.clientY) * 0.005;
            update(val + delta);
            startY = e.clientY;
        });
        knob.addEventListener('pointerup', e => {
            isDrag = false;
            knob.releasePointerCapture(e.pointerId);
        });

        update(defaultVal);
        wrap.appendChild(knob);
        wrap.appendChild(lbl);
        return wrap;
    };

    // Row 1: Level, Dist
    const row1 = document.createElement('div');
    row1.style.cssText = "display: flex; gap: 30px; margin-bottom: 20px;";
    row1.appendChild(createKnob("Level", "level", 0.5));
    row1.appendChild(createKnob("Dist", "dist", 0.5));
    container.appendChild(row1);

    // Row 2: EQ - High, Low
    const row2 = document.createElement('div');
    row2.style.cssText = "display: flex; gap: 30px; margin-bottom: 20px; background:#222; padding: 10px; border-radius:5px;";
    row2.appendChild(createKnob("High", "high", 0.5, "#fff"));
    row2.appendChild(createKnob("Low", "low", 0.5, "#fff"));
    container.appendChild(row2);

    // Row 3: Parametric Mid
    const row3 = document.createElement('div');
    row3.style.cssText = "display: flex; gap: 30px; margin-bottom: 10px; background:#332200; padding: 10px; border-radius:5px; border:1px solid #554400;";
    row3.appendChild(createKnob("Mid Freq", "midFreq", 0.5)); // Frequency
    row3.appendChild(createKnob("Mid Gain", "midGain", 0.5)); // Boost/Cut
    container.appendChild(row3);

    // LED
    const led = document.createElement('div');
    led.style.cssText = `
        width: 12px; height: 12px; border-radius: 50%;
        background: #f00; margin-bottom: 15px; margin-top: 10px;
        box-shadow: 0 0 10px #f00, inset 0 1px 2px rgba(255,255,255,0.5);
        border: 1px solid #800;
    `;
    container.appendChild(led);

    // Footswitch
    const button = document.createElement('div');
    button.style.cssText = `
        width: 60px; height: 40px; border-radius: 10px;
        background: radial-gradient(circle at 30% 30%, #333, #000);
        border: 2px solid #555; cursor: pointer;
        box-shadow: 0 5px 10px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1);
        transition: transform 0.1s;
    `;

    let bypassed = false;

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        bypassed = !bypassed;
        button.style.transform = bypassed ? 'translateY(2px)' : 'translateY(0)';

        if (bypassed) {
            led.style.background = '#333';
            led.style.boxShadow = '0 0 2px #111';
        } else {
            led.style.background = '#f00';
            led.style.boxShadow = '0 0 12px #f00, inset 0 1px 2px rgba(255,255,255,0.5)';
        }

        plugin.audioNode.setBypass(bypassed);
    });
    button.addEventListener('pointerdown', (e) => e.stopPropagation());

    container.appendChild(button);

    return container;
}
