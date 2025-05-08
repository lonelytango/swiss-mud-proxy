const WebSocket = require('ws');
const net = require('net');
const iconv = require('iconv-lite');
const AnsiToHtml = require('ansi-to-html');
const ansiToHtml = new AnsiToHtml();

const WS_PORT = 4000; // Port for WebSocket server
// const MUD_HOST = 'www.fy-vi.cn';
// const MUD_PORT = 6666;

const wss = new WebSocket.Server({ port: WS_PORT });
// const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws) => {
	console.log('WebSocket client connected');
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

		// Forward data from MUD to WebSocket
		mudSocket.on('data', (data) => {
			try {
				// Decode as GBK, then convert ANSI codes to HTML
				const decodedData = iconv.decode(data, 'gbk');
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

console.log(`WebSocket-to-TCP proxy running on ws://localhost:${WS_PORT}`);
