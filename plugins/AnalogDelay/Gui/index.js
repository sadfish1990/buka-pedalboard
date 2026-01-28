// AnalogDelay GUI - Carbon Copy Style
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: linear-gradient(180deg, #228B22 0%, #1a6b1a 100%);
        width: 320px;
        height: 380px;
        border-radius: 8px;
        border: 3px solid #0d4d0d;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), inset 0 2px 10px rgba(255,255,255,0.2);
        user-select: none;
        font-family: 'Arial', sans-serif;
        touch-action: none;
    `;

    // Logo
    const logo = document.createElement('div');
    logo.innerHTML = "<div style='font-size:20px; font-weight:bold; color:#fff; letter-spacing:2px;'>ANALOG</div><div style='font-size:18px; font-weight:bold; color:#fff; letter-spacing:2px;'>DELAY</div>";
    logo.style.cssText = "text-align:center; margin-bottom:20px;";
    container.appendChild(logo);

    // Helper: Create Knob
    const createKnob = (label, param, defaultVal) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 8px;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #333, #000);
            border: 2px solid #fff;
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
        lbl.style.cssText = "font-size: 11px; font-weight: bold; color: #fff; text-transform: uppercase;";

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
    knobsRow.style.cssText = "display: flex; gap: 20px; margin-top: 10px;";

    knobsRow.appendChild(createKnob("Delay", "delay", 0.5));
    knobsRow.appendChild(createKnob("Mix", "mix", 0.5));
    knobsRow.appendChild(createKnob("Regen", "regen", 0.5));
    knobsRow.appendChild(createKnob("Mod", "mod", 0));

    container.appendChild(knobsRow);

    // LED
    const led = document.createElement('div');
    led.style.cssText = `
        width: 12px; height: 12px; border-radius: 50%;
        background: #0f0; margin-top: 25px; margin-bottom: 15px;
        box-shadow: 0 0 10px #0f0, inset 0 1px 2px rgba(255,255,255,0.5);
        border: 1px solid #080;
    `;
    container.appendChild(led);

    // Footswitch
    const button = document.createElement('div');
    button.style.cssText = `
        width: 50px; height: 50px; border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #444, #111);
        border: 3px solid #0d4d0d; cursor: pointer;
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
            led.style.background = '#0f0';
            led.style.boxShadow = '0 0 10px #0f0, inset 0 1px 2px rgba(255,255,255,0.5)';
        }

        plugin.audioNode.setBypass(bypassed);
    });
    button.addEventListener('pointerdown', (e) => e.stopPropagation());

    container.appendChild(button);

    return container;
}
