async function getWeather() {
  const city = document.getElementById('cityInput').value;
  const weatherApiKey = 'f331453afd22462d8a9134350251204';
  const openaiApiKey = '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';

  const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${city}&days=5&aqi=yes&alerts=no`;

  const forecastContainer = document.getElementById('forecastContainer');
  const gptResponse = document.getElementById('gptResponse');

  // Show loading animation
  gptResponse.innerHTML = '<div class="loader"></div>';
  forecastContainer.innerHTML = '';

  try {
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    if (weatherData.error) {
      forecastContainer.innerText = "❌ City not found or API error.";
      gptResponse.innerHTML = '';
      return;
    }

    const forecast = weatherData.forecast.forecastday.map(day => ({
      date: day.date,
      condition: day.day.condition.text,
      icon: day.day.condition.icon,
      avg_temp_c: day.day.avgtemp_c,
      humidity: day.day.avghumidity,
      sunrise: day.astro.sunrise,
      sunset: day.astro.sunset
    }));

    const aqi = weatherData.current.air_quality.pm2_5 || "N/A";

    forecast.forEach(day => {
      forecastContainer.innerHTML += `
        <div class="forecast-card">
          <h3>${day.date}</h3>
          <img src="https:${day.icon}" alt="${day.condition}">
          <p><strong>Condition:</strong> ${day.condition}</p>
          <p><strong>Avg Temp:</strong> ${day.avg_temp_c}°C</p>
          <p><strong>Humidity:</strong> ${day.humidity}%</p>
          <p><strong>Sunrise:</strong> ${day.sunrise}</p>
          <p><strong>Sunset:</strong> ${day.sunset}</p>
        </div>
      `;
    });

    const prompt = `Based on the 5-day weather forecast and the air quality index (${aqi}) for ${city}, provide:
1. 🌾 Suitable crops to grow
2. 🐛 Ideal pesticides to use
3. ⚠️ Necessary precautions to improve yield
4. 🌳 Suitability for outdoor activity or trips

Forecast Data: ${JSON.stringify(forecast)}`;

    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const chatData = await chatResponse.json();
    const answer = chatData.choices?.[0]?.message?.content || "⚠️ No response from ChatGPT.";

    // Convert Markdown to HTML and display
    gptResponse.innerHTML = "🧠 " + convertMarkdownToHTML(answer);

  } catch (error) {
    console.error("Error:", error);
    forecastContainer.innerText = "❌ An error occurred. Please try again.";
    gptResponse.innerHTML = '';
  }
}

// Helper to convert basic markdown to HTML
function convertMarkdownToHTML(markdown) {
  return markdown
    .replace(/^### (.*$)/gim, '<h4>$1</h4>')               // ### Heading
    .replace(/^## (.*$)/gim, '<h3>$1</h3>')                // ## Heading
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')                 // # Heading
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')    // Bold
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')                // Italic
    .replace(/^\- (.*$)/gim, '<li>$1</li>')                // Bullet points
    .replace(/<\/li>\s*<li>/gim, '</li><li>')              // Clean list
    .replace(/(<li>.*?<\/li>)/gim, '<ul>$1</ul>')          // Wrap in ul
    .replace(/\n/gim, '<br>');                             // New lines
}
