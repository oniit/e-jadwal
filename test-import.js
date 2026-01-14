const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const filePath = path.join(__dirname, 'data-aset-sample.xlsx');

if (!fs.existsSync(filePath)) {
    console.error('❌ File not found:', filePath);
    process.exit(1);
}

const fileBuffer = fs.readFileSync(filePath);
const boundary = '----' + Math.random().toString(36).substr(2, 9);
const CRLF = '\r\n';

// Build multipart body manually
const multipartBody = Buffer.concat([
    Buffer.from(`--${boundary}${CRLF}`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="data-aset-sample.xlsx"${CRLF}`),
    Buffer.from(`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet${CRLF}${CRLF}`),
    fileBuffer,
    Buffer.from(`${CRLF}--${boundary}--${CRLF}`)
]);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/assets/import/excel',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipartBody.length
    }
};

console.log('📤 Uploading file...');
console.log('📁 File:', path.basename(filePath));
console.log('📦 Size:', (fileBuffer.length / 1024).toFixed(2), 'KB');
console.log('📍 Target: http://localhost:3000/api/assets/import/excel\n');

const req = http.request(options, (res) => {
    let data = '';

    console.log('📥 Status:', res.statusCode);
    console.log('📥 Headers:', res.headers, '\n');

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log('✅ Success!\n');
            console.log(JSON.stringify(result, null, 2));
        } catch (e) {
            console.log('📝 Response:\n', data);
        }
        process.exit(0);
    });
});

req.on('error', (err) => {
    console.error('❌ Error:', err.message || err.code);
    process.exit(1);
});

req.on('timeout', () => {
    console.error('❌ Request timeout');
    req.destroy();
    process.exit(1);
});

req.setTimeout(10000);
req.write(multipartBody);
req.end();
