// Fetch helper with AbortController timeout
async function fetchWithTimeout(url, options = {}, timeout = 4000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

// Global state
let clockOffset = 0;
let is24Hour = localStorage.getItem('time-format-24h') !== 'false';

// Time synchronization logic using a tiered approach.
// 1. Same-Origin Cloudflare Trace (extremely accurate, millisecond precision, zero third-party dependencies)
// 2. Public NTP-over-HTTP APIs (CORS-enabled fallbacks)
async function syncTime() {
    // 1. First, try the same-origin Cloudflare trace endpoint.
    // In production, this resolves to the Cloudflare edge server serving this page, which is highly accurate.
    try {
        const t0 = performance.now();
        const date0 = Date.now();
        const response = await fetchWithTimeout('/cdn-cgi/trace', {}, 2500);
        if (response.ok) {
            const text = await response.text();
            const t3 = performance.now();
            const rtt = t3 - t0;
            const match = text.match(/ts=(\d+\.?\d*)/);
            if (match) {
                const serverTime = parseFloat(match[1]) * 1000;
                const clientTimeMid = date0 + (rtt / 2);
                clockOffset = serverTime - clientTimeMid;
                console.log(`Synced via Same-Origin Cloudflare Trace! Offset: ${clockOffset.toFixed(2)}ms, RTT: ${rtt.toFixed(2)}ms`);
                return; // Early return since Cloudflare Trace is extremely accurate and authoritative
            }
        }
    } catch (error) {
        console.warn('Same-Origin Cloudflare Trace sync unavailable (expected in local dev):', error.message);
    }

    // 2. Fall back to querying public CORS-enabled APIs.
    // Note: We avoid 'timeapi.io' as its public clock is consistently ~35 seconds slow.
    const fallbackServers = [
        {
            name: 'Siyukatu API',
            url: 'https://public-api.siyukatu.com/time.json',
            parse: (data) => data.time
        },
        {
            name: 'WorldTimeAPI',
            url: 'https://worldtimeapi.org/api/timezone/Etc/UTC',
            parse: (data) => new Date(data.utc_datetime).getTime()
        }
    ];

    const syncPromises = fallbackServers.map(async (server) => {
        try {
            const t0 = performance.now();
            const date0 = Date.now();
            const response = await fetchWithTimeout(server.url, {}, 3000);
            if (!response.ok) throw new Error(`HTTP status ${response.status}`);

            const data = await response.json();
            const t3 = performance.now();

            const rtt = t3 - t0;
            const serverTime = server.parse(data);
            if (isNaN(serverTime)) throw new Error('Invalid time parsed');

            const clientTimeMid = date0 + (rtt / 2);
            const offset = serverTime - clientTimeMid;
            return { name: server.name, offset, rtt };
        } catch (error) {
            console.warn(`Fallback time server sync failed for ${server.name}:`, error.message);
            return null;
        }
    });

    const results = (await Promise.all(syncPromises)).filter(res => res !== null);

    if (results.length > 0) {
        const sumOffset = results.reduce((acc, curr) => acc + curr.offset, 0);
        const avgOffset = sumOffset / results.length;
        const avgRtt = results.reduce((acc, curr) => acc + curr.rtt, 0) / results.length;

        console.log(`Synced via fallback! Avg offset: ${avgOffset.toFixed(2)}ms. Avg RTT: ${avgRtt.toFixed(2)}ms. Active servers: ${results.length}/${fallbackServers.length}`);
        clockOffset = avgOffset;
    } else {
        console.warn('All time servers failed to sync. Falling back to local clock (Offset: 0ms).');
        clockOffset = 0;
    }
}

// Clock updates
const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');

function pad(n) {
    return String(n).padStart(2, '0');
}

function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    if (is24Hour) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } else {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
    }
}

function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function updateClock() {
    const now = new Date(Date.now() + clockOffset);
    timeEl.textContent = formatTime(now);
    dateEl.textContent = formatDate(now);
    requestAnimationFrame(updateClock);
}

// Toggle format
timeEl.addEventListener('click', () => {
    is24Hour = !is24Hour;
    localStorage.setItem('time-format-24h', is24Hour);
});

timeEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        is24Hour = !is24Hour;
        localStorage.setItem('time-format-24h', is24Hour);
    }
});



// Run
(async () => {
    // Initial sync
    await syncTime();
    // Start animation loop
    updateClock();
    // Background sync every 30 seconds to keep drift under control
    setInterval(syncTime, 30000);
})();
