document.addEventListener("DOMContentLoaded", () => {

const cityInput = document.querySelector('.city-input')
const searchBtn = document.querySelector('.search-btn')
const weatherInfoSection = document.querySelector('.weather-info')
const sehirArayinSection = document.querySelector('.sehir-arayin')
const sehirBulunamadiSection = document.querySelector('.Sehir-bulunamadi');
const countryTxt = document.querySelector('.contry-txt')
const tempTxt = document.querySelector('.temp-txt')
const conditionTxt = document.querySelector('.condition-txt')
const nemValueTxt = document.querySelector('.nem-value-txt')
const rüzgarValueTxt = document.querySelector('.rüzgar-value-txt')
const weatherSummaryImg = document.querySelector ('.weather-summary-img')
const currentDaeteTxt = document.querySelector('.current-date-txt')
const forecastItemsContainer = document.querySelector('.forecast-items-container');
const getLocationBtn = document.getElementById('getLocationBtn');
const openBtn = document.getElementById('openModal');
const closeBtn = document.getElementById('closeModal');
const modal = document.getElementById('modal');
const apiKey='98825aab5a96dc9db4395fd6dc93b0a8'


    //  Elementler
    const favBtn = document.createElement('div');
    favBtn.id = "favButton";
    favBtn.innerHTML = "❤";
    document.querySelector('.main-container').appendChild(favBtn);

    const favBox = document.createElement('div');
    favBox.id = "favBox";
    document.querySelector('.main-container').appendChild(favBox);

    const searchStar = document.createElement('span');
    searchStar.className = 'search-star';
    searchStar.innerHTML = '★';
    cityInput.parentNode.insertBefore(searchStar, cityInput.nextSibling);

    const historyDropdown = document.createElement('div');
    historyDropdown.className = 'history-dropdown';
    cityInput.parentNode.insertBefore(historyDropdown, cityInput.nextSibling);


       // Hava Durumu işlemleri

    async   function getFetchData(endPoint, city) {
   const apiurl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric&lang=tr`;
   const response = await fetch(apiUrl)
    if (!response.ok) throw new Error('şehir bulunamadı');
       return response.json()
}

function getWeatherIcon(id) {
   if (id <=232) return 'thunderstorm.svg'
   if (id <=321) return 'drizzle.svg'
   if (id <=531) return 'rain.svg'
   if (id <=622) return 'snow.svg'
   if (id <=781) return 'atmosphere.svg'
   if (id <=800) return 'clear.svg'
   else return 'clouds.svg'
}
 
function getCurrentDate() {
   const currentDate = new  Date()
   const options = {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    }

    return currentDate.toLocaleDateString('tr-TR', options)
}

 async function getFetchData(endPoint, city) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric&lang=tr`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("şehir bulunamadı");
        return response.json();
    }

    async function getWeatherData(city) {
        try {
            const weatherData = await getFetchData('weather', city);
            if (weatherData.cod != 200) {
                sehirArayinSection.style.display = 'none';
                showDisplaySection(sehirBulunamadiSection);
                return;
            }

            const {
                name: country,
                main: { temp, humidity },
                weather: [{ id, description }],
                wind: { speed }
            } = weatherData;

            countryTxt.textContent = country;
            tempTxt.textContent = Math.round(temp) + '°C';
            conditionTxt.textContent = description;
            weatherSummaryImg.src = `./bilesenler/${getWeatherIcon(id)}`;
            nemValueTxt.textContent = humidity + '%';
            rüzgarValueTxt.textContent = speed + ' M/s';
            currentDateTxt.textContent = getCurrentDate();

            if (temp < 6) alert("Hava 6 derecenin altında, sıkı giyin!");
            if (temp > 30) alert("Hava 30 derecenin üstünde, bol su içmeyi unutma!");

            await upDateForecastsInfo(city);
            showDisplaySection(weatherInfoSection);
            searchStar.style.display = 'inline-block';
            
            searchStar.onclick = () => {
                const wasFavorite = isFavorite(country);
                toggleFavorite(country);
                if (!wasFavorite) {
                    showNotification(`${country} favorilere eklendi`);
                }
            };

        } catch (error) {
            console.error("Hava durumu verisi alınamadı:", error);
            showDisplaySection(sehirBulunamadiSection);
        }
    }

async function upDateForecastsInfo(city) {
      const forecastsData = await getFetchData('forecasts', city)

      const timeTaken  = '12:00:00'
      const todayDate = new Date ().toISOString().split('T')[0]

      forecastsData.list.forEach(forecastWeather => {
       if (forecastWeather.dt_txt.includes(timeTaken) && !forecastWeather.dt_txt.includes(todayDate)) {
                updateWeatherItems(forecastWeather);
         }
      }) 
}


     function shoDisplaySection (section) {
    [weatherInfoSection, sehirArayinSection, sehirBulunamadiSection]
    .forEach(sec => sec.style.display = 'none');
      section.style.display = 'flex'
}

      function showNotification(message) {
        const notif = document.createElement('div');
        notif.textContent = message;
        notif.className = "custom-notification";
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }
    

    function updateWeatherItems(weatherData) {
        const { dt_txt: date, weather: [{ id }], main: { temp } } = weatherData;
        const dateTaken = new Date(date);
        const dateOption = { day: '2-digit', month: 'short' };
        const dateResult = dateTaken.toLocaleDateString('tr-TR', dateOption);

        const forecastItem = `
            <div class="forecast-item">
                <h5 class="forecast-item-date">${dateResult}</h5>
                <img src="bilesenler/${getWeatherIcon(id)}" class="forecast-item-img">
                <h5 class="forecast-item-temp">${Math.round(temp)}°C</h5> 
            </div>`;
        forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem);
    }

     // ARAMA GEÇMİŞİ İŞLEMLERİ
    function saveToHistory(city) {
        return fetch('http://localhost:3000/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city })
        })
            .then(res => res.json())
            .then(data => {
                console.log("Veri başarıyla kaydedildi:", data);
                updateSuggestions();
            })
            .catch(err => console.error("Geçmişe kaydetme hatası:", err));
    }

    function updateSuggestions() {
        fetch('http://localhost:3000/api/history')
            .then(res => res.json())
            .then(data => {
                historyDropdown.innerHTML = '';
                const uniqueCities = [...new Set(data)];
                uniqueCities.slice(0, 5).forEach(city => {
                    const item = document.createElement('div');
                    item.className = 'history-item';
                    item.textContent = city;
                    item.addEventListener('click', () => {
                        cityInput.value = city;
                        getWeatherData(city);
                        historyDropdown.style.display = 'none';
                    });
                    historyDropdown.appendChild(item);
                });
            })
            .catch(err => console.error("Geçmiş getirme hatası:", err));
    }
        // KONUM İŞLEMLERİ
    function errorCallback(error) {
        console.error("Konum alma hatası:", error);
        alert("Konum bilgisi alınırken bir hata oluştu.");
    }

    function successCallback(position) {
        const { latitude, longitude } = position.coords;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(response => response.json())
            .then(data => {
                const city = data.address.city || data.address.town || data.address.village;
                if (city) getWeatherData(city);
                else alert("Konumdan şehir bilgisi alınamadı.");
            })
            .catch(error => {
                console.error("Konumdan şehir alma hatası:", error);
                alert("Konumdan şehir alınırken bir hata oluştu.");
            });
    }

    
    // MODAL İŞLEMLERİ
    function qrKodGoster(veri) {
        const qrDiv = document.getElementById("qrcode");
        qrDiv.innerHTML = "";
        new QRCode(qrDiv, {
            text: veri,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
    favBtn.addEventListener('click', () => {
        favBox.style.display = favBox.style.display === 'none' ? 'block' : 'none';
        updateFavoritesBox();
    });

    cityInput.addEventListener('click', () => {
        updateSuggestions();
        historyDropdown.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
        if (!cityInput.contains(e.target) && !historyDropdown.contains(e.target)) {
            historyDropdown.style.display = 'none';
        }
    });

    searchBtn.addEventListener('click', async () => {
        const city = cityInput.value.trim();
        if (city) {
            try {
                await getWeatherData(city);
                await saveToHistory(city);
                cityInput.value = '';
                cityInput.blur();
                historyDropdown.style.display = 'none';
            } catch (error) {
                console.error("Hata:", error);
                showDisplaySection(sehirBulunamadiSection);
            }
        }
    });

    cityInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter' && cityInput.value.trim() !== '') {
            const city = cityInput.value.trim();
            try {
                await getWeatherData(city);
                await saveToHistory(city);
                cityInput.value = '';
                historyDropdown.style.display = 'none';
            } catch (error) {
                console.error("Hata:", error);
                showDisplaySection(sehirBulunamadiSection);
            }
        }
    });

    getLocationBtn.addEventListener("click", function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
        } else {
            alert("Tarayıcınız konum almayı desteklemiyor.");
        }
    });

    openBtn.addEventListener("click", () => {
        modal.classList.add("open");
        qrKodGoster("https://rumeysa034.github.io/Rumeysa034/");
    });

    closeBtn.addEventListener("click", () => {
        modal.classList.remove("open");
    });

    updateSuggestions();
});

  // FAVORİ İŞLEMLERİ
    function toggleFavorite(city) {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        if (favorites.includes(city)) {
            favorites = favorites.filter(c => c !== city);
        } else {
            favorites.push(city);
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoritesBox();
    }

    function isFavorite(city) {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        return favorites.includes(city);
    }

    function updateFavoritesBox() {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favBox.innerHTML = '<h4 style="margin:0 0 10px 0;padding-bottom:5px;border-bottom:1px solid rgba(255,255,255,0.2)">Favori Şehirler</h4>';
        
        if (favorites.length === 0) {
            favBox.innerHTML += '<div style="color:rgba(255,255,255,0.6);font-style:italic;padding:5px 0">Henüz favori şehir eklenmedi</div>';
            return;
        }

        favorites.forEach(city => {
            const item = document.createElement('div');
            item.className = "favorite-item";
            
            const citySpan = document.createElement('span');
            citySpan.className = "favorite-city";
            citySpan.textContent = city;
            citySpan.onclick = () => {
                getWeatherData(city);
                favBox.style.display = 'none';
            };
            
            const deleteBtn = document.createElement('span');
            deleteBtn.className = "delete-button";
            deleteBtn.innerHTML = "🗑";
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                toggleFavorite(city);
                showNotification(`${city} favorilerden çıkarıldı`);
                updateFavoritesBox();
            };
            
            item.appendChild(citySpan);
            item.appendChild(deleteBtn);
            favBox.appendChild(item);
        });
    }