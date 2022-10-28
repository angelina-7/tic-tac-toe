let username = '';
let symbol = '';
let socket = null;

const combinations = [
    ['00', '01', '02'],
    ['10', '11', '12'],
    ['20', '21', '22'],
    ['00', '10', '20'],
    ['01', '11', '21'],
    ['02', '12', '22'],
    ['00', '11', '22'],
    ['02', '11', '20']
];

const chat = document.getElementById('chat');
const alertText = document.querySelector('.alert');

document.getElementById('init-form').addEventListener('submit', onSubmit);

document.getElementById('chat-btn').addEventListener('click', sendMessage)

function onSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const roomId = formData.get('room');
    username = formData.get('username');

    if(roomId && username){
        init(roomId, username);
    } else {
        alertText.style.display = "block";
        alertText.textContent = "All fields must be filled."
    }
}

function sendMessage(event) {
    const chatInput = document.getElementById('chat-input');
    socket.emit('message', {username, msg: chatInput.value})

    chatInput.value = "";
}

function init(roomId, username) {
    socket = io();

    socket.on('connect', () => {
        socket.emit('selectRoom', roomId, username);
    });
    socket.on('welcome', msg => {
        chat.parentElement.style.display = 'inline-block';
        chat.textContent += msg + "\n";
    })

    socket.on('symbol', newSymbol => {
        symbol = newSymbol;
        startGame();
    });

    socket.on('newGame', newGame);
    socket.on('position', place);
    socket.on('message', displayMessage)

    socket.on('error', (error) => alert(error));
}

function displayMessage(data) {
    chat.textContent += `${data.username}: ${data.msg}\n`;
}


function startGame() {
    socket.emit('message', { username, msg: `playing with ${symbol}` });
    document.getElementById('init').style.display = 'none';
    alertText.style.display = "none";
    const board = document.getElementById('board');
    board.style.display = 'block';

    board.addEventListener('click', onClick);
}

function newGame() {
    chat.textContent += "New Game started\n";
    [...document.querySelectorAll('.cell')].forEach(e => e.textContent = '');
}

function onClick(event) {
    if (event.target.classList.contains('cell')) {
        if (event.target.textContent == '') {
            const id = event.target.id;
            console.log(id);
            socket.emit('position', {
                id,
                symbol
            })
        }
    }
}

function place({ id, symbol }) {
    document.getElementById(id).textContent = symbol;
    setTimeout(hasCombination, 0);
}

function hasCombination() {
    for (const combination of combinations) {
        const result = combination.map(pos => document.getElementById(pos).textContent).join('');
        if (result == 'XXX') {
            return endGame('X')
        } else if (result == 'OOO') {
            return endGame('O');
        }
    }
}

function endGame(winner) {
    const choice = confirm(`Player ${winner} wins!\nDo you want a rematch?`);
    if (choice) {
        socket.emit('newGame');
    }
}