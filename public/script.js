class PopCatGame {
  constructor() {
    this.userCountry = null;
    this.userClicks = 0;
    this.totalClicks = 0;
    this.catContainer = document.getElementById('catContainer');
    this.totalClicksElement = document.getElementById('totalClicks');
    this.userClicksElement = document.getElementById('userClicks');
    this.userCountryElement = document.getElementById('userCountry');
    
    this.init();
  }

  async init() {
    await this.detectCountry();
    this.setupEventListeners();
    this.loadLeaderboard();
    this.startAutoRefresh();
  }

  async detectCountry() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      this.userCountry = data.country_name || 'Desconocido';
      this.userCountryElement.textContent = this.userCountry;
    } catch {
      this.userCountry = 'Desconocido';
      this.userCountryElement.textContent = 'No detectado';
    }
  }

  setupEventListeners() {
    this.catContainer.addEventListener('click', () => this.handleClick());
    
    // También permitir tecla espacio
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleClick();
      }
    });
  }

  async handleClick() {
    if (!this.userCountry || this.userCountry === 'Desconocido') return;

    // Efecto visual
    this.animateClick();
    
    // Contador local
    this.userClicks++;
    this.userClicksElement.textContent = this.userClicks.toLocaleString();

    try {
      const res = await fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: this.userCountry }),
      });
      
      const data = await res.json();
      if (data.success) {
        this.updateLeaderboard(data.leaderboard);
        this.updateTotalClicks(data.leaderboard);
      }
    } catch (err) {
      console.error('Error al enviar click:', err);
    }
  }

  animateClick() {
    this.catContainer.classList.add('active');
    
    const clickEffect = this.catContainer.querySelector('.click-effect');
    clickEffect.textContent = '+1';
    clickEffect.style.animation = 'none';
    setTimeout(() => {
      clickEffect.style.animation = 'floatUp 1s ease-out forwards';
    }, 10);

    setTimeout(() => {
      this.catContainer.classList.remove('active');
    }, 100);
  }

  async loadLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.success) {
        this.updateLeaderboard(data.leaderboard);
        this.updateTotalClicks(data.leaderboard);
      }
    } catch (err) {
      console.error('Error al cargar leaderboard:', err);
    }
  }

  updateLeaderboard(leaderboard) {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';

    leaderboard.forEach((row, index) => {
      const item = document.createElement('div');
      item.className = 'leaderboard-item';
      
      item.innerHTML = `
        <span class="rank">#${index + 1}</span>
        <span class="country">${row.country}</span>
        <span class="clicks">${row.total_clicks.toLocaleString()}</span>
      `;
      
      tbody.appendChild(item);
    });
  }

  updateTotalClicks(leaderboard) {
    this.totalClicks = leaderboard.reduce((sum, row) => sum + parseInt(row.total_clicks), 0);
    this.totalClicksElement.textContent = this.totalClicks.toLocaleString();
  }

  startAutoRefresh() {
    // Actualizar leaderboard cada 5 segundos
    setInterval(() => {
      this.loadLeaderboard();
    }, 5000);
  }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  new PopCatGame();
});
