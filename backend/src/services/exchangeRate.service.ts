import https from 'https';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(__dirname, '../../tasa_cambio.json');

export class ExchangeRateService {
  private static currentRate: number = 709.69; // Fallback rate (July 2026 reference)
  private static lastUpdated: Date | null = null;
  private static syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initializes the service by loading the cached rate from file
   * and starting the automatic synchronization every 4 hours.
   */
  static async initialize() {
    this.loadFromCache();
    // Run initial sync in the background
    this.syncRate().catch(err => console.error('Error during initial exchange rate sync:', err));
    
    // Schedule sync every 4 hours (14,400,000 ms)
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.syncInterval = setInterval(() => {
      this.syncRate().catch(err => console.error('Error during periodic exchange rate sync:', err));
    }, 4 * 60 * 60 * 1000);
  }

  /**
   * Gets the active rate (in Bs. per USD)
   */
  static getRate(): number {
    return this.currentRate;
  }

  /**
   * Gets the details (rate and timestamp)
   */
  static getDetails() {
    return {
      rate: this.currentRate,
      lastUpdated: this.lastUpdated ? this.lastUpdated.toISOString() : new Date().toISOString()
    };
  }

  /**
   * Tries to fetch the rate from ve.dolarapi.com or scrapes bcv.org.ve.
   */
  static async syncRate(): Promise<number> {
    console.log('[ExchangeRateService] Sincronizando tasa cambiaria oficial...');
    // Prioritize direct BCV scraping for real-time rates, fall back to DolarApi if needed
    try {
      const rate = await this.scrapeBcvWebsite();
      this.updateRate(rate);
      return rate;
    } catch (err) {
      console.warn('[ExchangeRateService] Scraping directo del BCV falló, intentando DolarApi...', err);
      try {
        const rate = await this.fetchFromDolarApi();
        this.updateRate(rate);
        return rate;
      } catch (dolarApiErr) {
        console.error('[ExchangeRateService] DolarApi también falló. Manteniendo tasa actual.', dolarApiErr);
        return this.currentRate;
      }
    }
  }

  private static updateRate(rate: number) {
    if (rate > 0 && rate !== this.currentRate) {
      this.currentRate = rate;
      this.lastUpdated = new Date();
      console.log(`[ExchangeRateService] Tasa actualizada: $1 = Bs. ${rate.toFixed(4)}`);
      this.saveToCache();
    } else {
      this.lastUpdated = new Date();
    }
  }

  private static saveToCache() {
    try {
      const data = JSON.stringify({
        rate: this.currentRate,
        lastUpdated: this.lastUpdated ? this.lastUpdated.toISOString() : null
      });
      fs.writeFileSync(CACHE_FILE, data, 'utf8');
    } catch (err) {
      console.error('[ExchangeRateService] Error guardando caché de tasa cambiaria:', err);
    }
  }

  private static loadFromCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (data.rate && typeof data.rate === 'number') {
          this.currentRate = data.rate;
          this.lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : null;
          console.log(`[ExchangeRateService] Cargada tasa desde caché: $1 = Bs. ${this.currentRate}`);
        }
      }
    } catch (err) {
      console.error('[ExchangeRateService] Error cargando caché de tasa cambiaria:', err);
    }
  }

  private static fetchFromDolarApi(): Promise<number> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 've.dolarapi.com',
        path: '/v1/dolares/oficial',
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 8000
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(body);
              if (data && data.promedio) {
                resolve(data.promedio);
              } else {
                reject(new Error('Formato de DolarApi no válido'));
              }
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`DolarApi respondió con código: ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('DolarApi timeout'));
      });
      req.end();
    });
  }

  private static scrapeBcvWebsite(): Promise<number> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.bcv.org.ve',
        path: '/',
        method: 'GET',
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        timeout: 12000,
        rejectUnauthorized: false // Ignorar problemas de SSL del sitio web del BCV
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
            try {
              // Regex para buscar el valor del dólar en el HTML oficial del BCV
              // ej: <div id="dolar"> ... <strong class="strong-tb"> 36,4500 </strong> ... </div>
              const dollarMatch = body.match(/id="dolar"[\s\S]*?<strong[^>]*?>\s*([\d,.]+)\s*<\/strong>/i);
              if (dollarMatch && dollarMatch[1]) {
                const parsedVal = parseFloat(dollarMatch[1].replace(/\s/g, '').replace(',', '.'));
                if (!isNaN(parsedVal) && parsedVal > 0) {
                  resolve(parsedVal);
                } else {
                  reject(new Error('El valor del dólar extraído no es numérico'));
                }
              } else {
                reject(new Error('No se encontró el elemento id="dolar" con el valor strong en el HTML'));
              }
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`BCV respondió con código: ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('BCV timeout'));
      });
      req.end();
    });
  }
}
