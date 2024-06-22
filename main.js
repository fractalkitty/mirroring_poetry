document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const wordsContainer = document.getElementById('words');
    const mirrorBoard = document.getElementById('mirror-board');
    const boardPadding = parseFloat(window.getComputedStyle(board).paddingLeft) / 2 - 6;

    let { selectedWords, remainingWords } = initializeWords(wordsContainer, 15);
    addEventListeners(board, boardPadding, mirrorBoard, wordsContainer, selectedWords, remainingWords);
});

const initializeWords = (wordsContainer, count) => {
    const shuffledWords = shuffleArray(words);
    const selectedWords = shuffledWords.slice(0, count);
    const remainingWords = shuffledWords.slice(count);

    selectedWords.forEach(word => {
        const wordElement = createWordElement(word);
        wordsContainer.appendChild(wordElement);
    });

    return { selectedWords, remainingWords };
};

const addEventListeners = (board, boardPadding, mirrorBoard, wordsContainer, selectedWords, remainingWords) => {
    board.addEventListener('dragover', event => event.preventDefault());
    board.addEventListener('drop', event => handleDrop(event, boardPadding, board, mirrorBoard, wordsContainer, selectedWords, remainingWords));

    addButtonListeners('download-button', () => downloadBoardAsImage(board));
    addButtonListeners('reset-button', () => resetBoard(board, mirrorBoard));


    addButtonListeners('download-button2', downloadMirroredBoardAsImage);

};

const createWordElement = (text) => {
    const wordElement = document.createElement('div');
    wordElement.classList.add('word');
    wordElement.textContent = text;
    wordElement.setAttribute('draggable', 'true');
    wordElement.style.zIndex = 10;

    wordElement.addEventListener('dragstart', handleDragStart);
    wordElement.addEventListener('dragend', handleDragEnd);
    wordElement.addEventListener('dblclick', handleDoubleClick);
    addTouchEventListeners(wordElement);

    return wordElement;
};

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const handleDrop = (event, boardPadding, board, mirrorBoard, wordsContainer, selectedWords, remainingWords) => {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData('text/plain'));
    const { text, offsetX, offsetY } = data;
    const { left, top } = board.getBoundingClientRect();
    const wordElement = createWordElement(text);

    wordElement.style.position = 'absolute';
    wordElement.style.left = `${event.clientX - left - offsetX - boardPadding}px`;
    wordElement.style.top = `${event.clientY - top - offsetY - boardPadding}px`;

    board.appendChild(wordElement);
    updateMirrorBoard(board, mirrorBoard);

    if (remainingWords.length > 0) {
        const newWord = remainingWords.shift();
        const wordIndex = selectedWords.indexOf(text);
        if (wordIndex !== -1) {
            selectedWords[wordIndex] = newWord;
            wordsContainer.children[wordIndex].textContent = newWord;
        }
    }

    wordElement.addEventListener('dblclick', handleDoubleClick);
};

const downloadBoardAsImage = (boardElement) => {
    const words = boardElement.querySelectorAll('.word');
    words.forEach(word => word.style.zIndex = 1);

    html2canvas(boardElement, { scale: 10 }).then(canvas => {
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'poem.png';

            // Append link to body and trigger download
            document.body.appendChild(link);
            link.click();

            // Clean up and revoke object URL after download
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }).catch(console.error);

    words.forEach(word => word.style.zIndex = 10);
};

const downloadMirroredBoardAsImage = () => {
    const mirrorBoardContainer = document.getElementById('mirror-board-container');
    html2canvas(mirrorBoardContainer, { scale: 10 }).then(canvas => {
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'mirror_poem.png';

            // Append link to body and trigger download
            document.body.appendChild(link);
            link.click();

            // Clean up and revoke object URL after download
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }).catch(console.error);
};

const resetBoard = (boardElement, mirrorBoard) => {
    while (boardElement.firstChild) boardElement.removeChild(boardElement.firstChild);
    updateMirrorBoard(boardElement, mirrorBoard);
};



const addButtonListeners = (buttonId, callback) => {
    const button = document.getElementById(buttonId);
    if (button) {
        button.addEventListener('click', callback);
        button.addEventListener('touchend', event => {
            event.preventDefault();
            callback();
        });
    }
};

