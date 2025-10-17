const WMO = {
    0: "快晴", 1: "晴れ", 2: "晴れ時々くもり", 3: "くもり",
    45: "霧", 48: "霧（着氷）",
    51: "霧雨弱", 53: "霧雨", 55: "霧雨強",
    56: "着氷霧雨弱", 57: "着氷霧雨強",
    61: "小雨", 63: "雨", 65: "大雨",
    66: "着氷雨弱", 67: "着氷雨強",
    71: "小雪", 73: "雪", 75: "大雪",
    77: "雪粒",
    80: "にわか雨弱", 81: "にわか雨", 82: "にわか雨強",
    85: "にわか雪", 86: "にわか大雪",
    95: "雷雨", 96: "雷雨（雹）", 99: "激しい雷雨（雹）"
  };

  // WMOコードを5分類（晴れ/曇り/雨/雷/雪）に変換
  function getCategoryFromWmo(code) {
    if ([0, 1, 2].includes(code)) return "晴れ";
    if ([3, 45, 48].includes(code)) return "曇り";
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "雨";
    if ([95, 96, 99].includes(code)) return "雷";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "雪";
    return undefined;
  }

  // 分類に応じてアイコン画像のパスを返す
  function getIconSrcByCategory(category) {
    switch (category) {
      case "晴れ":
        return "static/img/tenki_mark01_hare.png";
      case "曇り":
        return "static/img/tenki_mark05_kumori.png";
      case "雨":
        return "static/img/tenki_mark02_ame.png";
      case "雷":
        return "static/img/tenki_mark07_kaminari.png";
      case "雪":
        return "static/img/tenki_mark08_yuki.png";
      default:
        return undefined;
    }
  }

  function formatDate(d) {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  async function fetchHolidayMap(year) {
    const url = `https://holidays-jp.github.io/api/v1/${year}/date.json`;
    const res = await fetch(url);
    if (!res.ok) return {};
    return await res.json(); // { "2025-01-01": "元日", ... }
  }

  async function fetchForecast(lat, lon) {
    const base = "https://api.open-meteo.com/v1/forecast";
    const params = new URLSearchParams({
      latitude: lat, longitude: lon,
      daily: "weathercode,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean",
      timezone: "auto",
      forecast_days: "7"
    });
    const res = await fetch(`${base}?${params}`);
    if (!res.ok) throw new Error("天気取得に失敗しました");
    return await res.json();
  }

  // 今日の天気に応じて背景クラスを変更
  function updateBackgroundTheme(weatherCode) {
    document.body.className = '';
    if ([0, 1, 2].includes(weatherCode)) {
      document.body.classList.add('sunny');
    } else if ([61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode)) {
      document.body.classList.add('rainy');
    } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
      document.body.classList.add('snowy');
    } else {
      document.body.classList.add('cloudy');
    }
  }

  function draw(data, holidayMap) {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    const todayStr = formatDate(new Date());
    const d = data.daily;
    for (let i = 0; i < d.time.length; i++) {
      const date = d.time[i];
      const wcode = d.weathercode[i];
      const tmax = Math.round(d.temperature_2m_max[i]);
      const tmin = Math.round(d.temperature_2m_min[i]);
      const rh   = Math.round(d.relative_humidity_2m_mean[i]);
      const isToday = date === todayStr;
      const holidayName = holidayMap[date];

      const card = document.createElement("div");
      card.className = "card" + (isToday ? " today" : "");
      card.style.setProperty('--index', i);

      const title = document.createElement("div");
      title.innerHTML = `${date}${holidayName ? ` <span class="holiday">（${holidayName}）</span>` : ""}`;
      card.appendChild(title);

      // 天気アイコン（分類→画像）
      const category = getCategoryFromWmo(wcode);
      const iconSrc = category ? getIconSrcByCategory(category) : undefined;
      if (iconSrc) {
        const icon = document.createElement("img");
        icon.className = "wx-icon";
        icon.alt = category;
        icon.src = iconSrc;
        card.appendChild(icon);
      }

      const weather = document.createElement("div");
      weather.className = isToday ? "weather-info" : "";
      weather.textContent = `${WMO[wcode] ?? "不明"} / 最高 ${tmax}℃ 最低 ${tmin}℃ / 湿度 ${rh}%`;
      card.appendChild(weather);

      if (isToday) {
        const todayLabel = document.createElement("div");
        todayLabel.className = "today-label";
        todayLabel.textContent = "📅 今日";
        todayLabel.style.cssText = "font-weight: bold; color: #ff4444; margin-bottom: 4px;";
        card.insertBefore(todayLabel, weather);

        const fortune = document.createElement("div");
        fortune.className = "muted";
        fortune.textContent = `今日の運勢: ${pickFortune()}`;
        card.appendChild(fortune);
      }

      grid.appendChild(card);
    }
    // 今日の天気コードで背景テーマを更新
    if (d.time[0] === todayStr) {
      updateBackgroundTheme(d.weathercode[0]);
    }
  }

  function pickFortune() {
    const list = ["大吉", "中吉", "小吉", "吉", "末吉", "凶"];
    return list[Math.floor(Math.random() * list.length)];
  }

  async function load() {
    const [lat, lon] = document.getElementById("city").value.split(",").map(Number);
    const year = new Date().getFullYear();
    const [forecast, holidayMap] = await Promise.all([
      fetchForecast(lat, lon),
      fetchHolidayMap(year)
    ]);
    draw(forecast, holidayMap);
    document.getElementById("fortune").textContent = `地域: ${document.getElementById("city").selectedOptions[0].text}`;
  }

  document.getElementById("load").addEventListener("click", load);
  window.addEventListener("DOMContentLoaded", load);