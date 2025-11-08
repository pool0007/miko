class PopCatGame {
  constructor() {
    this.userCountry = null;
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
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      this.userCountry = data.country_name || 'Unknown';
      this.userCountryStat.textContent = this.userCountry;
      console.log('✅ Country detected:', this.userCountry);
    } catch (error) {
      console.error('❌ Error detecting country:', error);
      this.userCountry = 'Unknown';
      this.userCountryStat.textContent = 'Not detected';
    }
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
    
    // Highlight user's country
    if (row.country === this.userCountry) {
      item.style.background = 'rgba(255, 235, 59, 0.2)';
      item.style.border = '1px solid rgba(255, 235, 59, 0.5)';
    }
    
    const countryCode = this.getCountryCode(row.country);
    const flagUrl = `https://flagcdn.com/w40/${countryCode}.png`;
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

  getCountryCode(countryName) {
    const countryMap = {
      // North America
      'United States': 'us',
      'Canada': 'ca',
      'Mexico': 'mx',
      
      // Central America
      'Guatemala': 'gt',
      'Belize': 'bz',
      'El Salvador': 'sv',
      'Honduras': 'hn',
      'Nicaragua': 'ni',
      'Costa Rica': 'cr',
      'Panama': 'pa',
      
      // Caribbean
      'Cuba': 'cu',
      'Dominican Republic': 'do',
      'Haiti': 'ht',
      'Jamaica': 'jm',
      'Puerto Rico': 'pr',
      'Bahamas': 'bs',
      'Trinidad and Tobago': 'tt',
      
      // South America
      'Brazil': 'br',
      'Argentina': 'ar',
      'Colombia': 'co',
      'Peru': 'pe',
      'Venezuela': 've',
      'Chile': 'cl',
      'Ecuador': 'ec',
      'Bolivia': 'bo',
      'Paraguay': 'py',
      'Uruguay': 'uy',
      'Guyana': 'gy',
      'Suriname': 'sr',
      'French Guiana': 'gf',
      
      // Europe
      'United Kingdom': 'gb',
      'Germany': 'de',
      'France': 'fr',
      'Italy': 'it',
      'Spain': 'es',
      'Portugal': 'pt',
      'Netherlands': 'nl',
      'Belgium': 'be',
      'Switzerland': 'ch',
      'Austria': 'at',
      'Sweden': 'se',
      'Norway': 'no',
      'Denmark': 'dk',
      'Finland': 'fi',
      'Ireland': 'ie',
      'Poland': 'pl',
      'Czech Republic': 'cz',
      'Slovakia': 'sk',
      'Hungary': 'hu',
      'Romania': 'ro',
      'Bulgaria': 'bg',
      'Greece': 'gr',
      'Turkey': 'tr',
      'Ukraine': 'ua',
      'Russia': 'ru',
      'Belarus': 'by',
      
      // Asia
      'China': 'cn',
      'Japan': 'jp',
      'South Korea': 'kr',
      'North Korea': 'kp',
      'India': 'in',
      'Pakistan': 'pk',
      'Bangladesh': 'bd',
      'Indonesia': 'id',
      'Philippines': 'ph',
      'Vietnam': 'vn',
      'Thailand': 'th',
      'Malaysia': 'my',
      'Singapore': 'sg',
      'Israel': 'il',
      'Saudi Arabia': 'sa',
      'United Arab Emirates': 'ae',
      'Iran': 'ir',
      'Iraq': 'iq',
      'Afghanistan': 'af',
      
      // Africa
      'Egypt': 'eg',
      'South Africa': 'za',
      'Nigeria': 'ng',
      'Kenya': 'ke',
      'Ethiopia': 'et',
      'Ghana': 'gh',
      'Morocco': 'ma',
      'Algeria': 'dz',
      'Tunisia': 'tn',
      'Uganda': 'ug',
      'Tanzania': 'tz',
      'Sudan': 'sd',
      'Angola': 'ao',
      'Mozambique': 'mz',
      'Madagascar': 'mg',
      
      // Oceania
      'Australia': 'au',
      'New Zealand': 'nz',
      'Fiji': 'fj',
      'Papua New Guinea': 'pg',
      'Solomon Islands': 'sb',
      
      // Common variations
      'USA': 'us',
      'UK': 'gb',
      'UAE': 'ae',
      'DR Congo': 'cd',
      'Congo': 'cg',
      'South Korea': 'kr',
      'North Korea': 'kp',
      'Czechia': 'cz',
      'Slovakia': 'sk',
      'Macedonia': 'mk',
      'Bosnia': 'ba',
      'Serbia': 'rs',
      'Croatia': 'hr',
      'Slovenia': 'si',
      'Montenegro': 'me',
      'Kosovo': 'xk',
      'Palestine': 'ps',
      'Taiwan': 'tw',
      'Hong Kong': 'hk',
      'Macau': 'mo'
    };
    
    return countryMap[countryName] || 'un';
  }

  getDefaultFlagUrl() {
    // Generic flag as fallback
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI0IiBmaWxsPSIjRkZGIi8+CjxwYXRoIGQ9Ik0wIDBINDBWMjRIMHoiIGZpbGw9IiNGRkYiLz4KPHBhdGggZD0iTTE2IDBIMjRWMjRIMTZWIiBmaWxsPSIjMDA2YWFmIi8+CjxwYXRoIGQ9Ik0wIDhINDBWMTZIMFY4WiIgZmlsbD0iIzAwNmFhZiIvPgo8L3N2Zz4K';
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
    
    console.log('🔄 Auto-refresh started (3s interval)');
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, starting game...');
  window.popCatGame = new PopCatGame();
});

// Handle uncaught errors
window.addEventListener('error', (event) => {
  console.error('💥 Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('💥 Unhandled promise rejection:', event.reason);
});
