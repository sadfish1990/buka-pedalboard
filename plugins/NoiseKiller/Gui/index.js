// NoiseKiller GUI - ISP Decimator Style
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #1a1a1a;
        width: 240px;
        height: 340px;
        border-radius: 8px;
        border: 3px solid #333;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        user-select: none;
        font-family: 'Arial', sans-serif;
        touch-action: none;
    `;

    // ISP Logo
    const logo = document.createElement('div');
    logo.innerHTML = "<div style='font-size:18px; font-weight:bold; color:#fff; letter-spacing:2px;'>ISP</div><div style='font-size:20px; font-weight:bold; color:#f00; letter-spacing:1px;'>DECIMATOR</div>";
    logo.style.cssText = "text-align:center; margin-bottom:30px;";
    container.appendChild(logo);

    // Single large knob
    const knobWrap = document.createElement('div');
    knobWrap.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 12px;";

    const knob = document.createElement('div');
    knob.style.cssText = `
        width: 80px; height: 80px; border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #555, #222);
        border: 3px solid #fff;
        position: relative; cursor: pointer;
        box-shadow: 0 6px 12px rgba(0,0,0,0.8), inset 0 2px 6px rgba(255,255,255,0.1);
    `;

    const indicator = document.createElement('div');
    indicator.style.cssText = `
        width: 4px; height: 45%; background: #f00;
        position: absolute; top: 8px; left: 50%;
        margin-left: -2px; transform-origin: bottom center;
        border-radius: 2px;
    `;
    knob.appendChild(indicator);

    const label = document.createElement('div');
    label.textContent = "THRESHOLD";
    label.style.cssText = "font-size: 12px; font-weight: bold; color: #ccc; text-transform: uppercase; letter-spacing: 1px;";

    let val = 0.5;
    const update = (v) => {
        val = Math.max(0, Math.min(1, v));
        const deg = -135 + (val * 270);
        indicator.style.transform = `rotate(${deg}deg)`;
        plugin.audioNode.setParamValue('threshold', val);
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

    update(0.5);
    knobWrap.appendChild(knob);
    knobWrap.appendChild(label);
    container.appendChild(knobWrap);

    // LED
    const led = document.createElement('div');
    led.style.cssText = `
        width: 16px; height: 16px; border-radius: 50%;
        background: #f00; margin-top: 30px; margin-bottom: 20px;
        box-shadow: 0 0 12px #f00, inset 0 1px 2px rgba(255,255,255,0.5);
        border: 2px solid #800;
    `;
    container.appendChild(led);

    // Footswitch
    const button = document.createElement('div');
    button.style.cssText = `
        width: 50px; height: 50px; border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #555, #222);
        border: 3px solid #111; cursor: pointer;
        box-shadow: 0 5px 10px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.1);
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
