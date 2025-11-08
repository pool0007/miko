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
      
      // PRIMERO: Intentar con nuestra API
      const response = await fetch(`${this.baseURL}/api/ipinfo`);
      if (response.ok) {
        const data = await response.json();
        this.userCountry = data.country;
        this.userCountryCode = data.country_code;
      } else {
        throw new Error('Our API failed');
      }
      
    } catch (error) {
      console.log('❌ Primary API failed, trying fallbacks...');
      
      // SEGUNDO: Intentar con ipapi.co directamente
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        this.userCountry = data.country_name;
        this.userCountryCode = data.country_code;
      } catch (error2) {
        // TERCERO: Último fallback
        try {
          const response = await fetch('https://api.country.is/');
          const data = await response.json();
          this.userCountry = this.getCountryNameFromCode(data.country);
          this.userCountryCode = data.country;
        } catch (error3) {
          this.userCountry = 'Unknown';
          this.userCountryCode = 'US';
        }
      }
    }
    
    this.userCountryStat.textContent = this.userCountry;
    console.log('✅ Country detected:', this.userCountry, this.userCountryCode);
  }

  getCountryNameFromCode(code) {
    const countryNames = {
      'AF': 'Afghanistan', 'AX': 'Åland Islands', 'AL': 'Albania', 'DZ': 'Algeria',
      'AS': 'American Samoa', 'AD': 'Andorra', 'AO': 'Angola', 'AI': 'Anguilla',
      'AQ': 'Antarctica', 'AG': 'Antigua and Barbuda', 'AR': 'Argentina', 'AM': 'Armenia',
      'AW': 'Aruba', 'AU': 'Australia', 'AT': 'Austria', 'AZ': 'Azerbaijan',
      'BS': 'Bahamas', 'BH': 'Bahrain', 'BD': 'Bangladesh', 'BB': 'Barbados',
      'BY': 'Belarus', 'BE': 'Belgium', 'BZ': 'Belize', 'BJ': 'Benin',
      'BM': 'Bermuda', 'BT': 'Bhutan', 'BO': 'Bolivia', 'BQ': 'Bonaire',
      'BA': 'Bosnia and Herzegovina', 'BW': 'Botswana', 'BV': 'Bouvet Island',
      'BR': 'Brazil', 'IO': 'British Indian Ocean Territory', 'BN': 'Brunei Darussalam',
      'BG': 'Bulgaria', 'BF': 'Burkina Faso', 'BI': 'Burundi', 'CV': 'Cabo Verde',
      'KH': 'Cambodia', 'CM': 'Cameroon', 'CA': 'Canada', 'KY': 'Cayman Islands',
      'CF': 'Central African Republic', 'TD': 'Chad', 'CL': 'Chile', 'CN': 'China',
      'CX': 'Christmas Island', 'CC': 'Cocos Islands', 'CO': 'Colombia', 'KM': 'Comoros',
      'CG': 'Congo', 'CD': 'Democratic Republic of the Congo', 'CK': 'Cook Islands',
      'CR': 'Costa Rica', 'CI': 'Côte d\'Ivoire', 'HR': 'Croatia', 'CU': 'Cuba',
      'CW': 'Curaçao', 'CY': 'Cyprus', 'CZ': 'Czech Republic', 'DK': 'Denmark',
      'DJ': 'Djibouti', 'DM': 'Dominica', 'DO': 'Dominican Republic', 'EC': 'Ecuador',
      'EG': 'Egypt', 'SV': 'El Salvador', 'GQ': 'Equatorial Guinea', 'ER': 'Eritrea',
      'EE': 'Estonia', 'SZ': 'Eswatini', 'ET': 'Ethiopia', 'FK': 'Falkland Islands',
      'FO': 'Faroe Islands', 'FJ': 'Fiji', 'FI': 'Finland', 'FR': 'France',
      'GF': 'French Guiana', 'PF': 'French Polynesia', 'TF': 'French Southern Territories',
      'GA': 'Gabon', 'GM': 'Gambia', 'GE': 'Georgia', 'DE': 'Germany',
      'GH': 'Ghana', 'GI': 'Gibraltar', 'GR': 'Greece', 'GL': 'Greenland',
      'GD': 'Grenada', 'GP': 'Guadeloupe', 'GU': 'Guam', 'GT': 'Guatemala',
      'GG': 'Guernsey', 'GN': 'Guinea', 'GW': 'Guinea-Bissau', 'GY': 'Guyana',
      'HT': 'Haiti', 'HM': 'Heard Island and McDonald Islands', 'VA': 'Holy See',
      'HN': 'Honduras', 'HK': 'Hong Kong', 'HU': 'Hungary', 'IS': 'Iceland',
      'IN': 'India', 'ID': 'Indonesia', 'IR': 'Iran', 'IQ': 'Iraq',
      'IE': 'Ireland', 'IM': 'Isle of Man', 'IL': 'Israel', 'IT': 'Italy',
      'JM': 'Jamaica', 'JP': 'Japan', 'JE': 'Jersey', 'JO': 'Jordan',
      'KZ': 'Kazakhstan', 'KE': 'Kenya', 'KI': 'Kiribati', 'KP': 'North Korea',
      'KR': 'South Korea', 'KW': 'Kuwait', 'KG': 'Kyrgyzstan', 'LA': 'Laos',
      'LV': 'Latvia', 'LB': 'Lebanon', 'LS': 'Lesotho', 'LR': 'Liberia',
      'LY': 'Libya', 'LI': 'Liechtenstein', 'LT': 'Lithuania', 'LU': 'Luxembourg',
      'MO': 'Macao', 'MG': 'Madagascar', 'MW': 'Malawi', 'MY': 'Malaysia',
      'MV': 'Maldives', 'ML': 'Mali', 'MT': 'Malta', 'MH': 'Marshall Islands',
      'MQ': 'Martinique', 'MR': 'Mauritania', 'MU': 'Mauritius', 'YT': 'Mayotte',
      'MX': 'Mexico', 'FM': 'Micronesia', 'MD': 'Moldova', 'MC': 'Monaco',
      'MN': 'Mongolia', 'ME': 'Montenegro', 'MS': 'Montserrat', 'MA': 'Morocco',
      'MZ': 'Mozambique', 'MM': 'Myanmar', 'NA': 'Namibia', 'NR': 'Nauru',
      'NP': 'Nepal', 'NL': 'Netherlands', 'NC': 'New Caledonia', 'NZ': 'New Zealand',
      'NI': 'Nicaragua', 'NE': 'Niger', 'NG': 'Nigeria', 'NU': 'Niue',
      'NF': 'Norfolk Island', 'MK': 'North Macedonia', 'MP': 'Northern Mariana Islands',
      'NO': 'Norway', 'OM': 'Oman', 'PK': 'Pakistan', 'PW': 'Palau',
      'PS': 'Palestine', 'PA': 'Panama', 'PG': 'Papua New Guinea', 'PY': 'Paraguay',
      'PE': 'Peru', 'PH': 'Philippines', 'PN': 'Pitcairn', 'PL': 'Poland',
      'PT': 'Portugal', 'PR': 'Puerto Rico', 'QA': 'Qatar', 'RE': 'Réunion',
      'RO': 'Romania', 'RU': 'Russia', 'RW': 'Rwanda', 'BL': 'Saint Barthélemy',
      'SH': 'Saint Helena', 'KN': 'Saint Kitts and Nevis', 'LC': 'Saint Lucia',
      'MF': 'Saint Martin', 'PM': 'Saint Pierre and Miquelon', 'VC': 'Saint Vincent and the Grenadines',
      'WS': 'Samoa', 'SM': 'San Marino', 'ST': 'Sao Tome and Principe', 'SA': 'Saudi Arabia',
      'SN': 'Senegal', 'RS': 'Serbia', 'SC': 'Seychelles', 'SL': 'Sierra Leone',
      'SG': 'Singapore', 'SX': 'Sint Maarten', 'SK': 'Slovakia', 'SI': 'Slovenia',
      'SB': 'Solomon Islands', 'SO': 'Somalia', 'ZA': 'South Africa', 'GS': 'South Georgia',
      'SS': 'South Sudan', 'ES': 'Spain', 'LK': 'Sri Lanka', 'SD': 'Sudan',
      'SR': 'Suriname', 'SJ': 'Svalbard and Jan Mayen', 'SE': 'Sweden', 'CH': 'Switzerland',
      'SY': 'Syria', 'TW': 'Taiwan', 'TJ': 'Tajikistan', 'TZ': 'Tanzania',
      'TH': 'Thailand', 'TL': 'Timor-Leste', 'TG': 'Togo', 'TK': 'Tokelau',
      'TO': 'Tonga', 'TT': 'Trinidad and Tobago', 'TN': 'Tunisia', 'TR': 'Turkey',
      'TM': 'Turkmenistan', 'TC': 'Turks and Caicos Islands', 'TV': 'Tuvalu',
      'UG': 'Uganda', 'UA': 'Ukraine', 'AE': 'United Arab Emirates', 'GB': 'United Kingdom',
      'US': 'United States', 'UM': 'United States Minor Outlying Islands', 'UY': 'Uruguay',
      'UZ': 'Uzbekistan', 'VU': 'Vanuatu', 'VE': 'Venezuela', 'VN': 'Vietnam',
      'VG': 'Virgin Islands (British)', 'VI': 'Virgin Islands (U.S.)', 'WF': 'Wallis and Futuna',
      'EH': 'Western Sahara', 'YE': 'Yemen', 'ZM': 'Zambia', 'ZW': 'Zimbabwe'
    };
    return countryNames[code] || 'Unknown';
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
    
    // SISTEMA MEJORADO DE BANDERAS
    const flagUrl = this.getFlagUrl(countryCode);
    
    item.innerHTML = `
      <span class="rank">${medal}</span>
      <span class="country">
        <img src="${flagUrl}" 
             alt="${row.country}" 
             class="country-flag"
             onerror="this.onerror=null; this.src='${this.getFallbackFlagUrl(countryCode)}'">
        ${row.country}
      </span>
      <span class="clicks">${parseInt(row.total_clicks).toLocaleString()}</span>
    `;
    
    return item;
  }

  getFlagUrl(countryCode) {
    // Fuente principal - flagsapi (como PopCat)
    return `https://flagsapi.com/${countryCode.toUpperCase()}/flat/64.png`;
  }

  getFallbackFlagUrl(countryCode) {
    // Fuentes alternativas en caso de error
    const fallbackSources = [
      `https://countryflagsapi.com/png/${countryCode}`,
      `https://flagcdn.com/w40/${countryCode}.png`,
      `https://www.worldometers.info/img/flags/${countryCode}-flag.gif`
    ];
    
    return fallbackSources[0];
  }

  getCountryCode(countryName) {
    // Mapeo completo de nombres de países a códigos
    const countryMap = {
      'Afghanistan': 'af', 'Åland Islands': 'ax', 'Albania': 'al', 'Algeria': 'dz',
      'American Samoa': 'as', 'Andorra': 'ad', 'Angola': 'ao', 'Anguilla': 'ai',
      'Antarctica': 'aq', 'Antigua and Barbuda': 'ag', 'Argentina': 'ar', 'Armenia': 'am',
      'Aruba': 'aw', 'Australia': 'au', 'Austria': 'at', 'Azerbaijan': 'az',
      'Bahamas': 'bs', 'Bahrain': 'bh', 'Bangladesh': 'bd', 'Barbados': 'bb',
      'Belarus': 'by', 'Belgium': 'be', 'Belize': 'bz', 'Benin': 'bj',
      'Bermuda': 'bm', 'Bhutan': 'bt', 'Bolivia': 'bo', 'Bonaire': 'bq',
      'Bosnia and Herzegovina': 'ba', 'Botswana': 'bw', 'Bouvet Island': 'bv',
      'Brazil': 'br', 'British Indian Ocean Territory': 'io', 'Brunei Darussalam': 'bn',
      'Bulgaria': 'bg', 'Burkina Faso': 'bf', 'Burundi': 'bi', 'Cabo Verde': 'cv',
      'Cambodia': 'kh', 'Cameroon': 'cm', 'Canada': 'ca', 'Cayman Islands': 'ky',
      'Central African Republic': 'cf', 'Chad': 'td', 'Chile': 'cl', 'China': 'cn',
      'Christmas Island': 'cx', 'Cocos Islands': 'cc', 'Colombia': 'co', 'Comoros': 'km',
      'Congo': 'cg', 'Democratic Republic of the Congo': 'cd', 'Cook Islands': 'ck',
      'Costa Rica': 'cr', 'Côte d\'Ivoire': 'ci', 'Croatia': 'hr', 'Cuba': 'cu',
      'Curaçao': 'cw', 'Cyprus': 'cy', 'Czech Republic': 'cz', 'Denmark': 'dk',
      'Djibouti': 'dj', 'Dominica': 'dm', 'Dominican Republic': 'do', 'Ecuador': 'ec',
      'Egypt': 'eg', 'El Salvador': 'sv', 'Equatorial Guinea': 'gq', 'Eritrea': 'er',
      'Estonia': 'ee', 'Eswatini': 'sz', 'Ethiopia': 'et', 'Falkland Islands': 'fk',
      'Faroe Islands': 'fo', 'Fiji': 'fj', 'Finland': 'fi', 'France': 'fr',
      'French Guiana': 'gf', 'French Polynesia': 'pf', 'French Southern Territories': 'tf',
      'Gabon': 'ga', 'Gambia': 'gm', 'Georgia': 'ge', 'Germany': 'de',
      'Ghana': 'gh', 'Gibraltar': 'gi', 'Greece': 'gr', 'Greenland': 'gl',
      'Grenada': 'gd', 'Guadeloupe': 'gp', 'Guam': 'gu', 'Guatemala': 'gt',
      'Guernsey': 'gg', 'Guinea': 'gn', 'Guinea-Bissau': 'gw', 'Guyana': 'gy',
      'Haiti': 'ht', 'Heard Island and McDonald Islands': 'hm', 'Holy See': 'va',
      'Honduras': 'hn', 'Hong Kong': 'hk', 'Hungary': 'hu', 'Iceland': 'is',
      'India': 'in', 'Indonesia': 'id', 'Iran': 'ir', 'Iraq': 'iq',
      'Ireland': 'ie', 'Isle of Man': 'im', 'Israel': 'il', 'Italy': 'it',
      'Jamaica': 'jm', 'Japan': 'jp', 'Jersey': 'je', 'Jordan': 'jo',
      'Kazakhstan': 'kz', 'Kenya': 'ke', 'Kiribati': 'ki', 'North Korea': 'kp',
      'South Korea': 'kr', 'Kuwait': 'kw', 'Kyrgyzstan': 'kg', 'Laos': 'la',
      'Latvia': 'lv', 'Lebanon': 'lb', 'Lesotho': 'ls', 'Liberia': 'lr',
      'Libya': 'ly', 'Liechtenstein': 'li', 'Lithuania': 'lt', 'Luxembourg': 'lu',
      'Macao': 'mo', 'Madagascar': 'mg', 'Malawi': 'mw', 'Malaysia': 'my',
      'Maldives': 'mv', 'Mali': 'ml', 'Malta': 'mt', 'Marshall Islands': 'mh',
      'Martinique': 'mq', 'Mauritania': 'mr', 'Mauritius': 'mu', 'Mayotte': 'yt',
      'Mexico': 'mx', 'Micronesia': 'fm', 'Moldova': 'md', 'Monaco': 'mc',
      'Mongolia': 'mn', 'Montenegro': 'me', 'Montserrat': 'ms', 'Morocco': 'ma',
      'Mozambique': 'mz', 'Myanmar': 'mm', 'Namibia': 'na', 'Nauru': 'nr',
      'Nepal': 'np', 'Netherlands': 'nl', 'New Caledonia': 'nc', 'New Zealand': 'nz',
      'Nicaragua': 'ni', 'Niger': 'ne', 'Nigeria': 'ng', 'Niue': 'nu',
      'Norfolk Island': 'nf', 'North Macedonia': 'mk', 'Northern Mariana Islands': 'mp',
      'Norway': 'no', 'Oman': 'om', 'Pakistan': 'pk', 'Palau': 'pw',
      'Palestine': 'ps', 'Panama': 'pa', 'Papua New Guinea': 'pg', 'Paraguay': 'py',
      'Peru': 'pe', 'Philippines': 'ph', 'Pitcairn': 'pn', 'Poland': 'pl',
      'Portugal': 'pt', 'Puerto Rico': 'pr', 'Qatar': 'qa', 'Réunion': 're',
      'Romania': 'ro', 'Russia': 'ru', 'Rwanda': 'rw', 'Saint Barthélemy': 'bl',
      'Saint Helena': 'sh', 'Saint Kitts and Nevis': 'kn', 'Saint Lucia': 'lc',
      'Saint Martin': 'mf', 'Saint Pierre and Miquelon': 'pm', 'Saint Vincent and the Grenadines': 'vc',
      'Samoa': 'ws', 'San Marino': 'sm', 'Sao Tome and Principe': 'st', 'Saudi Arabia': 'sa',
      'Senegal': 'sn', 'Serbia': 'rs', 'Seychelles': 'sc', 'Sierra Leone': 'sl',
      'Singapore': 'sg', 'Sint Maarten': 'sx', 'Slovakia': 'sk', 'Slovenia': 'si',
      'Solomon Islands': 'sb', 'Somalia': 'so', 'South Africa': 'za', 'South Georgia': 'gs',
      'South Sudan': 'ss', 'Spain': 'es', 'Sri Lanka': 'lk', 'Sudan': 'sd',
      'Suriname': 'sr', 'Svalbard and Jan Mayen': 'sj', 'Sweden': 'se', 'Switzerland': 'ch',
      'Syria': 'sy', 'Taiwan': 'tw', 'Tajikistan': 'tj', 'Tanzania': 'tz',
      'Thailand': 'th', 'Timor-Leste': 'tl', 'Togo': 'tg', 'Tokelau': 'tk',
      'Tonga': 'to', 'Trinidad and Tobago': 'tt', 'Tunisia': 'tn', 'Turkey': 'tr',
      'Turkmenistan': 'tm', 'Turks and Caicos Islands': 'tc', 'Tuvalu': 'tv',
      'Uganda': 'ug', 'Ukraine': 'ua', 'United Arab Emirates': 'ae', 'United Kingdom': 'gb',
      'United States': 'us', 'United States Minor Outlying Islands': 'um', 'Uruguay': 'uy',
      'Uzbekistan': 'uz', 'Vanuatu': 'vu', 'Venezuela': 've', 'Vietnam': 'vn',
      'Virgin Islands (British)': 'vg', 'Virgin Islands (U.S.)': 'vi', 'Wallis and Futuna': 'wf',
      'Western Sahara': 'eh', 'Yemen': 'ye', 'Zambia': 'zm', 'Zimbabwe': 'zw',
      
      // Common variations
      'USA': 'us', 'UK': 'gb', 'UAE': 'ae', 'DR Congo': 'cd'
    };

    // Búsqueda case-insensitive
    const normalizedCountry = countryName.toLowerCase();
    for (const [name, code] of Object.entries(countryMap)) {
      if (name.toLowerCase() === normalizedCountry) {
        return code;
      }
    }
    
    return 'un'; // United Nations como fallback
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