const handleDragStart = (event) => {
    const rect = event.target.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    event.dataTransfer.setData('text/plain', JSON.stringify({ text: event.target.innerText, offsetX, offsetY }));
    event.target.style.zIndex = 1000;
    event.target.classList.add('dragging');
};

const handleDragEnd = (event) => {
    event.target.style.zIndex = 10;
    event.target.classList.remove('dragging');
};

const handleDoubleClick = (event) => {
    const wordElement = event.target;
    if (wordElement.parentNode && wordElement.parentNode.id !== 'words') {
        wordElement.remove();
        updateMirrorBoard(document.getElementById('board'), document.getElementById('mirror-board'));
    }
};

const addTouchEventListeners = (wordElement) => {
    let lastTap = 0;

    wordElement.addEventListener('touchstart', handleTouchStart);
    wordElement.addEventListener('touchmove', handleTouchMove);
    wordElement.addEventListener('touchend', handleTouchEnd);

    wordElement.addEventListener('touchend', (event) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 500 && tapLength > 0 && wordElement.parentNode && wordElement.parentNode.id !== 'words') {
            wordElement.remove();
            updateMirrorBoard(document.getElementById('board'), document.getElementById('mirror-board'));
        }
        lastTap = currentTime;
    });
};

const handleTouchStart = (event) => {
    const touch = event.targetTouches[0];
    const offsetX = touch.clientX - event.target.getBoundingClientRect().left;
    const offsetY = touch.clientY - event.target.getBoundingClientRect().top;
    const original = event.target;
    original.__offsetX = offsetX;
    original.__offsetY = offsetY;
    original.__initialTouchX = touch.clientX;
    original.__initialTouchY = touch.clientY;
    original.__cloneCreated = false;
    event.preventDefault();
};

const handleTouchMove = (event) => {
    event.preventDefault();
    const touch = event.targetTouches[0];
    const original = event.target;

    if (!original.__cloneCreated && (Math.abs(touch.clientX - original.__initialTouchX) > 10 || Math.abs(touch.clientY - original.__initialTouchY) > 10)) {
        const clone = original.cloneNode(true);
        clone.classList.add('dragging');
        clone.style.position = 'absolute';
        clone.style.zIndex = 100;
        clone.style.pointerEvents = 'none';
        clone.style.left = `${touch.pageX - original.__offsetX}px`;
        clone.style.top = `${touch.pageY - original.__offsetY}px`;
        document.body.appendChild(clone);
        original.__clone = clone;
        original.__cloneCreated = true;
    }

    if (original.__cloneCreated) {
        const clone = original.__clone;
        clone.style.left = `${touch.pageX - original.__offsetX}px`;
        clone.style.top = `${touch.pageY - original.__offsetY}px`;
    }
};

const handleTouchEnd = (event) => {
    const original = event.target;
    const clone = original.__clone;

    if (clone) {
        const board = document.getElementById('board');
        const mirrorBoard = document.getElementById('mirror-board');
        const { left, top, width, height } = board.getBoundingClientRect();
        const dropX = parseFloat(clone.style.left) - left;
        const dropY = parseFloat(clone.style.top) - top;

        if (dropX >= 0 && dropY >= 0 && dropX <= width && dropY <= height) {
            const wordElement = createWordElement(original.innerText);
            wordElement.style.position = 'absolute';
            wordElement.style.left = `${dropX}px`;
            wordElement.style.top = `${dropY}px`;
            board.appendChild(wordElement);
            updateMirrorBoard(board, mirrorBoard);

            const remainingWords = Array.from(document.getElementById('words').children).map(child => child.textContent);
            const selectedWords = Array.from(document.getElementById('board').children).map(child => child.textContent);

            if (remainingWords.length > 0) {
                const newWord = remainingWords.shift();
                const wordIndex = selectedWords.indexOf(original.innerText);
                if (wordIndex !== -1) {
                    selectedWords[wordIndex] = newWord;
                    document.getElementById('words').children[wordIndex].textContent = newWord;
                }
            }

            wordElement.addEventListener('dblclick', handleDoubleClick);
        }

        clone.remove();
        original.__cloneCreated = false;
    }
};

const updateMirrorBoard = (board, mirrorBoard) => {
    mirrorBoard.innerHTML = board.innerHTML;
};
