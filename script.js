document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Elements ---
    const cityInput = document.querySelector('.city-input');
    const searchBtn = document.querySelector('.search-btn');
    const weatherInfoSection = document.querySelector('.weather-info');
    const searchSection = document.querySelector('.sehir-arayin');
    const notFoundSection = document.querySelector('.Sehir-bulunamadi');
    
    const countryTxt = document.querySelector('.country-txt');
    const tempTxt = document.querySelector('.temp-txt');
    const conditionTxt = document.querySelector('.condition-txt');
    const nemValueTxt = document.querySelector('.nem-value-txt');
    const rüzgarValueTxt = document.querySelector('.rüzgar-value-txt');
    const weatherSummaryImg = document.querySelector('.weather-summary-img');
    const currentDateTxt = document.querySelector('.current-date-txt');
    const forecastItemsContainer = document.querySelector('.forecast-items-container');
    
    const getLocationBtn = document.getElementById('getLocationBtn');
    const openModalBtn = document.getElementById('openModal');
    const closeModalBtn = document.getElementById('closeModal');
    const modal = document.getElementById('modal');
    const favBtn = document.getElementById('favButton');
    const favBox = document.getElementById('favBox');
    const favoriteStarBtn = document.getElementById('favoriteStarBtn');

    // --- Configuration ---
    const apiKey = '98825aab5a96dc9db4395fd6dc93b0a8';
    const historyDropdown = document.createElement('div');
    historyDropdown.className = 'history-dropdown';
    document.querySelector('.search-wrapper').appendChild(historyDropdown);

    // --- Core Functions ---

    /**
     * Fetches weather data from OpenWeatherMap API
     */
    async function fetchWeatherData(endpoint, city) {
        const url = `https://api.openweathermap.org/data/2.5/${endpoint}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('City not found');
        return response.json();
    }

    /**
     * Maps weather ID to local asset SVG
     */
    function getWeatherIcon(id) {
        if (id <= 232) return 'thunderstorm.svg';
        if (id <= 321) return 'drizzle.svg';
        if (id <= 531) return 'rain.svg';
        if (id <= 622) return 'snow.svg';
        if (id <= 781) return 'atmosphere.svg';
        if (id === 800) return 'clear.svg';
        if (id === 801) return 'wi-day-cloudy.svg';
        return 'cloudy.svg';
    }

    function getCurrentDate() {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return new Date().toLocaleDateString('tr-TR', options);
    }

    /**
     * Main function to update UI with weather data
     */
    async function updateWeatherUI(city) {
        try {
            // Show loading state (optional: add a spinner here)
            const data = await fetchWeatherData('weather', city);
            
            const { name, main: { temp, humidity }, weather: [{ id, description }], wind: { speed } } = data;

            // Update UI elements
            countryTxt.textContent = name;
            tempTxt.textContent = `${Math.round(temp)}°C`;
            conditionTxt.textContent = description;
            weatherSummaryImg.src = `ekipmanlar/${getWeatherIcon(id)}`;
            nemValueTxt.textContent = `${humidity}%`;
            rüzgarValueTxt.textContent = `${speed} km/s`;
            currentDateTxt.textContent = getCurrentDate();

            // Handle temperature warnings
            if (temp < 6) showNotification("Hava soğuk, sıkı giyinmeyi unutma! ❄️");
            if (temp > 30) showNotification("Hava çok sıcak, bol su iç! ☀️");

            // Update Forecast
            await updateForecastUI(city);

            // Show weather section
            showSection(weatherInfoSection);
            
            // Handle favorite star state
            updateStarState(name);
            favoriteStarBtn.style.display = 'block';
            favoriteStarBtn.onclick = () => {
                toggleFavorite(name);
                updateStarState(name);
            };

            // Save to history
            saveToHistory(name);

        } catch (error) {
            console.error("Weather error:", error);
            showSection(notFoundSection);
        }
    }

    /**
     * Updates the 5-day forecast UI
     */
    async function updateForecastUI(city) {
        try {
            const data = await fetchWeatherData('forecast', city);
            forecastItemsContainer.innerHTML = '';
            
            // Filter to get roughly one forecast per day (taking 12:00:00)
            const processedDays = new Set();
            const today = new Date().toISOString().split('T')[0];

            data.list.forEach(item => {
                const date = item.dt_txt.split(' ')[0];
                const time = item.dt_txt.split(' ')[1];

                if (time === "12:00:00" && date !== today && processedDays.size < 5) {
                    processedDays.add(date);
                    
                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
                    
                    const forecastHtml = `
                        <div class="forecast-item">
                            <h5 class="forecast-item-date">${dayName}</h5>
                            <img src="ekipmanlar/${getWeatherIcon(item.weather[0].id)}" class="forecast-item-img">
                            <h5 class="forecast-item-temp">${Math.round(item.main.temp)}°C</h5> 
                        </div>`;
                    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastHtml);
                }
            });
        } catch (error) {
            console.error("Forecast error:", error);
        }
    }

    function showSection(section) {
        [weatherInfoSection, searchSection, notFoundSection].forEach(s => s.style.display = 'none');
        section.style.display = (section === weatherInfoSection) ? 'block' : 'flex';
        // Trigger reflow for animations if needed
    }

    // --- Search History (LocalStorage) ---

    function saveToHistory(city) {
        let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        history = history.filter(c => c.toLowerCase() !== city.toLowerCase());
        history.unshift(city);
        localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 5)));
        renderHistory();
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        historyDropdown.innerHTML = '';
        if (history.length === 0) {
            historyDropdown.style.display = 'none';
            return;
        }

        history.forEach(city => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.textContent = city;
            item.onclick = () => {
                cityInput.value = city;
                updateWeatherUI(city);
                historyDropdown.style.display = 'none';
            };
            historyDropdown.appendChild(item);
        });
    }

    // --- Favorites (LocalStorage) ---

    function toggleFavorite(city) {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const index = favorites.indexOf(city);
        if (index > -1) {
            favorites.splice(index, 1);
            showNotification(`${city} favorilerden çıkarıldı.`);
        } else {
            favorites.push(city);
            showNotification(`${city} favorilere eklendi! ❤️`);
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }

    function updateStarState(city) {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favoriteStarBtn.style.color = favorites.includes(city) ? '#ffcf5f' : 'white';
    }

    function renderFavorites() {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favBox.innerHTML = '<div class="fav-header">Favori Şehirler</div>';
        
        if (favorites.length === 0) {
            favBox.innerHTML += '<div style="opacity: 0.5; font-style: italic; padding: 10px 0;">Favori listeniz boş.</div>';
            return;
        }

        favorites.forEach(city => {
            const item = document.createElement('div');
            item.className = "favorite-item";
            
            const citySpan = document.createElement('span');
            citySpan.className = "favorite-city";
            citySpan.textContent = city;
            citySpan.onclick = () => {
                updateWeatherUI(city);
                favBox.style.display = 'none';
            };
            
            const deleteBtn = document.createElement('span');
            deleteBtn.className = "delete-button";
            deleteBtn.innerHTML = "🗑";
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                toggleFavorite(city);
            };
            
            item.appendChild(citySpan);
            item.appendChild(deleteBtn);
            favBox.appendChild(item);
        });
    }

    // --- UI Helpers ---

    function showNotification(message) {
        const existingNotif = document.querySelector('.custom-notification');
        if (existingNotif) existingNotif.remove();

        const notif = document.createElement('div');
        notif.className = 'custom-notification';
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }

    function generateQRCode(url) {
        const qrDiv = document.getElementById("qrcode");
        qrDiv.innerHTML = "";
        new QRCode(qrDiv, {
            text: url,
            width: 180,
            height: 180,
            colorDark: "#1a1a2e",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    // --- Event Listeners ---

    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            updateWeatherUI(city);
            cityInput.value = '';
            historyDropdown.style.display = 'none';
        }
    });

    cityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                updateWeatherUI(city);
                cityInput.value = '';
                historyDropdown.style.display = 'none';
            }
        }
    });

    cityInput.addEventListener('focus', () => {
        renderHistory();
        const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        if (history.length > 0) historyDropdown.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
        if (!cityInput.contains(e.target) && !historyDropdown.contains(e.target)) {
            historyDropdown.style.display = 'none';
        }
        if (!favBtn.contains(e.target) && !favBox.contains(e.target)) {
            favBox.style.display = 'none';
        }
    });

    getLocationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    const city = data.address.city || data.address.town || data.address.village;
                    if (city) updateWeatherUI(city);
                    else showNotification("Şehir bilgisi alınamadı.");
                } catch (error) {
                    showNotification("Konum alınırken hata oluştu.");
                }
            }, () => {
                showNotification("Konum izni verilmedi.");
            });
        } else {
            showNotification("Tarayıcınız konumu desteklemiyor.");
        }
    });

    openModalBtn.addEventListener('click', () => {
        modal.classList.add('open');
        generateQRCode(window.location.href);
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('open');
    });

    favBtn.addEventListener('click', () => {
        const isVisible = favBox.style.display === 'block';
        favBox.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) renderFavorites();
    });

    // Initial render
    renderHistory();
});