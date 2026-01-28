// QTron GUI - MXR Envelope Filter Style
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: linear-gradient(180deg, #FFC800 0%, #C89600 100%);
        width: 340px;
        height: 400px;
        border-radius: 8px;
        border: 3px solid #8B6F00;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), inset 0 2px 10px rgba(255,255,255,0.3);
        user-select: none;
        font-family: 'Arial', sans-serif;
        touch-action: none;
    `;

    // Logo
    const logo = document.createElement('div');
    logo.innerHTML = "<div style='font-size:14px; color:#000; letter-spacing:1px;'>MXR</div><div style='font-size:24px; font-weight:bold; color:#000; letter-spacing:2px;'>Q-TRON</div><div style='font-size:11px; color:#333;'>ENVELOPE FILTER</div>";
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
            width: 3px; height: 40%; background: #FFC800;
            position: absolute; top: 5px; left: 50%;
            margin-left: -1.5px; transform-origin: bottom center;
            border-radius: 2px;
        `;
        knob.appendChild(indicator);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.cssText = "font-size: 11px; font-weight: bold; color: #000; text-transform: uppercase;";

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

    // Knobs Row 1
    const knobsRow1 = document.createElement('div');
    knobsRow1.style.cssText = "display: flex; gap: 20px; margin-bottom: 15px;";
    knobsRow1.appendChild(createKnob("Range", "range", 0.7));
    knobsRow1.appendChild(createKnob("Q", "q", 0.5));
    knobsRow1.appendChild(createKnob("Sens", "sensitivity", 0.5));
    container.appendChild(knobsRow1);

    // Knobs Row 2
    const knobsRow2 = document.createElement('div');
    knobsRow2.style.cssText = "display: flex; gap: 20px; margin-bottom: 20px;";
    knobsRow2.appendChild(createKnob("Mix", "mix", 1.0));
    container.appendChild(knobsRow2);

    // Mode switch
    const switchWrap = document.createElement('div');
    switchWrap.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 5px; margin-bottom: 20px;";

    const switchLabel = document.createElement('div');
    switchLabel.textContent = "UP";
    switchLabel.style.cssText = "font-size: 12px; font-weight: bold; color: #000;";

    const switchBtn = document.createElement('div');
    switchBtn.style.cssText = `
        width: 60px; height: 28px; background: #333;
        border: 2px solid #000; border-radius: 3px;
        position: relative; cursor: pointer;
    `;

    const switchHandle = document.createElement('div');
    switchHandle.style.cssText = `
        width: 28px; height: 24px; background: #FFC800;
        position: absolute; left: 0; top: 0;
        border: 1px solid #8B6F00; transition: left 0.2s;
    `;
    switchBtn.appendChild(switchHandle);

    let isUp = true;

    switchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isUp = !isUp;
        switchHandle.style.left = isUp ? '0' : '28px';
        switchLabel.textContent = isUp ? 'UP' : 'DOWN';
        plugin.audioNode.setParamValue('mode', isUp ? 0 : 1);
    });
    switchBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

    switchWrap.appendChild(switchLabel);
    switchWrap.appendChild(switchBtn);
    container.appendChild(switchWrap);

    // LED
    const led = document.createElement('div');
    led.style.cssText = `
        width: 12px; height: 12px; border-radius: 50%;
        background: #0f0; margin-bottom: 15px;
        box-shadow: 0 0 10px #0f0, inset 0 1px 2px rgba(255,255,255,0.5);
        border: 1px solid #080;
    `;
    container.appendChild(led);

    // Footswitch
    const button = document.createElement('div');
    button.style.cssText = `
        width: 50px; height: 50px; border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #444, #111);
        border: 3px solid #8B6F00; cursor: pointer;
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
