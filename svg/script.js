document.addEventListener('DOMContentLoaded', () => {
    const inputSvg = document.getElementById('input-svg');
    const colorFill = document.getElementById('color-fill');
    const textFill = document.getElementById('text-fill');
    const colorStroke = document.getElementById('color-stroke');
    const textStroke = document.getElementById('text-stroke');
    const strokeWidth = document.getElementById('stroke-width');
    const scaleSlider = document.getElementById('scale-slider');
    const scaleVal = document.getElementById('scale-val');
    
    const svgContainer = document.getElementById('svg-container');
    const btnCopySvg = document.getElementById('btn-copy-svg');
    const btnReset = document.getElementById('btn-reset');
    const toast = document.getElementById('toast');

    const defaultPlaceholder = svgContainer.innerHTML;

    // -------------------------------------------------------------
    // Parsing and Overriding Logic
    // -------------------------------------------------------------
    function updateSVG() {
        const rawCode = inputSvg.value.trim();
        if (!rawCode) {
            svgContainer.innerHTML = defaultPlaceholder;
            return;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(rawCode, 'image/svg+xml');
        const parserError = doc.querySelector('parsererror');

        if (parserError) {
            // If syntax error, do not update display
            return;
        }

        const svgNode = doc.querySelector('svg');
        if (!svgNode) {
            return;
        }

        // Apply attributes recursively to shapes
        applyVectorOverrides(svgNode);

        // Render to preview container
        svgContainer.innerHTML = '';
        svgContainer.appendChild(svgNode);
    }

    function applyVectorOverrides(node) {
        if (node.nodeType !== 1) return; // Only process element nodes

        const tagName = node.tagName.toLowerCase();
        const shapeTags = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line'];

        if (shapeTags.includes(tagName)) {
            // Apply Fill Color
            const fillHex = textFill.value.trim();
            if (/^#[0-9A-Fa-f]{3,6}$/.test(fillHex)) {
                const currentFill = node.getAttribute('fill') || node.style.fill;
                if (currentFill !== 'none') {
                    node.setAttribute('fill', fillHex);
                    node.style.fill = fillHex;
                }
            }

            // Apply Stroke Color
            const strokeHex = textStroke.value.trim();
            if (/^#[0-9A-Fa-f]{3,6}$/.test(strokeHex)) {
                const currentStroke = node.getAttribute('stroke') || node.style.stroke;
                if (currentStroke !== 'none') {
                    node.setAttribute('stroke', strokeHex);
                    node.style.stroke = strokeHex;
                }
            }

            // Apply Stroke Width
            const strokeW = parseFloat(strokeWidth.value);
            if (!isNaN(strokeW) && strokeW >= 0) {
                const currentStroke = node.getAttribute('stroke') || node.style.stroke;
                if (currentStroke !== 'none' || strokeW > 0) {
                    node.setAttribute('stroke-width', strokeW);
                    node.style.strokeWidth = `${strokeW}px`;
                }
            }
        }

        for (let child of node.children) {
            applyVectorOverrides(child);
        }
    }

    // -------------------------------------------------------------
    // Color Pickers Synchronization
    // -------------------------------------------------------------
    function setupColorSync(picker, field) {
        picker.addEventListener('input', () => {
            field.value = picker.value.toUpperCase();
            updateSVG();
        });

        field.addEventListener('input', () => {
            const hex = field.value.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                picker.value = hex;
                updateSVG();
            } else if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
                // Short hex mapping (e.g. #F00 -> #FF0000)
                const fullHex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
                picker.value = fullHex;
                updateSVG();
            }
        });
    }

    setupColorSync(colorFill, textFill);
    setupColorSync(colorStroke, textStroke);

    // Stroke width changes
    strokeWidth.addEventListener('input', updateSVG);

    // Pasted code updates
    inputSvg.addEventListener('input', updateSVG);

    // -------------------------------------------------------------
    // Zoom / Scale Logic
    // -------------------------------------------------------------
    scaleSlider.addEventListener('input', () => {
        const val = scaleSlider.value;
        scaleVal.textContent = `${val}%`;
        svgContainer.style.transform = `scale(${val / 100})`;
    });

    // -------------------------------------------------------------
    // Action Controls & Toast Notifications
    // -------------------------------------------------------------
    let toastTimeout = null;
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 1800);
    }

    btnReset.addEventListener('click', () => {
        inputSvg.value = '';
        colorFill.value = '#8859ff';
        textFill.value = '#8859ff';
        colorStroke.value = '#ffffff';
        textStroke.value = '#ffffff';
        strokeWidth.value = '0';
        scaleSlider.value = '100';
        scaleVal.textContent = '100%';
        svgContainer.style.transform = 'scale(1)';
        svgContainer.innerHTML = defaultPlaceholder;
        showToast("Reset completed!");
    });

    btnCopySvg.addEventListener('click', () => {
        const svgContent = svgContainer.innerHTML.trim();
        if (!inputSvg.value.trim()) {
            showToast("Nothing to copy!");
            return;
        }

        navigator.clipboard.writeText(svgContent).then(() => {
            showToast("Copied clean SVG to clipboard!");
        }).catch(() => {
            showToast("Copy failed.");
        });
    });
});
