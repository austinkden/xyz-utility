document.addEventListener('DOMContentLoaded', () => {
    const icaoInput = document.getElementById('icao-input');
    const fetchBtn = document.getElementById('fetch-btn');
    const loading = document.getElementById('loading');
    const errorDisplay = document.getElementById('error-display');
    const weatherResult = document.getElementById('weather-result');

    // UI Result Elements
    const resIcao = document.getElementById('res-icao');
    const resName = document.getElementById('res-name');
    const resCategory = document.getElementById('res-category');
    const resTime = document.getElementById('res-time');
    const resWind = document.getElementById('res-wind');
    const resVisibility = document.getElementById('res-visibility');
    const resTemp = document.getElementById('res-temp');
    const resClouds = document.getElementById('res-clouds');
    const resAltimeter = document.getElementById('res-altimeter');
    const resRaw = document.getElementById('res-raw');

    // Fetch on click
    fetchBtn.addEventListener('click', fetchMetar);

    // Fetch on enter key
    icaoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            fetchMetar();
        }
    });

    async function fetchMetar() {
        const icao = icaoInput.value.trim().toUpperCase();
        
        if (icao.length < 3 || icao.length > 4) {
            showError("Please enter a valid 3 or 4 character airport code (e.g. KDEN or DEN).");
            return;
        }

        // Standardize 3-letter US codes to 4-letter ICAO (e.g. DEN -> KDEN)
        const queryIcao = (icao.length === 3 && /^[A-Z]{3}$/.test(icao)) ? `K${icao}` : icao;

        // Reset UI
        errorDisplay.style.display = 'none';
        weatherResult.style.display = 'none';
        loading.style.display = 'block';

        let response;
        try {
            const url = `https://aviationweather.gov/api/data/metar?ids=${queryIcao}&format=json`;
            
            try {
                response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Status ${response.status}`);
                }
            } catch (directErr) {
                console.warn("Direct METAR fetch failed (likely CORS), trying allorigins proxy fallback:", directErr);
                try {
                    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                    response = await fetch(proxyUrl);
                    if (!response.ok) {
                        throw new Error(`AllOrigins status ${response.status}`);
                    }
                } catch (proxyErr) {
                    console.warn("AllOrigins fallback failed, trying corsproxy.io:", proxyErr);
                    const secondProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                    response = await fetch(secondProxyUrl);
                    if (!response.ok) {
                        throw new Error(`CORS proxy status ${response.status}`);
                    }
                }
            }

            const data = await response.json();
            
            if (!data || data.length === 0) {
                throw new Error(`No weather observations found for station "${queryIcao}".`);
            }

            displayWeather(data[0]);
        } catch (err) {
            console.error('METAR Fetch Error:', err);
            showError(err.message || "Failed to retrieve weather data. Please try again.");
        } finally {
            loading.style.display = 'none';
        }
    }

    function displayWeather(report) {
        // 1. Basic Info
        resIcao.textContent = report.icaoId || report.stationId || icaoInput.value.trim().toUpperCase();
        resName.textContent = report.name || "Weather Observation Station";

        // 2. Flight Category Badge
        const fltcat = (report.fltcat || "VFR").toUpperCase();
        resCategory.textContent = fltcat;
        
        // Remove old category classes and add new one
        resCategory.className = 'flight-category-badge';
        if (fltcat === 'VFR') resCategory.classList.add('cat-vfr');
        else if (fltcat === 'MVFR') resCategory.classList.add('cat-mvfr');
        else if (fltcat === 'IFR') resCategory.classList.add('cat-ifr');
        else if (fltcat === 'LIFR') resCategory.classList.add('cat-lifr');
        else resCategory.classList.add('cat-vfr'); // default

        // 3. Observed Time (fix epoch seconds issue)
        if (report.obsTime) {
            const obsVal = Number(report.obsTime);
            const date = isNaN(obsVal) ? new Date(report.obsTime) : new Date(obsVal * 1000);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = months[date.getMonth()];
            const day = date.getDate();
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            resTime.textContent = `${month} ${day} ${year} at ${hours}:${minutes}`;
        } else {
            resTime.textContent = "Unknown";
        }

        // 4. Wind
        const wdir = report.wdir;
        const wspd = report.wspd;
        const wgst = report.wgst;
        if (wspd !== undefined) {
            let windStr = '';
            if (wdir === 'VRB' || wdir === 0 || !wdir) {
                windStr = `Variable at ${wspd} kt`;
            } else {
                windStr = `${wdir}° at ${wspd} kt`;
            }
            if (wgst) {
                windStr += ` (Gusting to ${wgst} kt)`;
            }
            resWind.textContent = windStr;
        } else {
            resWind.textContent = "Calm / No Wind Data";
        }

        // 5. Visibility
        const vis = report.visib;
        if (vis !== undefined) {
            resVisibility.textContent = `${vis} miles`;
        } else {
            resVisibility.textContent = "No Visibility Data";
        }

        // 6. Temp / Dewpoint (no dew point, tight parentheses)
        const temp = report.temp;
        if (temp !== undefined) {
            resTemp.textContent = `${temp}°C (${Math.round(temp * 1.8 + 32)}°F)`;
        } else {
            resTemp.textContent = "-";
        }

        // 7. Altimeter Setting (conversion from hPa to inHg if needed)
        const altim = report.altim;
        if (altim !== undefined) {
            const inhg = altim > 50 ? (altim * 0.02953).toFixed(2) : altim.toFixed(2);
            resAltimeter.textContent = `${inhg} inHg`;
        } else {
            resAltimeter.textContent = "-";
        }

        // 8. Clouds / Ceilings (vertical layout)
        const clouds = report.clouds || [];
        if (clouds.length > 0) {
            const cloudLines = clouds.map(c => {
                const cover = c.cover || "UNKNOWN";
                const base = (c.base !== undefined && c.base !== null) ? `${Number(c.base).toLocaleString()} ft` : '';
                return base ? `${cover} at ${base}` : `${cover}`;
            });
            resClouds.innerHTML = cloudLines.map(line => `<div class="cloud-layer" style="margin-bottom: 2px;">${line}</div>`).join('');
        } else {
            resClouds.textContent = "Clear Skies (CLR)";
        }

        // 9. Raw METAR Text
        resRaw.textContent = report.rawOb || report.rawMETAR || report.raw || "No raw report text available.";

        // Reveal result
        weatherResult.style.display = 'flex';
    }

    function showError(msg) {
        loading.style.display = 'none';
        weatherResult.style.display = 'none';
        errorDisplay.textContent = msg;
        errorDisplay.style.display = 'block';
    }
});
