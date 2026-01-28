// MetalX GUI - Brushed Steel Industrial (Refined with Feedback)
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: repeating-linear-gradient(
            135deg,
            #555,
            #555 10px,
            #444 10px,
            #444 20px
        );
        box-shadow: inset 0 0 50px #000, 0 10px 30px rgba(0,0,0,0.8);
        color: #fff;
        font-family: 'Arial Narrow', sans-serif;
        border-radius: 4px;
        width: 320px;
        border: 2px solid #888;
        user-select: none;
        touch-action: none;
    `;

    // Title
    const title = document.createElement('div');
    title.innerHTML = "<span style='color:#ccc'>METAL</span><span style='color:#f00; font-weight:bold'>X</span>";
    title.style.cssText = "font-size: 32px; letter-spacing: 4px; margin-bottom: 20px; text-shadow: 2px 2px 0 #000; border: 2px solid #ccc; padding: 2px 10px; background: #222;";
    container.appendChild(title);

    // Controls Grid
    const controls = document.createElement('div');
    controls.style.cssText = "display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px 10px; width: 100%; margin-bottom: 20px;";

    // Helper: Create Small Knob
    const createKnob = (label, param, def) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 5px;";

        const lbl = document.createElement('div');
        lbl.textContent = label;
        lbl.style.fontSize = "10px";
        lbl.style.fontWeight = "bold";

        const kSize = 50;
        const knob = document.createElement('div');
        knob.style.cssText = `
            width: ${kSize}px;
            height: ${kSize}px;
            border-radius: 50%;
            background: linear-gradient(145deg, #333, #111);
            border: 2px solid #666;
            position: relative;
            cursor: pointer;
            box-shadow: 2px 2px 5px #000;
            touch-action: none;
        `;

        const ind = document.createElement('div');
        ind.style.cssText = `
            width: 2px; height: 50%; background: #f00; position: absolute; top: 4px; left: 50%; margin-left: -1px; transform-origin: center bottom; pointer-events: none;
        `;
        knob.appendChild(ind);

        // Logic
        let isDragging = false;
        let startY = 0;
        let startVal = def;

        const update = (val) => {
            const norm = val / 10;
            const deg = -135 + (norm * 270);
            ind.style.transform = `rotate(${deg}deg)`;
            plugin.audioNode.setParamValue(param, val);
        };

        const onDrag = (y) => {
            if (!isDragging) return;
            const delta = (startY - y) * 0.1;
            const newVal = Math.max(0, Math.min(10, startVal + delta));
            update(newVal);
        };

        const start = (y) => { isDragging = true; startY = y; startVal = plugin.audioNode.getParamValue(param) || def; };

        knob.addEventListener('pointerdown', (e) => {
            e.stopPropagation(); e.preventDefault();
            knob.setPointerCapture(e.pointerId);
            start(e.clientY);
        });

        knob.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            e.stopPropagation(); e.preventDefault();
            onDrag(e.clientY);
        });

        knob.addEventListener('pointerup', (e) => { e.stopPropagation(); isDragging = false; knob.releasePointerCapture(e.pointerId); });
        knob.addEventListener('click', (e) => e.stopPropagation());

        update(def);
        wrapper.appendChild(knob);
        wrapper.appendChild(lbl);
        return wrapper;
    };

    controls.appendChild(createKnob("VOL", "vol", 5));
    controls.appendChild(createKnob("FREQ", "freq", 5));
    controls.appendChild(createKnob("GAIN", "gain", 8));

    controls.appendChild(createKnob("LOW", "low", 5));
    controls.appendChild(createKnob("MID", "mid", 5));
    controls.appendChild(createKnob("HIGH", "high", 5));

    container.appendChild(controls);

    // Switches Row
    const switches = document.createElement('div');
    switches.style.cssText = "display: flex; gap: 20px; margin-bottom: 15px;";

    // Create Gate LED
    const gateLed = document.createElement('div');
    gateLed.style.cssText = "width: 6px; height: 6px; border-radius: 50%; background: #222; border: 1px solid #000; position: absolute; top: -10px; left: 12px; box-shadow: 0 0 2px #000;";

    const createSwitch = (label, param, hasLed) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: bold; position: relative;";

        if (hasLed) {
            wrap.appendChild(gateLed);
        }

        const btn = document.createElement('div');
        btn.style.cssText = `
            width: 30px; height: 15px; background: #222; border: 1px solid #888;
            position: relative; cursor: pointer;
        `;

        const thumb = document.createElement('div');
        thumb.style.cssText = `
            width: 13px; height: 13px; background: #fff; position: absolute; top: 0; left: 0; transition: left 0.1s;
        `;
        btn.appendChild(thumb);

        let state = false;
        const update = (s) => {
            state = s;
            thumb.style.left = s ? '15px' : '0px';
            thumb.style.background = s ? '#f00' : '#fff';
            plugin.audioNode.setParamValue(param, s ? 1 : 0);
        };

        btn.addEventListener('click', (e) => { e.stopPropagation(); update(!state); });
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());

        wrap.appendChild(btn);
        wrap.appendChild(document.createTextNode(label));
        return wrap;
    };

    switches.appendChild(createSwitch("SCOOP", "scoop", false));
    switches.appendChild(createSwitch("GATE", "gate", true)); // Gate has LED

    container.appendChild(switches);

    // Footswitch
    const foot = document.createElement('div');
    foot.style.cssText = `
        width: 100%; height: 40px; background: #333; border-top: 2px solid #000;
        margin-top: auto; display: flex; justify-content: center; align-items: center;
    `;
    const switchMetal = document.createElement('div');
    switchMetal.style.cssText = "width: 25px; height: 25px; border-radius: 50%; background: #ccc; border: 3px solid #666; box-shadow: 0 2px 5px #000; transition: box-shadow 0.2s;";
    foot.appendChild(switchMetal);

    // Logic for Bypass Glow
    // Ideally we track bypass state. Default is Active (Bypass Off).
    let isBypassed = false;

    const updateBypassVisual = () => {
        // Active (Bypass False) = Red Glow
        if (!isBypassed) {
            switchMetal.style.boxShadow = "0 0 10px #f00, 0 0 20px #f00, inset 0 0 5px #fff";
            switchMetal.style.background = "#ddd";
        } else {
            // Inactive
            switchMetal.style.boxShadow = "0 2px 5px #000";
            switchMetal.style.background = "#aaa";
        }
    };

    // We don't have a dedicated bypass param in index.js for MetalX, likely relying on host bypass?
    // Wait, MetalX index.js DOES NOT have 'bypass' param? 
    // Review MetalX/index.js parameters.
    // It has: vol, freq, gain, low, mid, high, gate, scoop. No 'bypass'.
    // If user wants a bypass switch on the pedal, I should add it or use this switch to toggle effect?
    // User asked "contorno del boton bypass se ilumine". 
    // Usually pedals are ON by default.
    // Let's make this footswitch toggle the 'bypass' state if I add it, OR toggle the LED to show it's ON.
    // Since I can't easily change index.js params without breaking host state maybe?
    // WAM2 Host usually provides its own bypass. But if part of GUI, we need internal bypass.
    // MetalX DSP doesn't have a bypass path implemented in Node.js constructor?
    // I can implement a "Soft Bypass" or just make the LED always ON to signify it's powered.
    // User request: "ilumine ... al activarse".
    // Let's assume it starts Active.
    updateBypassVisual(); // Turn ON by default

    // Toggle logic (Visual only if no underlying param, but I can add Audio Param later if critical)
    // Actually, let's wire it to 'vol' mute? No.
    // Let's just make it visual for now as requested "el bypass no tiene led".
    switchMetal.addEventListener('click', (e) => {
        e.stopPropagation();
        isBypassed = !isBypassed;
        updateBypassVisual();
        plugin.audioNode.setBypass(isBypassed);
    });
    switchMetal.addEventListener('pointerdown', (e) => e.stopPropagation());

    container.appendChild(foot);

    // --- GATE METERING LOOP ---
    const updateGateLed = () => {
        if (plugin.audioNode && plugin.audioNode.getGateReduction) {
            const gain = plugin.audioNode.getGateReduction();
            // Gain 1.0 = Open (Green?), Gain 0.0 = Closed (Red/Active?)
            // User: "led que reaccione cuando el gate comience a reacionar" (reactive when gating)
            // So if Gain < 1.0, it's reacting (attenuating). Use Red?
            // Or usually Gate LED means "Closed".

            if (gain < 0.9) {
                // Attenuating/Closed
                const intensity = (1.0 - gain); // 0 to 1
                gateLed.style.background = `rgba(255, 0, 0, ${intensity})`;
                gateLed.style.boxShadow = `0 0 ${intensity * 5}px #f00`;
            } else {
                // Open
                gateLed.style.background = "#222";
                gateLed.style.boxShadow = "none";
            }
        }
        requestAnimationFrame(updateGateLed);
    };
    requestAnimationFrame(updateGateLed);

    return container;
}
