// AmpBox GUI - SansAmp GT2 Style
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 15px;
        background: #111;
        width: 340px;
        height: 380px;
        border-radius: 6px;
        border: 2px solid #333;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        user-select: none;
        font-family: 'Arial Narrow', sans-serif;
        touch-action: none;
        color: #ddd;
    `;

    // Logo Header
    const header = document.createElement('div');
    header.style.cssText = "width: 100%; border-bottom: 2px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; display:flex; justify-content:space-between; align-items:flex-end;";
    header.innerHTML = "<div style='font-size:24px; color:#FFD700; font-weight:bold; font-style:italic;'>SANSAMP</div><div style='font-size:18px; font-weight:bold;'>GT2</div>";
    container.appendChild(header);

    // Switches Row
    const switchesRow = document.createElement('div');
    switchesRow.style.cssText = "display: flex; gap: 15px; margin-bottom: 20px; width: 100%; justify-content: center;";

    // Helper: Create 3-way Switch
    const createSwitch = (label, param, options) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; background: #222; padding: 5px; border-radius: 4px; border: 1px solid #444;";

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.cssText = "font-size: 10px; font-weight: bold; margin-bottom: 5px; color: #aaa;";
        wrap.appendChild(lbl);

        const slider = document.createElement('div');
        slider.style.cssText = "width: 20px; height: 60px; background: #000; position: relative; border: 1px solid #555; cursor: pointer;";

        const handle = document.createElement('div');
        handle.style.cssText = "width: 16px; height: 16px; background: #ccc; position: absolute; left: 1px; top: 22px; pointer-events: none; transition: top 0.1s;";
        slider.appendChild(handle);

        // Click logic
        let state = 1; // 0=Top, 1=Mid, 2=Bot
        const update = () => {
            const pos = state === 0 ? 2 : (state === 1 ? 22 : 42);
            handle.style.top = `${pos}px`;
            // Map 0,1,2 to distinct parameter values
            // 0 -> 0.0 (Top)
            // 1 -> 0.5 (Mid)
            // 2 -> 1.0 (Bot)
            const val = state === 0 ? 0.0 : (state === 1 ? 0.5 : 1.0);
            plugin.audioNode.setParamValue(param, val);
        };

        // Listen on wrapper to make click area larger
        wrap.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = slider.getBoundingClientRect();
            // Calculate click relative to slider top
            let y = e.clientY - rect.top;

            // Allow clicking slightly outside vertical bounds
            // Slider height is 60px. Dividing into 3 zones of 20px each.
            if (y < 20) state = 0; // Top third
            else if (y < 40) state = 1; // Mid third
            else state = 2; // Bot third (>= 40)

            // Force state update even if same
            update();
        });
        // Prevent drag issues
        wrap.addEventListener('pointerdown', e => e.stopPropagation());

        // Option labels next to slider
        const optsDiv = document.createElement('div');
        optsDiv.style.cssText = "display: flex; flex-direction: column; justify-content: space-between; height: 60px; margin-left: 5px; font-size: 9px; color: #888; text-align: left;";

        options.forEach((opt, index) => {
            const o = document.createElement('div');
            o.textContent = opt;
            o.style.cursor = "pointer";
            o.style.padding = "2px 5px"; // Increase click area

            // Make label clickable directly
            o.addEventListener('click', (e) => {
                e.stopPropagation();
                state = index;
                update();
            });
            o.addEventListener('pointerdown', e => e.stopPropagation());

            optsDiv.appendChild(o);
        });

        const innerWrap = document.createElement('div');
        innerWrap.style.cssText = "display: flex;";
        innerWrap.appendChild(slider);
        innerWrap.appendChild(optsDiv);

        wrap.appendChild(innerWrap);
        return wrap;
    };

    switchesRow.appendChild(createSwitch("MIC", "mic", ["Classic", "Center", "Off-Axis"]));
    switchesRow.appendChild(createSwitch("MOD", "mod", ["Clean", "Hi-Gain", "Hot-Wired"]));
    switchesRow.appendChild(createSwitch("AMP", "amp", ["California", "British", "Tweed"]));

    container.appendChild(switchesRow);

    // Knobs Row
    const knobsRow = document.createElement('div');
    knobsRow.style.cssText = "display: flex; gap: 15px; margin-bottom: 20px;";

    // Helper: Create Knob
    const createKnob = (label, param, defaultVal) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 5px;";

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 45px; height: 45px; border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #333, #000);
            border: 2px solid #ccc;
            position: relative; cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.6);
        `;

        const indicator = document.createElement('div');
        indicator.style.cssText = `
            width: 2px; height: 40%; background: #fff;
            position: absolute; top: 5px; left: 50%;
            margin-left: -1px; transform-origin: bottom center;
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

    knobsRow.appendChild(createKnob("Level", "level", 0.5));
    knobsRow.appendChild(createKnob("High", "high", 0.5));
    knobsRow.appendChild(createKnob("Low", "low", 0.5));
    knobsRow.appendChild(createKnob("Drive", "drive", 0.5));

    container.appendChild(knobsRow);

    // LED & Bypass
    const footer = document.createElement('div');
    footer.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 10px;";

    const led = document.createElement('div');
    led.style.cssText = `
        width: 10px; height: 10px; border-radius: 50%;
        background: #f00; 
        box-shadow: 0 0 10px #f00, inset 0 1px 2px rgba(255,255,255,0.5);
        border: 1px solid #800;
    `;
    footer.appendChild(led);

    const button = document.createElement('div');
    button.style.cssText = `
        width: 50px; height: 50px; border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #444, #111);
        border: 3px solid #222; cursor: pointer;
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
            led.style.boxShadow = '0 0 10px #f00, inset 0 1px 2px rgba(255,255,255,0.5)';
        }

        plugin.audioNode.setBypass(bypassed);
    });
    button.addEventListener('pointerdown', (e) => e.stopPropagation());

    footer.appendChild(button);
    container.appendChild(footer);

    return container;
}
