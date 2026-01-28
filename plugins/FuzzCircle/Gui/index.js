// FuzzCircle GUI - Fuzz Face Style
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: radial-gradient(circle, #ddd 0%, #aaa 100%);
        width: 350px;
        height: 350px;
        border-radius: 50%;
        border: 6px solid #888;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), inset 0 5px 15px rgba(255,255,255,0.3);
        user-select: none;
        font-family: 'Arial', sans-serif;
        touch-action: none;
        position: relative;
    `;

    // Helper: Create Knob
    const createKnob = (label, param, defaultVal, x, y) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = `position: absolute; left: ${x}px; top: ${y}px; display: flex; flex-direction: column; align-items: center; gap: 8px;`;

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 60px; height: 60px; border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #444, #111);
            border: 3px solid #666;
            position: relative; cursor: pointer;
            box-shadow: 0 5px 10px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1);
        `;

        const indicator = document.createElement('div');
        indicator.style.cssText = `
            width: 4px; height: 45%; background: #ccc;
            position: absolute; top: 5px; left: 50%;
            margin-left: -2px; transform-origin: bottom center;
            border-radius: 2px;
        `;
        knob.appendChild(indicator);

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.cssText = "font-size: 11px; font-weight: bold; color: #333; text-transform: uppercase;";

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

    // Two knobs perfectly symmetric (48px offset from center on each side)
    container.appendChild(createKnob("Fuzz", "fuzz", 0.5, 30, 135));
    container.appendChild(createKnob("Volume", "volume", 0.5, 282, 135));

    // Transistor switch (raised higher, center)
    const switchWrap = document.createElement('div');
    switchWrap.style.cssText = "position: absolute; bottom: 110px; display: flex; flex-direction: column; align-items: center; gap: 5px;";

    const switchLabel = document.createElement('div');
    switchLabel.textContent = "Ge";
    switchLabel.style.cssText = "font-size: 12px; font-weight: bold; color: #333;";

    const switchBtn = document.createElement('div');
    switchBtn.style.cssText = `
        width: 50px; height: 25px; background: #555;
        border: 2px solid #333; border-radius: 3px;
        position: relative; cursor: pointer;
    `;

    const switchHandle = document.createElement('div');
    switchHandle.style.cssText = `
        width: 23px; height: 21px; background: #ccc;
        position: absolute; left: 0; top: 0;
        border: 1px solid #999; transition: left 0.2s;
    `;
    switchBtn.appendChild(switchHandle);

    let isGermanium = true;

    switchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isGermanium = !isGermanium;
        switchHandle.style.left = isGermanium ? '0' : '23px';
        switchLabel.textContent = isGermanium ? 'Ge' : 'Si';
        plugin.audioNode.setParamValue('transistor', isGermanium ? 0 : 1);
    });
    switchBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

    switchWrap.appendChild(switchLabel);
    switchWrap.appendChild(switchBtn);
    container.appendChild(switchWrap);

    // LED
    const led = document.createElement('div');
    led.style.cssText = `
        position: absolute; top: 20px;
        width: 12px; height: 12px; border-radius: 50%;
        background: #0f0;
        box-shadow: 0 0 10px #0f0, inset 0 1px 2px rgba(255,255,255,0.5);
        border: 1px solid #080;
    `;
    container.appendChild(led);

    // Footswitch
    const footswitch = document.createElement('div');
    footswitch.style.cssText = "position: absolute; bottom: 15px;";

    const button = document.createElement('div');
    button.style.cssText = `
        width: 45px; height: 45px; border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #444, #111);
        border: 3px solid #333; cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1);
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

    footswitch.appendChild(button);
    container.appendChild(footswitch);

    // Logo
    const logo = document.createElement('div');
    logo.textContent = "FUZZ FACE";
    logo.style.cssText = "position: absolute; bottom: 70px; font-size: 14px; font-weight: bold; color: #333; letter-spacing: 2px;";
    container.appendChild(logo);

    return container;
}
