document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const progressValDay = document.getElementById('progress-val-day');
    const progressBarDay = document.getElementById('progress-bar-day');
    
    const progressValWeek = document.getElementById('progress-val-week');
    const progressBarWeek = document.getElementById('progress-bar-week');
    
    const progressValMonth = document.getElementById('progress-val-month');
    const progressBarMonth = document.getElementById('progress-bar-month');
    
    const progressValYear = document.getElementById('progress-val-year');
    const progressBarYear = document.getElementById('progress-bar-year');

    // Math metrics
    function getDayProgress(now) {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diff = now - start;
        return (diff / (24 * 60 * 60 * 1000)) * 100;
    }

    function getWeekProgress(now) {
        const dayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        const diff = now - start;
        const total = 7 * 24 * 60 * 60 * 1000;
        return (diff / total) * 100;
    }

    function getMonthProgress(now) {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const diff = now - start;
        const total = daysInMonth * 24 * 60 * 60 * 1000;
        return (diff / total) * 100;
    }

    function getYearProgress(now) {
        const start = new Date(now.getFullYear(), 0, 1);
        const isLeap = (now.getFullYear() % 4 === 0 && (now.getFullYear() % 100 !== 0 || now.getFullYear() % 400 === 0));
        const totalDays = isLeap ? 366 : 365;
        const diff = now - start;
        const total = totalDays * 24 * 60 * 60 * 1000;
        return (diff / total) * 100;
    }

    // Main updates loop
    function updateProgress() {
        const now = new Date();

        const dayPct = getDayProgress(now);
        const weekPct = getWeekProgress(now);
        const monthPct = getMonthProgress(now);
        const yearPct = getYearProgress(now);

        // Display with 3 decimal places to show ticking progress in real time
        progressValDay.textContent = `${dayPct.toFixed(3)}%`;
        progressBarDay.style.width = `${dayPct}%`;

        progressValWeek.textContent = `${weekPct.toFixed(3)}%`;
        progressBarWeek.style.width = `${weekPct}%`;

        progressValMonth.textContent = `${monthPct.toFixed(3)}%`;
        progressBarMonth.style.width = `${monthPct}%`;

        progressValYear.textContent = `${yearPct.toFixed(3)}%`;
        progressBarYear.style.width = `${yearPct}%`;
    }

    // Set loop running every 100ms for ticking visual feedback
    setInterval(updateProgress, 100);
    updateProgress();
});
