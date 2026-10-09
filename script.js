const phrases = [
    "Working on it...",
    "In progress...",
    "Magic coming...",
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Handle cycling through the list of H1 phrases on click
    const h1Element = document.querySelector('h1');
    if (h1Element) {
        // Find initial index if the current text is in the array, otherwise default to 0
        let currentPhraseIndex = phrases.indexOf(h1Element.textContent.trim());
        if (currentPhraseIndex === -1) {
            currentPhraseIndex = 0;
        }

        h1Element.addEventListener('click', () => {
            currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
            h1Element.textContent = phrases[currentPhraseIndex];
        });

        // Prevent double-click text selection on desktop, while still allowing drag selection
        h1Element.addEventListener('mousedown', (e) => {
            if (e.detail > 1) {
                e.preventDefault();
            }
        });

        // Prevent double-tap text selection on mobile devices (iOS & Android)
        let lastTapTime = 0;
        let isDoubleTap = false;

        h1Element.addEventListener('touchstart', (e) => {
            const now = Date.now();
            if (now - lastTapTime < 300) {
                isDoubleTap = true;
            } else {
                isDoubleTap = false;
            }
            lastTapTime = now;
        }, { passive: true });

        document.addEventListener('selectionchange', () => {
            if (isDoubleTap) {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    if (h1Element.contains(range.commonAncestorContainer)) {
                        selection.removeAllRanges();
                    }
                }
            }
        });
    }
});
