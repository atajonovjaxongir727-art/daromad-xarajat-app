import axios from 'axios';

/**
 * Render.com Free tier 15 daqiqadan so'ng serverni 'uxlatib' (spin down) qo'ymasligi uchun
 * har 10 daqiqada o'zining tashqi URL manziliga so'rov yuborib turuvchi xizmat.
 */
export function startKeepAliveService() {
  const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;

  if (!externalUrl) {
    console.log('ℹ️ [Keep-Alive] RENDER_EXTERNAL_URL topilmadi. Server lokal rejimda ishlamoqda.');
    return;
  }

  const pingUrl = `${externalUrl.replace(/\/$/, '')}/api/health`;
  console.log(`⏱️ [Keep-Alive] Xizmat ishga tushdi: har 10 daqiqada ${pingUrl} ping qilinadi.`);

  // Dastlabki ping (server ishga tushgandan 1 daqiqa o'tib)
  setTimeout(async () => {
    try {
      await axios.get(pingUrl, { timeout: 15000 });
      console.log(`💓 [Keep-Alive] Dastlabki ping muvaffaqiyatli: ${pingUrl}`);
    } catch (e: any) {
      console.warn(`⚠️ [Keep-Alive] Dastlabki pingda ogohlantirish: ${e.message}`);
    }
  }, 60 * 1000);

  // Har 10 daqiqada (600,000 ms) muntazam ping yuborish
  setInterval(async () => {
    try {
      const res = await axios.get(pingUrl, { timeout: 15000 });
      const now = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
      console.log(`💓 [Keep-Alive] Server faol saqlandi (${now}), status: ${res.status}`);
    } catch (err: any) {
      console.warn(`⚠️ [Keep-Alive] Ping xatosi: ${err.message}`);
    }
  }, 10 * 60 * 1000);
}
