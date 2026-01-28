// OrangeDistortion GUI - Boss DS-1 Style
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: linear-gradient(180deg, #FF8C00 0%, #CC7000 100%);
        width: 280px;
        height: 360px;
        border-radius: 8px;
        border: 3px solid #994400;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), inset 0 2px 10px rgba(255,255,255,0.2);
        user-select: none;
        font-family: 'Arial Black', sans-serif;
        touch-action: none;
    `;

    // BOSS logo
    const bossLogo = document.createElement('div');
    bossLogo.textContent = "BOSS";
    bossLogo.style.cssText = `
        background: #000;
        color: #fff;
        padding: 8px 30px;
        font-size: 20px;
        font-weight: bold;
        letter-spacing: 4px;
        margin-bottom: 10px;
        border-radius: 3px;
    `;
    container.appendChild(bossLogo);

    // Model name
    const model = document.createElement('div');
    model.innerHTML = "<div style='font-size:24px; font-weight:bold; color:#000; letter-spacing:2px;'>DS-1</div><div style='font-size:11px; color:#333;'>DISTORTION</div>";
    model.style.cssText = "text-align:center; margin-bottom:20px;";
    container.appendChild(model);

    // Helper: Create Knob
    const createKnob = (label, param, defaultVal) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 8px;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #333, #000);
            border: 3px solid #CC7000;
            position: relative; cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1);
        `;

        const indicator = document.createElement('div');
        indicator.style.cssText = `
            width: 4px; height: 40%; background: #FF8C00;
            position: absolute; top: 5px; left: 50%;
            margin-left: -2px; transform-origin: bottom center;
            border-radius: 2px;
        `;
        knob.appendChild(indicator);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.cssText = "font-size: 10px; font-weight: bold; color: #000; text-transform: uppercase;";

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

    knobsRow.appendChild(createKnob("Tone", "tone", 0.5));
    knobsRow.appendChild(createKnob("Level", "level", 0.5));
    knobsRow.appendChild(createKnob("Dist", "distortion", 0.5));

    container.appendChild(knobsRow);

    // LED (add before footswitch section)
    const led = document.createElement('div');
    led.style.cssText = `
        width: 14px; height: 14px; border-radius: 50%;
        background: #f00;
        box-shadow: 0 0 12px #f00, inset 0 1px 2px rgba(255,255,255,0.5);
        border: 2px solid #800;
        margin-bottom: 15px;
    `;
    container.appendChild(led);

    // Footswitch
    const footswitch = document.createElement('div');
    footswitch.style.cssText = "margin-top: 15px;";

    const button = document.createElement('div');
    button.style.cssText = `
        width: 50px; height: 50px; border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #333, #000);
        border: 4px solid #CC7000; cursor: pointer;
        box-shadow: 0 5px 10px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1);
        transition: transform 0.1s;
    `;

    let bypassed = false;

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        bypassed = !bypassed;
        button.style.transform = bypassed ? 'translateY(3px)' : 'translateY(0)';
        button.style.boxShadow = bypassed ?
            '0 2px 5px rgba(0,0,0,0.6)' :
            '0 5px 10px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1)';

        // Update LED
        if (bypassed) {
            led.style.background = '#333';
            led.style.boxShadow = '0 0 2px #111, inset 0 1px 2px rgba(0,0,0,0.5)';
        } else {
            led.style.background = '#f00';
            led.style.boxShadow = '0 0 12px #f00, inset 0 1px 2px rgba(255,255,255,0.5)';
        }

        plugin.audioNode.setBypass(bypassed);
    });
    button.addEventListener('pointerdown', (e) => e.stopPropagation());

    footswitch.appendChild(button);
    container.appendChild(footswitch);

    return container;
}
