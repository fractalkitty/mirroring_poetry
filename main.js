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
        const wordElement = createWordElement(word, remainingWords, selectedWords);
        wordsContainer.appendChild(wordElement);
    });

    return { selectedWords, remainingWords };
};

const addEventListeners = (board, boardPadding, mirrorBoard, wordsContainer, selectedWords, remainingWords) => {
    board.addEventListener('dragover', event => event.preventDefault());
    board.addEventListener('drop', event => handleDrop(event, boardPadding, board, mirrorBoard, wordsContainer, selectedWords, remainingWords));

    addButtonListeners('download-button', () => downloadBoardAsImage(board));
    addButtonListeners('reset-button', () => {
        resetBoard(board, mirrorBoard);
        ({ selectedWords, remainingWords } = initializeWords(wordsContainer, 15));  // reinitialize words
    });

    addButtonListeners('download-button2', downloadMirroredBoardAsImage);
};

const createWordElement = (text, remainingWords, selectedWords, isOnBoard = false) => {
    const wordElement = document.createElement('div');
    wordElement.classList.add('word');
    wordElement.textContent = text;
    wordElement.setAttribute('draggable', 'true');
    wordElement.style.zIndex = 10;

    wordElement.addEventListener('dragstart', handleDragStart);
    wordElement.addEventListener('dragend', handleDragEnd);

    if (!isOnBoard) {
        wordElement.addEventListener('dblclick', () => handleDoubleClickInPool(wordElement, remainingWords, selectedWords));
    } else {
        wordElement.addEventListener('dblclick', () => {
            removeWordElement(wordElement);
            updateMirrorBoard(document.getElementById('board'), document.getElementById('mirror-board-container'));
        });
    }

    addTouchEventListeners(wordElement, remainingWords, selectedWords, isOnBoard);

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
    const wordElement = createWordElement(text, remainingWords, selectedWords, true);

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

    wordElement.addEventListener('dblclick', () => {
        removeWordElement(wordElement);
        updateMirrorBoard(board, mirrorBoard);
    });
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

            document.body.appendChild(link);
            link.click();

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

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }).catch(console.error);
};

const resetBoard = (boardElement, mirrorBoard) => {
    // Clear the board
    while (boardElement.firstChild) {
        boardElement.removeChild(boardElement.firstChild);
    }

    // Clear the words container
    const wordsContainer = document.getElementById('words');
    while (wordsContainer.firstChild) {
        wordsContainer.removeChild(wordsContainer.firstChild);
    }

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

const handleDoubleClickInPool = (wordElement, remainingWords, selectedWords) => {
    const parentElement = wordElement.parentElement;
    if (parentElement && parentElement.id === 'words' && remainingWords.length > 0) {
        const oldWord = wordElement.textContent;
        const newWord = remainingWords.shift();
        wordElement.textContent = newWord;
        remainingWords.push(oldWord);

        // Update the selectedWords array to reflect the change
        const wordIndex = Array.from(parentElement.children).indexOf(wordElement);
        if (wordIndex !== -1) {
            selectedWords[wordIndex] = newWord;
        }
    }
};

const addTouchEventListeners = (wordElement, remainingWords, selectedWords, isOnBoard) => {
    let lastTap = 0;

    wordElement.addEventListener('touchstart', (event) => handleTouchStart(event, wordElement, isOnBoard));
    wordElement.addEventListener('touchmove', handleTouchMove);
    wordElement.addEventListener('touchend', (event) => handleTouchEnd(event, wordElement, remainingWords, selectedWords, isOnBoard));

    if (isOnBoard) {
        wordElement.addEventListener('touchend', (event) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                removeWordElement(wordElement);
                updateMirrorBoard(document.getElementById('board'), document.getElementById('mirror-board'));
            }
            lastTap = currentTime;
        });
    } else {
        wordElement.addEventListener('touchend', (event) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                handleDoubleClickInPool(wordElement, remainingWords, selectedWords);
            }
            lastTap = currentTime;
        });
    }
};

