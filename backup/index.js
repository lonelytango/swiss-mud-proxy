const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const net = require('net');
const iconv = require('iconv-lite');
const AnsiToHtml = require('ansi-to-html');
const ansiToHtml = new AnsiToHtml();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../dist'))); // or build

// Fallback to index.html for SPA
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// WebSocket proxy logic
wss.on('connection', (ws) => {
	let mudSocket = null;
	let profileReceived = false;

	ws.once('message', (msg) => {
		// Expect: { address, port }
		let profile;
		try {
			profile = JSON.parse(msg);
		} catch {
			ws.close();
			return;
		}
		mudSocket = net.createConnection(
			{ host: profile.address, port: Number(profile.port) },
			() => ws.send('[INFO] Connected to MUD server')
		);

		mudSocket.on('data', (data) => {
			const decoded = iconv.decode(data, 'gbk');
			const html = ansiToHtml.toHtml(decoded);
			ws.send(html);
		});

		mudSocket.on('close', () => ws.close());
		mudSocket.on('error', (err) => ws.send(`[MUD ERROR] ${err.message}`));

		ws.on('message', (message) => {
			// Ignore the first message (profile)
			if (!profileReceived) {
				profileReceived = true;
				return;
			}
			// Ensure the message is properly encoded before sending to MUD
			const encodedMessage = Buffer.from(message.toString(), 'utf8');
			mudSocket.write(encodedMessage);
		});

		ws.on('close', () => {
			mudSocket.end();
			console.log('WebSocket client disconnected');
		});

		ws.on('error', () => {
			mudSocket.end();
			console.error('WebSocket error:', err);
		});
	});
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
