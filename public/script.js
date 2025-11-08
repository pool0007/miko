class PopCatGame {
  constructor() {
    this.userCountry = null;
    this.userClicks = 0;
    this.totalClicks = 0;
    this.catContainer = document.getElementById('catContainer');
    this.totalClicksElement = document.getElementById('totalClicks');
    this.userClicksElement = document.getElementById('userClicks');
    this.userCountryElement = document.getElementById('userCountry');
    this.leaderboardBody = document.getElementById('leaderboardBody');
    
    this.baseURL = window.location.origin;
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing PopCat Game...');
    await this.detectCountry();
    this.setupEventListeners();
    await this.loadLeaderboard();
    this.startAutoRefresh();
    
    // Test API connection
    await this.testConnection();
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/api/health`);
      const data = await response.json();
      console.log('✅ API Health:', data);
    } catch (error) {
      console.error('❌ API Health check failed:', error);
    }
  }

  async detectCountry() {
    try {
      console.log('🌍 Detecting country...');
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      this.userCountry = data.country_name || 'Desconocido';
      this.userCountryElement.textContent = this.userCountry;
      console.log('✅ Country detected:', this.userCountry);
    } catch (error) {
      console.error('❌ Error detecting country:', error);
      this.userCountry = 'Desconocido';
      this.userCountryElement.textContent = 'No detectado';
    }
  }

  setupEventListeners() {
    console.log('🎯 Setting up event listeners...');
    
    // Click en el gato
    this.catContainer.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleClick();
    });
    
    // Tecla espacio
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleClick();
      }
    });
    
    // Touch para móviles
    this.catContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleClick();
    }, { passive: false });
  }

  async handleClick() {
    if (!this.userCountry || this.userCountry === 'Desconocido') {
      console.log('❌ No country detected, cannot send click');
      return;
    }

    console.log('🐱 Click detected for country:', this.userCountry);
    
    // Efecto visual inmediato
    this.animateClick();
    
    // Contador local
    this.userClicks++;
    this.userClicksElement.textContent = this.userClicks.toLocaleString();

    try {
      console.log('📤 Sending click to server...');
      const response = await fetch(`${this.baseURL}/api/click`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ country: this.userCountry }),
      });

      console.log('📥 Server response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Click response:', data);

      if (data.success) {
        this.updateLeaderboard(data.leaderboard);
        this.updateTotalClicks(data.leaderboard);
        console.log('🎯 Click registered successfully');
      } else {
        console.error('❌ Server returned error:', data.error);
      }
    } catch (error) {
      console.error('❌ Error sending click:', error);
      // Mostrar error al usuario
      this.showError('Error al enviar click. Recargando...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  animateClick() {
    // Animación del gato
    this.catContainer.classList.add('active');
    
    // Efecto de texto +1
    const clickEffect = this.catContainer.querySelector('.click-effect');
    clickEffect.textContent = '+1';
    clickEffect.style.animation = 'none';
    
    setTimeout(() => {
      clickEffect.style.animation = 'floatUp 1s ease-out forwards';
    }, 10);

    // Efecto de pulsación
    this.catContainer.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.catContainer.style.transform = 'scale(1)';
    }, 100);

    // Quitar clase active después de la animación
    setTimeout(() => {
      this.catContainer.classList.remove('active');
    }, 100);
  }

  async loadLeaderboard() {
    try {
      console.log('📊 Loading leaderboard...');
      const response = await fetch(`${this.baseURL}/api/leaderboard`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Leaderboard data:', data);

      if (data.success) {
        this.updateLeaderboard(data.leaderboard);
        this.updateTotalClicks(data.leaderboard);
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
    
    console.log('🔄 Updating leaderboard UI with', leaderboard.length, 'countries');
    
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

    leaderboard.forEach((row, index) => {
      const item = document.createElement('div');
      item.className = 'leaderboard-item';
      
      // Destacar el país del usuario
      if (row.country === this.userCountry) {
        item.style.background = 'rgba(255, 235, 59, 0.2)';
        item.style.border = '1px solid rgba(255, 235, 59, 0.5)';
      }
      
      item.innerHTML = `
        <span class="rank">#${index + 1}</span>
        <span class="country">${row.country}</span>
        <span class="clicks">${parseInt(row.total_clicks).toLocaleString()}</span>
      `;
      
      this.leaderboardBody.appendChild(item);
    });
  }

  updateTotalClicks(leaderboard) {
    this.totalClicks = leaderboard.reduce((sum, row) => sum + parseInt(row.total_clicks || 0), 0);
    this.totalClicksElement.textContent = this.totalClicks.toLocaleString();
    console.log('🔢 Total clicks updated:', this.totalClicks);
  }

  showError(message) {
    // Crear mensaje de error temporal
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      document.body.removeChild(errorDiv);
    }, 3000);
  }

  startAutoRefresh() {
    // Actualizar leaderboard cada 3 segundos
    setInterval(() => {
      this.loadLeaderboard();
    }, 3000);
    
    console.log('🔄 Auto-refresh started (3s interval)');
  }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, starting game...');
  window.popCatGame = new PopCatGame();
});

// Manejar errores no capturados
window.addEventListener('error', (event) => {
  console.error('💥 Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('💥 Unhandled promise rejection:', event.reason);
});
