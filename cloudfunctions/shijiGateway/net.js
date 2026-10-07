const https = require('https');
module.exports = function request(url, { method = 'GET', body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    if (u.protocol !== 'https:') return reject(Error('HTTPS_REQUIRED'));
    const req = https.request(u, {
      method,
      headers: { ...headers, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      timeout: 20000
    }, res => {
      let data = '', size = 0;
      res.on('error', () => reject(Error('UPSTREAM_UNAVAILABLE')));
      res.on('aborted', () => reject(Error('UPSTREAM_UNAVAILABLE')));
      res.on('data', chunk => {
        size += chunk.length;
        if (size > 1500000) {
          reject(Error('RESPONSE_TOO_LARGE'));
          res.destroy();
          return;
        }
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(Error('UPSTREAM_UNAVAILABLE'));
        try { resolve(JSON.parse(data)); } catch { reject(Error('INVALID_JSON')); }
      });
    });
    req.on('timeout', () => req.destroy(Error('UPSTREAM_TIMEOUT')));
    req.on('error', () => reject(Error('UPSTREAM_UNAVAILABLE')));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};
