document.addEventListener('DOMContentLoaded', () => {
    const qrInput = document.getElementById('qr-input');
    const generateBtn = document.getElementById('generate-btn');
    const errorDisplay = document.getElementById('error-display');
    const qrResult = document.getElementById('qr-result');
    const qrImage = document.getElementById('qr-image');
    const downloadBtn = document.getElementById('download-btn');
    const copyBtn = document.getElementById('copy-btn');

    generateBtn.addEventListener('click', generateQR);

    qrInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            generateQR();
        }
    });

    function generateQR() {
        const text = qrInput.value.trim();
        
        if (!text) {
            showError("Please enter some text or a URL first.");
            return;
        }

        // Hide old errors
        errorDisplay.style.display = 'none';

        const size = 300;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
        
        // If already showing, add fading class for transition
        if (qrResult.style.display === 'flex') {
            qrImage.classList.add('fading');
        }

        // Show result on load
        qrImage.onload = () => {
            qrResult.style.display = 'flex';
            qrImage.classList.remove('fading');
        };

        qrImage.onerror = () => {
            showError("Failed to generate QR Code. Please check your internet connection.");
            qrImage.classList.remove('fading');
        };

        qrImage.src = qrUrl;
    }

    // Download QR Code
    downloadBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(qrImage.src);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = 'qrcode.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(blobUrl);
            window.showToast("QR Code downloaded!");
        } catch (err) {
            console.error("Download error:", err);
            window.showToast("Failed to download image.");
        }
    });

    // Copy QR Code Image URL
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(qrImage.src);
            window.showToast("QR Code URL copied to clipboard!");
        } catch (err) {
            console.error("Clipboard error:", err);
            window.showToast("Failed to copy URL.");
        }
    });

    function showError(msg) {
        qrResult.style.display = 'none';
        errorDisplay.textContent = msg;
        errorDisplay.style.display = 'block';
    }

    // Generate the default QR code immediately
    generateQR();
});