const handleTouchStart = (event, wordElement, isOnBoard) => {
    const touch = event.targetTouches[0];
    const offsetX = touch.clientX - event.target.getBoundingClientRect().left;
    const offsetY = touch.clientY - event.target.getBoundingClientRect().top;
    wordElement.__offsetX = offsetX;
    wordElement.__offsetY = offsetY;
    wordElement.__initialTouchX = touch.clientX;
    wordElement.__initialTouchY = touch.clientY;
    wordElement.__cloneCreated = false;
    wordElement.__singleTap = true; // Assume single tap initially
    if (isOnBoard) {
        event.preventDefault();
    }
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
        original.__singleTap = false; // Detected movement, so it's not a single tap
    }

    if (original.__cloneCreated) {
        const clone = original.__clone;
        clone.style.left = `${touch.pageX - original.__offsetX}px`;
        clone.style.top = `${touch.pageY - original.__offsetY}px`;
    }
};

const handleTouchEnd = (event, wordElement, remainingWords, selectedWords, isOnBoard) => {
    const original = event.target;
    const clone = original.__clone;

    if (original.__singleTap) {
        // If it was a single tap, ignore to prevent unnecessary actions
        return;
    }

    if (clone) {
        const board = document.getElementById('board');
        const { left, top } = board.getBoundingClientRect();
        const cloneRect = clone.getBoundingClientRect();
        const dropX = cloneRect.left - left - 3;
        const dropY = cloneRect.top - top - 3;

        let x = dropX;
        let y = dropY;

        // Ensure the word is fully within the board's boundaries
        const wordWidth = clone.offsetWidth;
        const wordHeight = clone.offsetHeight;
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x + wordWidth > board.clientWidth) x = board.clientWidth - wordWidth;
        if (y + wordHeight > board.clientHeight) y = board.clientHeight - wordHeight;

        if (x >= 0 && y >= 0 && x + wordWidth <= board.clientWidth && y + wordHeight <= board.clientHeight) {
            const newWordElement = createWordElement(original.innerText, remainingWords, selectedWords, true);
            newWordElement.style.position = 'absolute';
            newWordElement.style.left = `${x}px`;
            newWordElement.style.top = `${y}px`;
            board.appendChild(newWordElement);
            updateMirrorBoard(board, document.getElementById('mirror-board'));

            if (original.parentElement.id === 'words' && remainingWords.length > 0) {
                const newWord = remainingWords.shift();
                const wordIndex = Array.from(original.parentElement.children).indexOf(original);
                if (wordIndex !== -1) {
                    original.parentElement.children[wordIndex].textContent = newWord;
                    selectedWords[wordIndex] = newWord;
                }
            }
        }

        clone.remove();
        original.__cloneCreated = false;
    }

    if (isOnBoard) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - original.__lastTapTime;
        if (tapLength < 500 && tapLength > 0) {
            removeWordElement(wordElement);
            updateMirrorBoard(document.getElementById('board'), document.getElementById('mirror-board'));
        }
        original.__lastTapTime = currentTime;
    }
};




const removeWordElement = (wordElement) => {
    if (wordElement.parentElement) {
        wordElement.parentElement.removeChild(wordElement);
    }
};



const updateMirrorBoard = (board, mirrorBoard) => {
    // Clear the mirror board
    mirrorBoard.innerHTML = '';

    // Clone the board content
    Array.from(board.children).forEach(child => {
        const clonedChild = child.cloneNode(true);
        mirrorBoard.appendChild(clonedChild);
    });

    // Ensure all styles are copied over
    const originalStyles = window.getComputedStyle(board);
    for (let style of originalStyles) {
        mirrorBoard.style[style] = originalStyles[style];
    }

    // Remove dragging class if present
    const draggedElement = mirrorBoard.querySelector('.dragging');
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }
};