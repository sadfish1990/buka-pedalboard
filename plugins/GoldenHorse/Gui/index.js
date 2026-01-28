// GoldenHorse GUI - Klon Centaur Style
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: linear-gradient(180deg, #DAA520 0%, #B8860B 100%);
        width: 280px;
        height: 320px;
        border-radius: 8px;
        border: 3px solid #8B7500;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), inset 0 2px 10px rgba(255,255,255,0.3);
        user-select: none;
        font-family: 'Georgia', serif;
        touch-action: none;
    `;

    // Logo
    const logo = document.createElement('div');
    logo.innerHTML = "🐴";
    logo.style.cssText = "font-size: 48px; margin-bottom: 10px; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));";
    container.appendChild(logo);

    const title = document.createElement('div');
    title.textContent = "CENTAUR";
    title.style.cssText = "font-size: 18px; font-weight: bold; color: #2a2a2a; letter-spacing: 3px; margin-bottom: 20px; text-shadow: 1px 1px 2px rgba(255,255,255,0.5);";
    container.appendChild(title);

    // Helper: Create Knob
    const createKnob = (label, param, defaultVal) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 8px;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #fff, #ddd);
            border: 2px solid #333;
            position: relative; cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.8);
        `;

        const indicator = document.createElement('div');
        indicator.style.cssText = `
            width: 3px; height: 40%; background: #333;
            position: absolute; top: 5px; left: 50%;
            margin-left: -1.5px; transform-origin: bottom center;
            border-radius: 2px;
        `;
        knob.appendChild(indicator);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.cssText = "font-size: 11px; font-weight: bold; color: #2a2a2a; text-transform: uppercase; letter-spacing: 1px;";

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
    knobsRow.style.cssText = "display: flex; gap: 30px; margin-top: 20px;";

    knobsRow.appendChild(createKnob("Gain", "gain", 0.5));
    knobsRow.appendChild(createKnob("Tone", "tone", 0.5));
    knobsRow.appendChild(createKnob("Output", "output", 0.5));

    container.appendChild(knobsRow);

    // Footswitch
    const footswitch = document.createElement('div');
    footswitch.style.cssText = `
        margin-top: 25px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    `;

    // LED
    const led = document.createElement('div');
    led.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #0f0;
        box-shadow: 0 0 10px #0f0, inset 0 1px 2px rgba(255,255,255,0.5);
        border: 1px solid #333;
    `;

    // Button
    const button = document.createElement('div');
    button.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #555, #222);
        border: 3px solid #111;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.2);
        transition: transform 0.1s;
    `;

    let bypassed = false;

    const updateBypass = () => {
        if (bypassed) {
            led.style.background = '#333';
            led.style.boxShadow = '0 0 2px #111, inset 0 1px 2px rgba(0,0,0,0.5)';
        } else {
            led.style.background = '#0f0';
            led.style.boxShadow = '0 0 10px #0f0, inset 0 1px 2px rgba(255,255,255,0.5)';
        }
        plugin.audioNode.setBypass(bypassed);
    };

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        bypassed = !bypassed;
        button.style.transform = bypassed ? 'translateY(2px)' : 'translateY(0)';
        updateBypass();
    });
    button.addEventListener('pointerdown', (e) => e.stopPropagation());

    updateBypass(); // Init

    footswitch.appendChild(led);
    footswitch.appendChild(button);
    container.appendChild(footswitch);

    // Tagline
    const tagline = document.createElement('div');
    tagline.textContent = "Professional Overdrive";
    tagline.style.cssText = "margin-top: 15px; font-size: 10px; color: #555; font-style: italic;";
    container.appendChild(tagline);

    return container;
}
