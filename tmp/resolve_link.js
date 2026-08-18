const https = require('https');

function resolveUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      console.log('STATUS:', res.statusCode);
      console.log('LOCATION:', res.headers.location);
      if (res.headers.location) {
        resolve(res.headers.location);
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ body: data, headers: res.headers }));
      }
    });
    req.on('error', reject);
  });
}

async function run() {
  let url = 'https://share.google/VGXKDMtikeDYt2Lcn';
  console.log('Resolving', url);
  let res = await resolveUrl(url);
  console.log('Step 1:', res);
  if (typeof res === 'string') {
    let nextRes = await resolveUrl(res.startsWith('http') ? res : 'https://www.google.com' + res);
    console.log('Step 2:', nextRes);
  }
}

run().catch(console.error);
