document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const passwordDisplay = document.getElementById('password-display');
    const copyBtn = document.getElementById('copy-btn');
    const lengthSlider = document.getElementById('length-slider');
    const lengthVal = document.getElementById('length-val');
    
    const optUppercase = document.getElementById('opt-uppercase');
    const optLowercase = document.getElementById('opt-lowercase');
    const optNumbers = document.getElementById('opt-numbers');
    const optSymbols = document.getElementById('opt-symbols');
    
    const strengthIndicator = document.getElementById('strength-indicator');
    const generateBtn = document.getElementById('generate-btn');

    // Character Sets
    const charSets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    // Copy Icon SVG Markup
    const copyIconHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    `;

    // Checked Icon SVG Markup
    const checkIconHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    `;

    // Generate secure password
    function generatePassword() {
        const length = parseInt(lengthSlider.value, 10);
        let allowedChars = '';
        let mandatoryChars = [];

        if (optUppercase.checked) {
            allowedChars += charSets.uppercase;
            mandatoryChars.push(getRandomChar(charSets.uppercase));
        }
        if (optLowercase.checked) {
            allowedChars += charSets.lowercase;
            mandatoryChars.push(getRandomChar(charSets.lowercase));
        }
        if (optNumbers.checked) {
            allowedChars += charSets.numbers;
            mandatoryChars.push(getRandomChar(charSets.numbers));
        }
        if (optSymbols.checked) {
            allowedChars += charSets.symbols;
            mandatoryChars.push(getRandomChar(charSets.symbols));
        }

        // If no option is checked, default to lowercase
        if (allowedChars === '') {
            optLowercase.checked = true;
            allowedChars = charSets.lowercase;
            mandatoryChars.push(getRandomChar(charSets.lowercase));
        }

        let password = [];
        
        // Fill first places with mandatory elements to guarantee complexity
        for (let i = 0; i < mandatoryChars.length; i++) {
            password.push(mandatoryChars[i]);
        }

        // Fill remaining length with randomly selected characters
        const cryptoObj = window.crypto || window.msCrypto;
        if (cryptoObj) {
            const array = new Uint32Array(length - mandatoryChars.length);
            cryptoObj.getRandomValues(array);
            for (let i = 0; i < array.length; i++) {
                const index = array[i] % allowedChars.length;
                password.push(allowedChars[index]);
            }
        } else {
            // Fallback if window.crypto is unavailable
            for (let i = mandatoryChars.length; i < length; i++) {
                const index = Math.floor(Math.random() * allowedChars.length);
                password.push(allowedChars[index]);
            }
        }

        // Shuffle the final password characters
        password = shuffleArray(password).join('');
        passwordDisplay.value = password;
        updateStrength(password);
    }

    // Helper: Select random character from set
    function getRandomChar(str) {
        const cryptoObj = window.crypto || window.msCrypto;
        if (cryptoObj) {
            const array = new Uint32Array(1);
            cryptoObj.getRandomValues(array);
            return str[array[0] % str.length];
        }
        return str[Math.floor(Math.random() * str.length)];
    }

    // Helper: Shuffle array securely
    function shuffleArray(array) {
        const cryptoObj = window.crypto || window.msCrypto;
        for (let i = array.length - 1; i > 0; i--) {
            let j;
            if (cryptoObj) {
                const randomVal = new Uint32Array(1);
                cryptoObj.getRandomValues(randomVal);
                j = randomVal[0] % (i + 1);
            } else {
                j = Math.floor(Math.random() * (i + 1));
            }
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Update strength indicator badge
    function updateStrength(password) {
        let score = 0;
        
        // Criteria 1: Length contribution
        if (password.length >= 12) score += 2;
        else if (password.length >= 8) score += 1;
        
        // Criteria 2: Complexity (variety of sets)
        let setsCount = 0;
        if (optUppercase.checked) setsCount++;
        if (optLowercase.checked) setsCount++;
        if (optNumbers.checked) setsCount++;
        if (optSymbols.checked) setsCount++;
        
        score += setsCount;

        // Determine strength evaluation
        if (password.length < 10 || score <= 3) {
            strengthIndicator.className = 'strength-badge strength-weak';
            strengthIndicator.textContent = 'Weak';
        } else if (password.length >= 16 && setsCount >= 3 || score >= 5) {
            strengthIndicator.className = 'strength-badge strength-strong';
            strengthIndicator.textContent = 'Strong';
        } else {
            strengthIndicator.className = 'strength-badge strength-medium';
            strengthIndicator.textContent = 'Medium';
        }
    }

    // Handle copying to clipboard with animation state
    let copyTimeout = null;
    function copyToClipboard() {
        const textToCopy = passwordDisplay.value;
        if (!textToCopy) return;

        navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = checkIconHTML;
            copyBtn.setAttribute('aria-label', 'Password copied!');

            if (copyTimeout) clearTimeout(copyTimeout);
            
            copyTimeout = setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = copyIconHTML;
                copyBtn.setAttribute('aria-label', 'Copy password to clipboard');
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    // Event Listeners
    lengthSlider.addEventListener('input', (e) => {
        lengthVal.textContent = e.target.value;
        generatePassword();
    });

    [optUppercase, optLowercase, optNumbers, optSymbols].forEach(element => {
        element.addEventListener('change', generatePassword);
    });

    generateBtn.addEventListener('click', generatePassword);
    copyBtn.addEventListener('click', copyToClipboard);

    // Initial generate
    generatePassword();
});
