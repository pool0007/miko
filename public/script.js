class PopCatGame {
  constructor() {
    this.userCountry = null;
    this.userCountryCode = null;
    this.userClicks = 0;
    this.totalClicks = 0;
    this.leaderboardData = [];
    this.catContainer = document.getElementById('catContainer');
    this.totalClicksElement = document.getElementById('totalClicks');
    this.leaderboardBody = document.getElementById('leaderboardBody');
    
    // Dashboard elements
    this.dashboardMinimized = document.getElementById('dashboardMinimized');
    this.dashboardExpanded = document.getElementById('dashboardExpanded');
    this.miniTotalClicks = document.getElementById('miniTotalClicks');
    this.miniTopCountry = document.getElementById('miniTopCountry');
    this.userCountryStat = document.getElementById('userCountryStat');
    this.userClicksStat = document.getElementById('userClicksStat');
    this.userRankStat = document.getElementById('userRankStat');
    
    this.baseURL = window.location.origin;
    this.isDashboardExpanded = false;
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing PopCat Game...');
    await this.detectCountry();
    this.setupEventListeners();
    await this.loadLeaderboard();
    this.startAutoRefresh();
    this.updateDashboardStats();
  }

  async detectCountry() {
    try {
      console.log('🌍 Detecting country...');
      
      // Usar ipapi.co directamente - es confiable
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      this.userCountry = data.country_name;
      this.userCountryCode = data.country_code;
      
    } catch (error) {
      console.error('❌ Error detecting country:', error);
      this.userCountry = 'Unknown';
      this.userCountryCode = 'US';
    }
    
    this.userCountryStat.textContent = this.userCountry;
    console.log('✅ Country detected:', this.userCountry, this.userCountryCode);
  }

  setupEventListeners() {
    // Click on cat
    this.catContainer.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleClick();
    });
    
    // Space key
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleClick();
      }
    });
    
    // Dashboard toggle
    document.getElementById('dashboardToggle').addEventListener('click', () => {
      this.toggleDashboard();
    });
    
    document.getElementById('dashboardClose').addEventListener('click', () => {
      this.toggleDashboard();
    });
    
    // Touch for mobile
    this.catContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleClick();
    }, { passive: false });
  }

  toggleDashboard() {
    this.isDashboardExpanded = !this.isDashboardExpanded;
    
    if (this.isDashboardExpanded) {
      this.dashboardMinimized.style.display = 'none';
      this.dashboardExpanded.style.display = 'block';
    } else {
      this.dashboardMinimized.style.display = 'block';
      this.dashboardExpanded.style.display = 'none';
    }
  }

  async handleClick() {
    if (!this.userCountry || this.userCountry === 'Unknown') {
      console.log('❌ No country detected, cannot send click');
      return;
    }

    console.log('🐱 Click detected for country:', this.userCountry);
    
    // Visual effect
    this.animateClick();
    
    // Local counter
    this.userClicks++;
    this.userClicksStat.textContent = this.userClicks.toLocaleString();

    try {
      const response = await fetch(`${this.baseURL}/api/click`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ country: this.userCountry }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        this.updateLeaderboard(data.leaderboard);
        this.updateTotalClicks(data.leaderboard);
        this.updateDashboardStats();
        console.log('🎯 Click registered successfully');
      } else {
        console.error('❌ Server returned error:', data.error);
      }
    } catch (error) {
      console.error('❌ Error sending click:', error);
    }
  }

  animateClick() {
    // Cat animation
    this.catContainer.classList.add('active');
    
    // +1 text effect
    const clickEffect = this.catContainer.querySelector('.click-effect');
    clickEffect.textContent = '+1';
    clickEffect.style.animation = 'none';
    
    setTimeout(() => {
      clickEffect.style.animation = 'floatUp 1s ease-out forwards';
    }, 10);

    // Pulse effect
    this.catContainer.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.catContainer.style.transform = 'scale(1)';
    }, 100);

    // Remove active class after animation
    setTimeout(() => {
      this.catContainer.classList.remove('active');
    }, 100);
  }

  async loadLeaderboard() {
    try {
      const response = await fetch(`${this.baseURL}/api/leaderboard`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        this.leaderboardData = data.leaderboard;
        this.updateLeaderboard(data.leaderboard);
        this.updateTotalClicks(data.leaderboard);
        this.updateDashboardStats();
        console.log('📈 Leaderboard updated successfully');
      } else {
        console.error('❌ Leaderboard error:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading leaderboard:', error);
    }
  }

  updateLeaderboard(leaderboard) {
    if (!this.leaderboardBody) return;
    
    this.leaderboardBody.innerHTML = '';

    if (leaderboard.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'leaderboard-item';
      emptyItem.innerHTML = `
        <span class="rank">-</span>
        <span class="country">No data yet</span>
        <span class="clicks">0</span>
      `;
      this.leaderboardBody.appendChild(emptyItem);
      return;
    }

    leaderboard.forEach((row, index) => {
      const item = this.createLeaderboardItem(row, index);
      this.leaderboardBody.appendChild(item);
    });

    // Update user ranking
    this.updateUserRank(leaderboard);
  }

  createLeaderboardItem(row, index) {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    
    if (row.country === this.userCountry) {
      item.style.background = 'rgba(255, 235, 59, 0.2)';
    }
    
    const countryCode = this.getCountryCode(row.country);
    const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1;
    
    // USAR SOLO FLAGCDN - URL directa y simple
    const flagUrl = `https://flagcdn.com/w40/${countryCode}.png`;
    
    item.innerHTML = `
      <span class="rank">${medal}</span>
      <span class="country">
        <img src="${flagUrl}" 
             alt="${row.country}" 
             class="country-flag">
        ${row.country}
      </span>
      <span class="clicks">${parseInt(row.total_clicks).toLocaleString()}</span>
    `;
    
    return item;
  }

  getCountryCode(countryName) {
    // Mapeo simplificado de países más comunes
    const countryMap = {
      // América
      'United States': 'us', 'United States of America': 'us', 'USA': 'us',
      'Canada': 'ca', 'Mexico': 'mx', 'México': 'mx',
      'Brazil': 'br', 'Brasil': 'br', 'Argentina': 'ar',
      'Colombia': 'co', 'Chile': 'cl', 'Peru': 'pe', 'Perú': 'pe',
      
      // Europa
      'United Kingdom': 'gb', 'UK': 'gb', 'Germany': 'de', 'France': 'fr',
      'Italy': 'it', 'Spain': 'es', 'España': 'es', 'Portugal': 'pt',
      'Netherlands': 'nl', 'Belgium': 'be', 'Switzerland': 'ch',
      
      // Asia
      'Japan': 'jp', 'China': 'cn', 'India': 'in', 'South Korea': 'kr',
      'Russia': 'ru', 'Turkey': 'tr',
      
      // Otros
      'Australia': 'au', 'New Zealand': 'nz', 'South Africa': 'za',
      'Egypt': 'eg', 'Nigeria': 'ng'
    };

    // Búsqueda case-insensitive
    const normalizedCountry = countryName.toLowerCase();
    for (const [name, code] of Object.entries(countryMap)) {
      if (name.toLowerCase() === normalizedCountry) {
        return code;
      }
    }
    
    return 'un'; // Fallback para países no mapeados
  }

  updateUserRank(leaderboard) {
    const userIndex = leaderboard.findIndex(row => row.country === this.userCountry);
    if (userIndex !== -1) {
      this.userRankStat.textContent = `#${userIndex + 1}`;
    } else {
      this.userRankStat.textContent = '-';
    }
  }

  updateTotalClicks(leaderboard) {
    this.totalClicks = leaderboard.reduce((sum, row) => sum + parseInt(row.total_clicks || 0), 0);
    this.totalClicksElement.textContent = this.totalClicks.toLocaleString();
  }

  updateDashboardStats() {
    // Update total clicks
    this.miniTotalClicks.textContent = this.totalClicks.toLocaleString();
    
    // Update leading country
    if (this.leaderboardData.length > 0) {
      const topCountry = this.leaderboardData[0];
      this.miniTopCountry.textContent = topCountry.country;
    } else {
      this.miniTopCountry.textContent = '-';
    }
  }

  startAutoRefresh() {
    // Update leaderboard every 3 seconds
    setInterval(() => {
      this.loadLeaderboard();
    }, 3000);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, starting game...');
  window.popCatGame = new PopCatGame();
});
