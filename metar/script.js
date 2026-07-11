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

    function parseRawMetar(raw) {
        const report = {
            raw: raw,
            rawOb: raw,
            clouds: []
        };

        const parts = raw.trim().split(/\s+/);
        if (parts.length > 0) {
            report.icaoId = parts[0];
        }

        const timeMatch = raw.match(/\b\d{2}(\d{2})(\d{2})Z\b/);
        if (timeMatch) {
            const date = new Date();
            date.setUTCHours(Number(timeMatch[1]));
            date.setUTCMinutes(Number(timeMatch[2]));
            report.obsTime = date.getTime() / 1000;
        }

        const windMatch = raw.match(/\b(\d{3}|VRB)(\d{2,3})(G\d{2,3})?KT\b/);
        if (windMatch) {
            report.wdir = windMatch[1] === 'VRB' ? 'VRB' : Number(windMatch[1]);
            report.wspd = Number(windMatch[2]);
            if (windMatch[3]) {
                report.wgst = Number(windMatch[3].substring(1));
            }
        }

        const tempMatch = raw.match(/\b(M?\d{2})\/(M?\d{2})\b/);
        if (tempMatch) {
            const parseTemp = (str) => {
                const val = Number(str.replace('M', ''));
                return str.startsWith('M') ? -val : val;
            };
            report.temp = parseTemp(tempMatch[1]);
            report.dewp = parseTemp(tempMatch[2]);
        }

        const altimMatch = raw.match(/\bA(\d{4})\b/);
        if (altimMatch) {
            report.altim = Number(altimMatch[1]) / 100;
        } else {
            const qMatch = raw.match(/\bQ(\d{4})\b/);
            if (qMatch) {
                report.altim = Number(qMatch[1]);
            }
        }

        const visMatch = raw.match(/\b(\d+)(SM)\b/) || raw.match(/\b(\d+\/\d+)(SM)\b/);
        if (visMatch) {
            report.visib = visMatch[1];
        } else if (raw.includes(" 9999 ")) {
            report.visib = "10+";
        }

        const cloudRegex = /\b(FEW|SCT|BKN|OVC|VV)(\d{3}|UNKN)\b/g;
        let match;
        while ((match = cloudRegex.exec(raw)) !== null) {
            const cover = match[1];
            const base = match[2] === 'UNKN' ? null : Number(match[2]) * 100;
            report.clouds.push({ cover, base });
        }

        let ceiling = Infinity;
        for (const cloud of report.clouds) {
            if (['BKN', 'OVC', 'VV'].includes(cloud.cover) && cloud.base !== null) {
                if (cloud.base < ceiling) {
                    ceiling = cloud.base;
                }
            }
        }

        let visNum = 10;
        if (report.visib) {
            if (report.visib.includes('/')) {
                const [num, denom] = report.visib.split('/');
                visNum = Number(num) / Number(denom);
            } else {
                visNum = Number(report.visib.replace('+', ''));
            }
        }

        if (ceiling < 500 || visNum < 1) {
            report.fltcat = 'LIFR';
        } else if (ceiling < 1000 || visNum < 3) {
            report.fltcat = 'IFR';
        } else if (ceiling <= 3000 || visNum <= 5) {
            report.fltcat = 'MVFR';
        } else {
            report.fltcat = 'VFR';
        }

        return report;
    }

    function convertNwsToReport(nwsData, queryIcao) {
        const props = nwsData.properties || {};
        const raw = props.rawMessage || "";
        const report = parseRawMetar(raw);
        
        if (props.stationId) report.icaoId = props.stationId;
        if (props.stationName) report.name = props.stationName;
        
        if (props.temperature && props.temperature.value !== null) {
            report.temp = props.temperature.value;
        }
        if (props.dewpoint && props.dewpoint.value !== null) {
            report.dewp = props.dewpoint.value;
        }
        if (props.windDirection && props.windDirection.value !== null) {
            report.wdir = props.windDirection.value;
        }
        if (props.windSpeed && props.windSpeed.value !== null) {
            report.wspd = Math.round(props.windSpeed.value / 1.852);
        }
        if (props.windGust && props.windGust.value !== null) {
            report.wgst = Math.round(props.windGust.value / 1.852);
        }
        if (props.visibility && props.visibility.value !== null) {
            report.visib = String(Math.round(props.visibility.value / 1609.34));
        }
        if (props.timestamp) {
            report.obsTime = new Date(props.timestamp).getTime() / 1000;
        }
        return report;
    }

    async function fetchMetar() {
        const icao = icaoInput.value.trim().toUpperCase();
        
        if (icao.length < 3 || icao.length > 4) {
            showError("Please enter a valid 3 or 4 character airport code (e.g. KDEN or DEN).");
            return;
        }

        const queryIcao = (icao.length === 3 && /^[A-Z]{3}$/.test(icao)) ? `K${icao}` : icao;

        errorDisplay.style.display = 'none';
        weatherResult.style.display = 'none';
        loading.style.display = 'block';

        let reportData = null;
        try {
            // Stage 1: Direct NWS API (CORS supported natively, ultra fast, US stations)
            try {
                const nwsUrl = `https://api.weather.gov/stations/${queryIcao}/observations/latest`;
                const response = await fetch(nwsUrl);
                if (response.ok) {
                    const nwsData = await response.json();
                    reportData = convertNwsToReport(nwsData, queryIcao);
                }
            } catch (nwsErr) {
                console.warn("Direct NWS fetch failed/unsupported:", nwsErr);
            }

            // Stage 2: AviationWeather.gov via CORS proxies (global backup)
            if (!reportData) {
                const url = `https://aviationweather.gov/api/data/metar?ids=${queryIcao}&format=json`;
                try {
                    const directRes = await fetch(url);
                    if (directRes.ok) {
                        const data = await directRes.json();
                        if (data && data.length > 0) {
                            reportData = data[0];
                        }
                    }
                } catch (directErr) {
                    console.warn("Direct METAR fetch failed (CORS), trying allorigins proxy:", directErr);
                    try {
                        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                        const response = await fetch(proxyUrl);
                        if (response.ok) {
                            const wrapper = await response.json();
                            const data = JSON.parse(wrapper.contents);
                            if (data && data.length > 0) {
                                reportData = data[0];
                            }
                        }
                    } catch (proxyErr) {
                        console.warn("AllOrigins fallback failed, trying corsproxy.io:", proxyErr);
                        try {
                            const secondProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                            const response = await fetch(secondProxyUrl);
                            if (response.ok) {
                                const data = await response.json();
                                if (data && data.length > 0) {
                                    reportData = data[0];
                                }
                            }
                        } catch (secProxyErr) {
                            console.warn("corsproxy.io fallback failed:", secProxyErr);
                        }
                    }
                }
            }

            // Stage 3: VATSIM METAR API (CORS supported natively, global, raw text fallback)
            if (!reportData) {
                console.warn("All proxies failed, falling back to VATSIM raw METAR...");
                try {
                    const vatsimUrl = `https://metar.vatsim.net/metar.php?id=${queryIcao}`;
                    const response = await fetch(vatsimUrl);
                    if (response.ok) {
                        const rawText = await response.text();
                        if (rawText && rawText.trim().length > 0 && !rawText.includes("No METAR")) {
                            reportData = parseRawMetar(rawText);
                            reportData.name = "VATSIM Meteorological Station";
                        }
                    }
                } catch (vatsimErr) {
                    console.error("VATSIM fallback failed:", vatsimErr);
                }
            }

            if (!reportData) {
                throw new Error(`Failed to retrieve weather data for station "${queryIcao}".`);
            }

            displayWeather(reportData);
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
