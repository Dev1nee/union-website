const boldRegex = /(\*\*).+(\*\*)/g;

let ws = null;
let selectedServer = null;
let emojiShorthandMap = null;

window.onload = requestUsername;

function requestUsername() {
    const username = prompt('Please enter your Union username');

    if (username.length === 0) {
        return requestUsername();
    } else {
        requestPassword(username);
    }
}

function requestPassword(username) {
    const password = prompt('Please enter your Union password');

    if (password.length === 0) {
        return requestPassword(username);
    } else {
        connect(username, password);
    }
}

function connect(username, password) {
    ws = new WebSocket('ws://union.serux.pro:2082');
    ws.onopen = () => authenticateClient(username, password); // Stupid JS Websocket doesn't support headers REEEEEEEEE
    ws.onclose = handleWSClose;
    ws.onmessage = handleWSMessage;

    emojiShorthandMap = (() => {
        const request = new XMLHttpRequest();
        request.open('GET', 'https://api.github.com/gists/73bed98674c11764971a9f021a677fc7', false);
        request.send(null);

        if (request.status !== 200) {
            return; // todo: report err
        }

        const data = JSON.parse(request.responseText);
        return JSON.parse(data.files['ass.json'].content);
    })();
}

function authenticateClient(username, password) {
    const b64 = btoa(`${username}:${password}`); // Encode to base64
    ws.send(`Basic ${b64}`);
}

function handleWSClose(close) {
    alert(`Disconnected from Union (${close.code}): ${close.reason}`);
}

function parseText (text) {
    const filtered = text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace('\r\n', '<br>').replace(/\n/g, '<br>');

    const emojisInText = text.match(/:\w+:/g);
    if (emojisInText) {
        for (const emoji of emojisInText) {
            let src;

            if (emojis.has(emoji)) {
                src = emojis.get(emoji);
            } else if (emojiShorthandMap[emoji]) {
                src = `./emoji/${emojiShorthandMap[emoji]}.svg`
            }

            text = text.replace(emoji, `<img src="${src}">`);
        }
    }

    return text;
}

function handleWSMessage(message) {
    try {
        const j = JSON.parse(message.data);

        if (j.op === 1) {
            const chatbox = document.getElementById('whatthefuckdidyoujustsayaboutme');
            chatbox.addEventListener('keydown', snedMeHarder);

            j.d.forEach(server => {
                const s = document.createElement('div');
                s.setAttribute('class', 'server');
                s.setAttribute('server-id', server.id);
                s.setAttribute('server-name', server.name);

                const icon = document.createElement('img');
                icon.setAttribute('src', server.iconUrl);

                icon.addEventListener('click', () => switchServer(s));

                s.appendChild(icon);

                document.getElementById('servers').appendChild(s);
            });
        }

        if (j.op === 3) {
            const messageContent = document.createElement('div');
            messageContent.innerHTML = parseText(j.d.content);

            const allMessages = document.querySelectorAll('.message');
            const lastMessage = allMessages[allMessages.length - 1];

            if (lastMessage && lastMessage.querySelector('h2').innerHTML === j.d.author) {
                lastMessage.appendChild(messageContent);
            } else {
                const m = document.createElement('div');
                m.setAttribute('class', 'message');
    
                const author = document.createElement('h2');
                author.innerText = j.d.author;
    
    
                m.appendChild(author);
                m.appendChild(messageContent);
    
                const container = document.getElementById('message-container');
                container.appendChild(m);
                container.scrollTop = container.scrollHeight;
            }
        }
    } catch(e) {
        console.log(e);
    }
}

function snedMeHarder(event) {
    const elemelon = document.getElementById('whatthefuckdidyoujustsayaboutme');
    const msg = elemelon.value.trim();

    if (event.keyCode === 13 && !event.shiftKey) {
        event.preventDefault();
        if (ws !== null && ws.readyState === WebSocket.OPEN && msg.length > 0) {
            ws.send(JSON.stringify({
                op: 8,
                d: {
                    server: 1,
                    content: msg
                }
            }));
            elemelon.value = '';
        }
    }
}

function switchServer(server) {
    const chatbox = document.getElementById('whatthefuckdidyoujustsayaboutme');
    const id = server.getAttribute('server-id');
    const name = server.getAttribute('server-name');
    selectedServer = Number(id);

    chatbox.removeAttribute('readonly');
    chatbox.setAttribute('placeholder', `Message ${name}...`);
}

const emojis = new Map([
    [':thinkman:', 'https://cdn.discordapp.com/emojis/427561917989650444.png?v=1'],
    [':sad:', 'https://cdn.discordapp.com/emojis/409499960128569346.png?v=1'],
    [':eyes:', 'https://canary.discordapp.com/assets/ccf4c733929efd9762ab02cd65175377.svg'],
    [':mmspin:', 'https://cdn.discordapp.com/emojis/422820729042763777.gif?v=1']
]);
