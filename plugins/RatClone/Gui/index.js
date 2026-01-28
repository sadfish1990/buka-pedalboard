// RatClone GUI - ProCo RAT Style
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #1a1a1a;
        width: 280px;
        height: 340px;
        border-radius: 8px;
        border: 3px solid #333;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        user-select: none;
        font-family: 'Arial', sans-serif;
        touch-action: none;
    `;

    // Rat graphic
    const rat = document.createElement('div');
    rat.textContent = "🐀";
    rat.style.cssText = "font-size: 48px; margin-bottom: 5px; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.8));";
    container.appendChild(rat);

    // Red LED
    const led = document.createElement('div');
    led.style.cssText = `
        width: 12px; height: 12px; border-radius: 50%;
        background: #f00; margin-bottom: 15px;
        box-shadow: 0 0 10px #f00, inset 0 1px 2px rgba(255,255,255,0.5);
        border: 1px solid #600;
    `;
    container.appendChild(led);

    // Helper: Create Knob
    const createKnob = (label, param, defaultVal) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 8px;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #444, #1a1a1a);
            border: 2px solid #666;
            position: relative; cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1);
        `;

        const indicator = document.createElement('div');
        indicator.style.cssText = `
            width: 3px; height: 40%; background: #fff;
            position: absolute; top: 5px; left: 50%;
            margin-left: -1.5px; transform-origin: bottom center;
            border-radius: 2px;
        `;
        knob.appendChild(indicator);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.cssText = "font-size: 11px; font-weight: bold; color: #ccc; text-transform: uppercase; letter-spacing: 1px;";

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

    // Knobs Row
    const knobsRow = document.createElement('div');
    knobsRow.style.cssText = "display: flex; gap: 25px; margin-top: 10px;";

    knobsRow.appendChild(createKnob("Dist", "distortion", 0.5));
    knobsRow.appendChild(createKnob("Filter", "filter", 0.7));
    knobsRow.appendChild(createKnob("Volume", "volume", 0.5));

    container.appendChild(knobsRow);

    // Footswitch
    const footswitch = document.createElement('div');
    footswitch.style.cssText = "margin-top: 25px; display: flex; flex-direction: column; align-items: center; gap: 8px;";

    const button = document.createElement('div');
    button.style.cssText = `
        width: 40px; height: 40px; border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #555, #222);
        border: 3px solid #111; cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.2);
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
            led.style.boxShadow = '0 0 10px #f00, inset 0 1px 2px rgba(255,255,255,0.5)';
        }

        plugin.audioNode.setBypass(bypassed);
        // RAT doesn't have true bypass in DSP yet, just visual for now
        // We'd need to add setBypass method like GoldenHorse
    });
    button.addEventListener('pointerdown', (e) => e.stopPropagation());

    footswitch.appendChild(button);
    container.appendChild(footswitch);

    // Logo
    const logo = document.createElement('div');
    logo.textContent = "RAT";
    logo.style.cssText = "margin-top: 15px; font-size: 14px; font-weight: bold; color: #888; letter-spacing: 3px;";
    container.appendChild(logo);

    return container;
}
