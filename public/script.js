class PopCatGame {
  // ... (código anterior se mantiene igual)

  updateLeaderboard(leaderboard) {
    if (!this.leaderboardBody) return;
    
    this.leaderboardBody.innerHTML = '';

    if (leaderboard.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'leaderboard-item';
      emptyItem.innerHTML = `
        <span class="rank">-</span>
        <span class="country">No hay datos aún</span>
        <span class="clicks">0</span>
      `;
      this.leaderboardBody.appendChild(emptyItem);
      return;
    }

    // Cargar banderas para todos los países
    this.loadAllFlags(leaderboard).then(flagsMap => {
      leaderboard.forEach((row, index) => {
        const item = this.createLeaderboardItem(row, index, flagsMap);
        this.leaderboardBody.appendChild(item);
      });
    });

    // Actualizar ranking del usuario
    this.updateUserRank(leaderboard);
  }

  async loadAllFlags(leaderboard) {
    const flagsMap = new Map();
    const promises = leaderboard.map(async (row, index) => {
      if (index < 10) { // Solo cargar banderas para los primeros 10 para mejor performance
        const flagUrl = await this.getCountryFlag(row.country);
        flagsMap.set(row.country, flagUrl);
      }
    });
    
    await Promise.all(promises);
    return flagsMap;
  }

  createLeaderboardItem(row, index, flagsMap) {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    
    // Destacar el país del usuario
    if (row.country === this.userCountry) {
      item.style.background = 'rgba(255, 235, 59, 0.2)';
      item.style.border = '1px solid rgba(255, 235, 59, 0.5)';
    }
    
    const flagUrl = flagsMap.get(row.country) || this.getDefaultFlagUrl();
    const medal = this.getMedalEmoji(index + 1);
    
    item.innerHTML = `
      <span class="rank">${medal}${index + 1}</span>
      <span class="country">
        <img src="${flagUrl}" alt="${row.country}" class="country-flag" 
             onerror="this.src='${this.getDefaultFlagUrl()}'">
        ${row.country}
      </span>
      <span class="clicks">${parseInt(row.total_clicks).toLocaleString()}</span>
    `;
    
    return item;
  }

  getMedalEmoji(rank) {
    switch(rank) {
      case 1: return '🥇 ';
      case 2: return '🥈 ';
      case 3: return '🥉 ';
      default: return '';
    }
  }

  async getCountryFlag(countryName) {
    try {
      // Primero intentar con FlagCDN
      const countryCode = this.getCountryCode(countryName);
      if (countryCode && countryCode !== 'un') {
        // Intentar con diferentes APIs de banderas
        const flagUrls = [
          `https://flagcdn.com/w40/${countryCode}.png`,
          `https://flagsapi.com/${countryCode}/flat/32.png`,
          `https://countryflagsapi.com/png/${countryCode}`,
          `https://www.worldometers.info/img/flags/${countryCode}-flag.gif`
        ];
        
        // Devolver la primera URL, el navegador manejará el fallback
        return flagUrls[0];
      }
      
      // Si no encontramos código, usar API de REST Countries
      const restCountriesUrl = await this.getFlagFromRestCountries(countryName);
      if (restCountriesUrl) {
        return restCountriesUrl;
      }
      
    } catch (error) {
      console.log('Error getting flag for:', countryName, error);
    }
    
    return this.getDefaultFlagUrl();
  }

  async getFlagFromRestCountries(countryName) {
    try {
      // Buscar por nombre completo
      let response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`);
      if (!response.ok) {
        // Buscar por nombre común
        response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(this.getCommonName(countryName))}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data && data[0]) {
          return data[0].flags.png;
        }
      }
    } catch (error) {
      console.log('REST Countries API error:', error);
    }
    return null;
  }

  getCountryCode(countryName) {
    const countryMap = {
      // América
      'Argentina': 'ar',
      'Chile': 'cl', 
      'Mexico': 'mx',
      'México': 'mx',
      'Estados Unidos': 'us',
      'United States': 'us',
      'Brasil': 'br',
      'Brazil': 'br',
      'Colombia': 'co',
      'Peru': 'pe',
      'Perú': 'pe',
      'Venezuela': 've',
      'Ecuador': 'ec',
      'Bolivia': 'bo',
      'Paraguay': 'py',
      'Uruguay': 'uy',
      'Canada': 'ca',
      'Canadá': 'ca',
      
      // Europa
      'España': 'es',
      'Spain': 'es',
      'France': 'fr',
      'Francia': 'fr',
      'Germany': 'de',
      'Alemania': 'de',
      'Italy': 'it',
      'Italia': 'it',
      'United Kingdom': 'gb',
      'Reino Unido': 'gb',
      'Portugal': 'pt',
      'Netherlands': 'nl',
      'Países Bajos': 'nl',
      'Belgium': 'be',
      'Bélgica': 'be',
      'Switzerland': 'ch',
      'Suiza': 'ch',
      
      // Asia
      'Japan': 'jp',
      'Japón': 'jp',
      'China': 'cn',
      'India': 'in',
      'South Korea': 'kr',
      'Corea del Sur': 'kr',
      'Russia': 'ru',
      'Rusia': 'ru',
      
      // Oceanía
      'Australia': 'au',
      'New Zealand': 'nz',
      'Nueva Zelanda': 'nz',
      
      // África
      'South Africa': 'za',
      'Sudáfrica': 'za',
      'Egypt': 'eg',
      'Egipto': 'eg',
      'Nigeria': 'ng',
      'Kenya': 'ke'
    };
    
    return countryMap[countryName] || this.sanitizeCountryName(countryName);
  }

  getCommonName(countryName) {
    const commonNames = {
      'Estados Unidos': 'United States',
      'Reino Unido': 'United Kingdom',
      'Corea del Sur': 'South Korea',
      'Países Bajos': 'Netherlands'
    };
    
    return commonNames[countryName] || countryName;
  }

  sanitizeCountryName(countryName) {
    // Convertir a minúsculas y eliminar acentos para mejor matching
    return countryName
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ' ');
  }

  getDefaultFlagUrl() {
    // Bandera genérica como fallback
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI0IiBmaWxsPSIjRkZGIi8+CjxwYXRoIGQ9Ik0wIDBINDBWMjRIMHoiIGZpbGw9IiNGRkYiLz4KPHBhdGggZD0iTTE2IDBIMjRWMjRIMTZWIiBmaWxsPSIjMDA2YWFmIi8+CjxwYXRoIGQ9Ik0wIDhINDBWMTZIMFY4WiIgZmlsbD0iIzAwNmFhZiIvPgo8L3N2Zz4K';
  }

  // ... (resto del código se mantiene igual)
}
