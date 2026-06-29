document.addEventListener('DOMContentLoaded', () => {
    const inputType = document.getElementById('input-type');
    const inputCount = document.getElementById('input-count');
    const optStartLorem = document.getElementById('opt-start-lorem');

    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const outputText = document.getElementById('output-text');
    const toast = document.getElementById('toast');

    // -------------------------------------------------------------
    // Custom Dropdown Selector Logic
    // -------------------------------------------------------------
    const customSelect = document.getElementById('lorem-type-select');
    const selectTrigger = customSelect.querySelector('.select-trigger');
    const selectedTypeLabel = document.getElementById('selected-type-label');
    const options = customSelect.querySelectorAll('.option');

    selectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        customSelect.classList.toggle('open');
    });

    options.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = option.getAttribute('data-value');
            inputType.value = val;
            selectedTypeLabel.textContent = option.textContent;

            options.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            customSelect.classList.remove('open');
            buildLoremText();
        });
    });

    document.addEventListener('click', () => {
        customSelect.classList.remove('open');
    });

    // -------------------------------------------------------------
    // Word Database for Generator
    // -------------------------------------------------------------
    const wordsList = [
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
        'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
        'magna', 'aliqua', 'ut', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
        'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea',
        'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit',
        'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla',
        'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident',
        'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id',
        'est', 'laborum', 'et', 'harum', 'quidem', 'rerum', 'facilis', 'est', 'et',
        'expedita', 'distinctio', 'nam', 'libero', 'tempore', 'cum', 'soluta', 'nobis',
        'est', 'eligendi', 'optio', 'cumque', 'nihil', 'impedit', 'quo', 'minus',
        'id', 'quod', 'maxime', 'placeat', 'facere', 'possimus', 'omnis', 'voluptas',
        'assumenda', 'est', 'omnis', 'dolor', 'repellendus', 'temporibus', 'autem',
        'quibusdam', 'et', 'aut', 'officiis', 'debitis', 'aut', 'rerum', 'necessitatibus',
        'saepe', 'eveniet', 'ut', 'et', 'voluptates', 'repudiandae', 'sint', 'et',
        'molestiae', 'non', 'recusandae', 'itaque', 'earum', 'rerum', 'hic', 'tenetur',
        'a', 'sapiente', 'delectus', 'ut', 'aut', 'reiciendis', 'voluptatibus', 'maiores',
        'alias', 'consequatur', 'aut', 'perferendis', 'doloribus', 'asperiores', 'repellat'
    ];

    // -------------------------------------------------------------
    // Helper Generators
    // -------------------------------------------------------------

    function getRandomWord() {
        return wordsList[Math.floor(Math.random() * wordsList.length)];
    }

    function generateWordsString(count) {
        const words = [];
        for (let i = 0; i < count; i++) {
            words.push(getRandomWord());
        }
        return words.join(' ');
    }

    function generateSentence(startWithLorem = false) {
        const len = Math.floor(Math.random() * 9) + 8;
        let words = [];

        if (startWithLorem) {
            words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet'];
            while (words.length < len) {
                words.push(getRandomWord());
            }
        } else {
            for (let i = 0; i < len; i++) {
                words.push(getRandomWord());
            }
        }

        let sentence = words.join(' ');
        sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
        return sentence;
    }

    function generateParagraph(startWithLorem = false) {
        const len = Math.floor(Math.random() * 4) + 4;
        const sentences = [];

        for (let i = 0; i < len; i++) {
            sentences.push(generateSentence(i === 0 && startWithLorem));
        }

        return sentences.join(' ');
    }

    // -------------------------------------------------------------
    // Core Builder Orchestrator
    // -------------------------------------------------------------
    function buildLoremText() {
        const type = inputType.value;
        let count = parseInt(inputCount.value, 10);
        
        if (isNaN(count) || count < 1) {
            count = 1;
        } else if (count > 100) {
            count = 100;
        }
        
        const startLorem = optStartLorem.checked;
        let output = '';

        if (type === 'words') {
            let str = '';
            if (startLorem) {
                str = 'Lorem ipsum dolor sit amet ' + generateWordsString(Math.max(0, count - 5));
            } else {
                str = generateWordsString(count);
            }
            str = str.trim().charAt(0).toUpperCase() + str.slice(1);
            output = str;

        } else if (type === 'sentences') {
            const list = [];
            for (let i = 0; i < count; i++) {
                list.push(generateSentence(i === 0 && startLorem));
            }
            output = list.join(' ');

        } else if (type === 'paragraphs') {
            const list = [];
            for (let i = 0; i < count; i++) {
                list.push(generateParagraph(i === 0 && startLorem));
            }
            output = list.join('\n\n');

        } else if (type === 'lists') {
            const list = [];
            for (let i = 0; i < count; i++) {
                let itemText = generateWordsString(Math.floor(Math.random() * 4) + 5);
                itemText = itemText.charAt(0).toUpperCase() + itemText.slice(1);
                list.push(`- ${itemText}`);
            }
            output = list.join('\n');
        }

        outputText.value = output;
    }

    // -------------------------------------------------------------
    // Clipboard Toast Popup
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

    // Quantity number input updates
    inputCount.addEventListener('input', () => {
        let val = parseInt(inputCount.value, 10);
        if (!isNaN(val) && val >= 1 && val <= 100) {
            buildLoremText();
        }
    });

    inputCount.addEventListener('blur', () => {
        let val = parseInt(inputCount.value, 10);
        if (isNaN(val) || val < 1) {
            inputCount.value = 1;
        } else if (val > 100) {
            inputCount.value = 100;
        }
        buildLoremText();
    });

    // Option changes
    optStartLorem.addEventListener('change', buildLoremText);

    // Main generate button
    generateBtn.addEventListener('click', () => {
        buildLoremText();
        showToast("Text generated!");
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', () => {
        const textVal = outputText.value;
        if (!textVal) {
            showToast("Nothing to copy!");
            return;
        }

        navigator.clipboard.writeText(textVal).then(() => {
            showToast("Copied to clipboard!");
        }).catch(() => {
            showToast("Copy failed.");
        });
    });

    // Build initial text block on load
    buildLoremText();
});
