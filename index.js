const WebSocket = require('ws');
const net = require('net');
const iconv = require('iconv-lite');
const AnsiToHtml = require('ansi-to-html');
const ansiToHtml = new AnsiToHtml({
	escapeXML: true,
	stream: true,
});

const WS_PORT = 3000; // Port for WebSocket server
const WS_HOST = '0.0.0.0';

const wss = new WebSocket.Server({ port: WS_PORT, host: WS_HOST });
// const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws) => {
	console.log('WebSocket client connected');
	let mudSocket = null;

	ws.once('message', (msg) => {
		// Expect: { address, port, encoding }
		let profile;
		try {
			profile = JSON.parse(msg);
		} catch {
			ws.close();
			return;
		}
		const encoding = profile.encoding || 'utf8';
		mudSocket = net.createConnection(
			{ host: profile.address, port: Number(profile.port) },
			() => ws.send('[INFO] Connected to MUD server')
		);

		// Forward data from MUD to WebSocket
		mudSocket.on('data', (data) => {
			try {
				// Decode using selected encoding, then convert ANSI codes to HTML
				const decodedData = iconv.decode(data, encoding);
				const htmlData = ansiToHtml.toHtml(decodedData);
				ws.send(htmlData);
			} catch (err) {
				console.error('Error decoding MUD data:', err);
				ws.send(`[ERROR] Failed to decode MUD data: ${err.message}`);
			}
		});

		mudSocket.on('close', () => {
			ws.close();
			console.log('MUD connection closed');
		});

		mudSocket.on('error', (err) => {
			ws.send(`[MUD ERROR] ${err.message}`);
			ws.close();
			console.error('MUD socket error:', err);
		});

		// Forward data from WebSocket to MUD
		ws.on('message', (message) => {
			try {
				// Ensure the message is properly encoded before sending to MUD
				const encodedMessage = Buffer.from(message.toString(), 'utf8');
				mudSocket.write(encodedMessage);
			} catch (err) {
				console.error('Error encoding message:', err);
				ws.send(`[ERROR] Failed to encode message: ${err.message}`);
			}
		});

		ws.on('close', () => {
			mudSocket.end();
			console.log('WebSocket client disconnected');
		});

		ws.on('error', (err) => {
			mudSocket.end();
			console.error('WebSocket error:', err);
		});
	});
});

console.log(`WebSocket-to-TCP proxy running on ws://${WS_HOST}:${WS_PORT}`);
