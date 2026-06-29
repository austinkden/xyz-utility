document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const toast = document.getElementById('toast');

    // Stats elements
    const statChars = document.getElementById('stat-chars');
    const statWords = document.getElementById('stat-words');
    const statLines = document.getElementById('stat-lines');
    const statTime = document.getElementById('stat-time');

    // Operations trigger buttons
    const actionButtons = document.querySelectorAll('.action-btn');

    // -------------------------------------------------------------
    // String Transformation Functions
    // -------------------------------------------------------------

    // Helper: split text into words, respecting camel/snake/kebab structures
    function getWords(str) {
        if (!str) return [];
        // Replace transitions of lowercase to uppercase with a space (camelCase splitting)
        let s = str.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
        // Replace underscores/hyphens with spaces
        s = s.replace(/[_\-]/g, ' ');
        // Split by whitespace
        return s.trim().split(/\s+/);
    }

    // Transformations
    const transforms = {
        camel: (str) => {
            const words = getWords(str);
            if (words.length === 0) return '';
            return words.map((w, idx) => {
                const lower = w.toLowerCase();
                if (idx === 0) return lower;
                return lower.charAt(0).toUpperCase() + lower.slice(1);
            }).join('');
        },
        snake: (str) => {
            const words = getWords(str);
            return words.map(w => w.toLowerCase()).join('_');
        },
        pascal: (str) => {
            const words = getWords(str);
            return words.map(w => {
                const lower = w.toLowerCase();
                return lower.charAt(0).toUpperCase() + lower.slice(1);
            }).join('');
        },
        kebab: (str) => {
            const words = getWords(str);
            return words.map(w => w.toLowerCase()).join('-');
        },
        upper: (str) => {
            return str.toUpperCase();
        },
        lower: (str) => {
            return str.toLowerCase();
        },
        title: (str) => {
            const words = str.split(/(\s+)/); // keep whitespace matching spacing
            return words.map(w => {
                if (/^\s+$/.test(w)) return w;
                return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
            }).join('');
        },
        'url-encode': (str) => {
            return encodeURIComponent(str);
        },
        'url-decode': (str) => {
            try {
                return decodeURIComponent(str);
            } catch (e) {
                return 'Error: Invalid URL encoding.';
            }
        },
        'base64-encode': (str) => {
            try {
                // btoa alone fails on unicode/emoji. This handles UTF-8 correctly:
                return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                    return String.fromCharCode('0x' + p1);
                }));
            } catch (e) {
                return 'Error: Cannot Base64 encode text.';
            }
        },
        'base64-decode': (str) => {
            try {
                // decode base64 back to utf-8 safely
                return decodeURIComponent(atob(str.trim()).split('').map(c => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
            } catch (e) {
                return 'Error: Invalid Base64 string.';
            }
        },
        'html-escape': (str) => {
            return str.replace(/[&<>"']/g, (m) => {
                switch (m) {
                    case '&': return '&amp;';
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '"': return '&quot;';
                    case "'": return '&#039;';
                    default: return m;
                }
            });
        },
        'html-unescape': (str) => {
            const temp = document.createElement('textarea');
            temp.innerHTML = str;
            return temp.value;
        }
    };

    // -------------------------------------------------------------
    // Live Statistics Calculator
    // -------------------------------------------------------------

    function updateStats() {
        const text = inputText.value;
        
        // Character count
        statChars.textContent = text.length;

        // Word count
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        statWords.textContent = words.length;

        // Line count
        const lines = text.length > 0 ? text.split('\n').length : 0;
        statLines.textContent = lines;

        // Reading time (average 200 WPM)
        const wpm = 200;
        const minutes = words.length / wpm;
        if (words.length === 0) {
            statTime.textContent = '0m';
        } else if (minutes < 1) {
            statTime.textContent = '< 1m';
        } else {
            statTime.textContent = `${Math.round(minutes)}m`;
        }
    }

    // -------------------------------------------------------------
    // Clipboard & Toast Actions
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

    // -------------------------------------------------------------
    // Event Listeners
    // -------------------------------------------------------------

    // Text typed/pasted updates statistics
    inputText.addEventListener('input', updateStats);

    // Clear everything
    clearBtn.addEventListener('click', () => {
        inputText.value = '';
        outputText.value = '';
        updateStats();
        inputText.focus();
    });

    // Copy output button click
    copyBtn.addEventListener('click', () => {
        const outVal = outputText.value;
        if (!outVal) {
            showToast("Nothing to copy!");
            return;
        }
        navigator.clipboard.writeText(outVal).then(() => {
            showToast("Copied to clipboard!");
        }).catch(() => {
            showToast("Copy failed.");
        });
    });

    // Action button clicks (apply transforms)
    actionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            const sourceVal = inputText.value;

            if (!sourceVal) {
                showToast("Please enter some input text first.");
                return;
            }

            if (transforms[action]) {
                const transformed = transforms[action](sourceVal);
                outputText.value = transformed;
                showToast(`Applied ${btn.textContent}!`);
            }
        });
    });

    // Run initial stats setup
    updateStats();
});
