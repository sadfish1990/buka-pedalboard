// SimpleIR Pro GUI with Knobs
export default function createElement(plugin) {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        padding: 20px;
        background: radial-gradient(circle at top left, #2a2a2a, #1a1a1a);
        color: #f0f0f0;
        font-family: 'Arial', sans-serif;
        border-radius: 12px;
        width: 350px;
        border: 1px solid #333;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        user-select: none; /* Prevent text selection */
    `;

    // Title
    const title = document.createElement('h3');
    title.textContent = "IR Loader";
    title.style.cssText = "margin: 0 0 20px 0; color: #00ff88; text-align: center; text-transform: uppercase; letter-spacing: 3px; font-size: 18px; text-shadow: 0 0 10px rgba(0,255,136,0.3);";
    container.appendChild(title);

    // IR Selector
    const selectContainer = document.createElement('div');
    selectContainer.style.marginBottom = '25px';

    const select = document.createElement('select');
    select.style.cssText = `
        width: 100%; 
        background: #111; 
        color: #00ff88; 
        padding: 10px; 
        border: 1px solid #444; 
        border-radius: 6px;
        outline: none;
        font-family: monospace;
        font-size: 12px;
        cursor: pointer;
    `;

    // Combined Impulses List
    const impulses = [
        {
            group: "Cabinets", opts: [
                { val: 'cabinet/Marshall1960.wav', text: 'Marshall 1960' },
                { val: 'cabinet/FenderChampAxisStereo.wav', text: 'Fender Champ' },
                { val: 'cabinet/voxCustomBrightM930OnAxis1.wav', text: 'Vox Custom' },
                { val: 'cabinet/marshall-4_impact.wav', text: 'Marshall 4x12' }
            ]
        },
        {
            group: "Reverbs", opts: [
                { val: 'reverb/cardiod-rear-levelled.wav', text: 'Studio Room' },
                { val: 'reverb/pcm90cleanplate.wav', text: 'Clean Plate' },
                { val: 'reverb/ScalaMilanOperaHall.wav', text: 'Opera Hall' }
            ]
        }
    ];

    impulses.forEach(group => {
        const grpEl = document.createElement('optgroup');
        grpEl.label = group.group;
        group.opts.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.val;
            o.text = opt.text;
            grpEl.appendChild(o);
        });
        select.appendChild(grpEl);
    });

    select.addEventListener('change', (e) => {
        plugin.audioNode.loadImpulse(e.target.value);
    });

    // STOP PROPAGATION ON SELECTOR (All variants)
    const stopPropagation = (e) => e.stopPropagation();
    select.addEventListener('mousedown', stopPropagation);
    select.addEventListener('touchstart', stopPropagation);
    select.addEventListener('pointerdown', stopPropagation);
    select.addEventListener('click', stopPropagation);

    selectContainer.appendChild(select);
    container.appendChild(selectContainer);

    // Knobs Row
    const knobsRow = document.createElement('div');
    knobsRow.style.cssText = "display: flex; justify-content: space-around; padding: 10px 0;";

    // Helper: Create Rotatable Knob
    const createKnob = (label, paramName, min, max, defaultVal) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 8px;";

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.cssText = "font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase;";

        const knobVisual = document.createElement('div');
        knobVisual.style.cssText = `
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(145deg, #222, #111);
            border: 2px solid #444;
            position: relative;
            cursor: pointer;
            box-shadow: 4px 4px 8px #0d0d0d, -4px -4px 8px #2d2d2d;
            touch-action: none; /* Critical for touch devices */
        `;

        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: absolute;
            width: 3px;
            height: 20px;
            background: #00ff88;
            top: 6px;
            left: 50%;
            transform-origin: 50% 24px;
            transform: translateX(-50%) rotate(0deg);
            border-radius: 2px;
            box-shadow: 0 0 5px #00ff88;
            pointer-events: none;
        `;
        knobVisual.appendChild(indicator);

        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = defaultVal.toFixed(1);
        valueDisplay.style.cssText = "font-size: 12px; color: #00ff88; font-family: monospace; min-height: 15px;";

        let isDragging = false;
        let startY = 0;
        let startValue = defaultVal;

        const updateKnob = (value) => {
            const normalized = (value - min) / (max - min);
            const degrees = -135 + (normalized * 270);
            indicator.style.transform = `translateX(-50%) rotate(${degrees}deg)`;
            valueDisplay.textContent = value.toFixed(1);
            plugin.audioNode.setParamValue(paramName, value);
        };

        // EVENT HANDLERS
        const startDrag = (y) => {
            isDragging = true;
            startY = y;
            startValue = plugin.audioNode.getParamValue(paramName) || defaultVal;
        };

        const onMove = (y) => {
            if (!isDragging) return;
            const delta = (startY - y) * 0.05;
            const newValue = Math.max(min, Math.min(max, startValue + delta));
            updateKnob(newValue);
        };

        // MOUSE
        knobVisual.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Stop pedalboard drag
            e.preventDefault();  // Prevent text selection
            startDrag(e.clientY);

            // Add listeners to window to handle drags outside knob
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });

        const onMouseMove = (e) => {
            e.stopPropagation();
            e.preventDefault();
            onMove(e.clientY);
        };

        const onMouseUp = () => {
            isDragging = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        // TOUCH / POINTER
        // Using pointer events covers both usually, but explicit touch is safer for old web views
        knobVisual.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            // Typically don't need preventDefault on pointerdown for scroll unless needed
            knobVisual.setPointerCapture(e.pointerId);
            startDrag(e.clientY);
        });

        knobVisual.addEventListener('pointermove', (e) => {
            e.stopPropagation();
            if (isDragging) onMove(e.clientY);
        });

        knobVisual.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            isDragging = false;
            knobVisual.releasePointerCapture(e.pointerId);
        });

        // Init
        updateKnob(defaultVal);

        wrapper.appendChild(labelEl);
        wrapper.appendChild(knobVisual);
        wrapper.appendChild(valueDisplay);

        return wrapper;
    };

    knobsRow.appendChild(createKnob('Mix', 'mix', 0, 10, 0)); // Start Dry
    knobsRow.appendChild(createKnob('Level', 'level', 0, 10, 8));
    container.appendChild(knobsRow);

    // Footer
    const footer = document.createElement('div');
    footer.textContent = "Pro Impulse Loader";
    footer.style.cssText = "margin-top: 15px; font-size: 9px; color: #555; text-align: center;";
    container.appendChild(footer);

    return container;
}
