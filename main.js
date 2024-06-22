document.addEventListener('DOMContentLoaded', function () {
    // Shuffle words and select the first 15
    const shuffledWords = shuffleArray(words);
    let selectedWords = shuffledWords.slice(0, 15);
    let remainingWords = shuffledWords.slice(15);

    const wordsContainer = document.getElementById('words');
    selectedWords.forEach(word => {
        const wordElement = createWordElement(word);
        wordsContainer.appendChild(wordElement);
    });

    const board = document.getElementById('board');
    const mirrorBoard = document.getElementById('mirror-board'); // Mirror board container
    const boardPadding = parseFloat(window.getComputedStyle(board).paddingLeft) / 2; // Use half the padding

    board.addEventListener('dragover', function (event) {
        event.preventDefault();
    });

    board.addEventListener('drop', function (event) {
        event.preventDefault();
        handleDrop(event, boardPadding);
    });

    const downloadButton = document.getElementById('download-button');
    downloadButton.addEventListener('click', function () {
        downloadBoardAsImage(board);
    });

    downloadButton.addEventListener('touchend', function (event) {
        event.preventDefault();
        downloadBoardAsImage(board);
    });

    const resetButton = document.getElementById('reset-button');
    resetButton.addEventListener('click', function () {
        resetBoard(board);
    });

    const shareButton = document.getElementById('share-button');
    shareButton.addEventListener('click', function () {
        shareBoard(board);
    });

    // Event listeners for the new set of buttons
    const downloadButton2 = document.getElementById('download-button2');
    if (downloadButton2) {
        downloadButton2.addEventListener('click', function () {
            downloadMirroredBoardAsImage();
        });

        downloadButton2.addEventListener('touchend', function (event) {
            event.preventDefault();
            downloadMirroredBoardAsImage();
        });
    }



    const shareButton2 = document.getElementById('share-button2');
    if (shareButton2) {
        shareButton2.addEventListener('click', function () {
            shareMirroredBoard();
        });
    }

    function createWordElement(text) {
        const wordElement = document.createElement('div');
        wordElement.classList.add('word');
        wordElement.textContent = text;
        wordElement.setAttribute('draggable', 'true');
        wordElement.style.zIndex = 10; // Ensure words are above other elements

        wordElement.addEventListener('dragstart', function (event) {
            event.target.classList.add('dragging');
            const rect = event.target.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const offsetY = event.clientY - rect.top;
            event.dataTransfer.setData('text/plain', JSON.stringify({
                text: event.target.innerText,
                offsetX,
                offsetY
            }));
            event.target.style.zIndex = 1000; // Bring to front while dragging
        });

        wordElement.addEventListener('dragend', function (event) {
            event.target.classList.remove('dragging');
            event.target.style.zIndex = 10; // Reset z-index after dragging
        });

        wordElement.addEventListener('touchstart', function (event) {
            handleTouchStart(event);
        });

        wordElement.addEventListener('touchmove', function (event) {
            handleTouchMove(event);
        });

        wordElement.addEventListener('touchend', function (event) {
            handleTouchEnd(event);
        });

        wordElement.addEventListener('dblclick', function () {
            if (wordElement.parentNode && wordElement.parentNode.id !== 'words') { // Prevent deletion from the pool
                wordElement.remove();
                updateMirrorBoard(); // Update mirror board content
            }
        });

        // Add double-tap functionality for touch devices
        let lastTap = 0;
        wordElement.addEventListener('touchend', function (event) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0 && wordElement.parentNode && wordElement.parentNode.id !== 'words') { // Prevent deletion from the pool
                wordElement.remove();
                updateMirrorBoard(); // Update mirror board content
            }
            lastTap = currentTime;
        });

        return wordElement;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function handleDrop(event, boardPadding) {
        event.preventDefault();

        const boardRect = board.getBoundingClientRect();

        let data, text, offsetX, offsetY;

        if (event.dataTransfer) {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
            text = data.text;
            offsetX = data.offsetX;
            offsetY = data.offsetY;
        } else {
            text = event.target.innerText;
            offsetX = parseFloat(event.target.dataset.offsetX);
            offsetY = parseFloat(event.target.dataset.offsetY);
        }

        const boxShadowOffset = 2 / 2;

        const wordElement = createWordElement(text);
        wordElement.style.position = 'absolute';
        wordElement.style.zIndex = 10;
        const x = event.clientX - boardRect.left - offsetX - boardPadding + boxShadowOffset + 6;
        const y = event.clientY - boardRect.top - offsetY - boardPadding + boxShadowOffset + 6;
        wordElement.style.left = `${x}px`;
        wordElement.style.top = `${y}px`;
        board.appendChild(wordElement);

        updateMirrorBoard(); // Mirror board content

        if (remainingWords.length > 0) {
            const newWord = remainingWords.shift();
            const wordIndex = selectedWords.indexOf(text);
            if (wordIndex !== -1) {
                selectedWords[wordIndex] = newWord;
                wordsContainer.children[wordIndex].textContent = newWord;
            }
        }

        wordElement.addEventListener('dblclick', function () {
            if (wordElement.parentNode && wordElement.parentNode.id !== 'words') { // Prevent deletion from the pool
                wordElement.remove();
                updateMirrorBoard(); // Update mirror board content
            }
        });

        // Add double-tap functionality for touch devices
        let lastTap = 0;
        wordElement.addEventListener('touchend', function (event) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0 && wordElement.parentNode && wordElement.parentNode.id !== 'words') { // Prevent deletion from the pool
                wordElement.remove();
                updateMirrorBoard(); // Update mirror board content
            }
            lastTap = currentTime;
        });
    }

    function downloadBoardAsImage(boardElement) {
        // Temporarily reset z-index to capture the board correctly
        const words = boardElement.querySelectorAll('.word');
        words.forEach(word => {
            word.style.zIndex = 1;
        });

        // Capture the board as an image
        html2canvas(boardElement, { scale: 10 }).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'poem.png';
            link.click();

            // Restore z-index after capture
            words.forEach(word => {
                word.style.zIndex = 10;
            });
        }).catch(err => {
            console.error("Error capturing the board:", err);
        });
    }

    function resetBoard(boardElement) {
        while (boardElement.firstChild) {
            boardElement.removeChild(boardElement.firstChild);
        }
        updateMirrorBoard(); // Clear the mirrored board
    }

    function shareBoard(boardElement) {
        // Temporarily reset z-index to capture the board correctly
        const words = boardElement.querySelectorAll('.word');
        words.forEach(word => {
            word.style.zIndex = 1;
        });

        // Capture the board as an image
        html2canvas(boardElement, { scale: 10 }).then(canvas => {
            canvas.toBlob(blob => {
                const file = new File([blob], "poem.png", { type: "image/png" });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({
                        files: [file],
                        title: 'my poem',
                        text: 'Check out my poem!',
                    });
                } else {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(file);
                    link.download = 'poem.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    alert('Your browser does not support direct sharing. The image has been downloaded. Please share it manually.');
                }
            });

            // Restore z-index after capture
            words.forEach(word => {
                word.style.zIndex = 10;
            });
        }).catch(err => {
            console.error("Error capturing the board:", err);
        });
    }

    // Initialize lastTap for double-tap detection
    let lastTap = 0;

    function handleTouchStart(event) {
        const touch = event.targetTouches[0];
        const offsetX = touch.clientX - event.target.getBoundingClientRect().left;
        const offsetY = touch.clientY - event.target.getBoundingClientRect().top;

        const original = event.target;

        // Check for double-tap
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 500 && tapLength > 0) {
            if (original.parentNode && original.parentNode.id !== 'words') {
                original.remove();
                updateMirrorBoard(); // Update mirror board content
            }
            lastTap = 0; // reset lastTap
            return;
        }
        lastTap = currentTime;

        // Store touch data for future reference
        original.__offsetX = offsetX;
        original.__offsetY = offsetY;
        original.__initialTouchX = touch.clientX;
        original.__initialTouchY = touch.clientY;
        original.__cloneCreated = false;

        // Prevent default browser touch actions
        event.preventDefault();
    }

    function handleTouchMove(event) {
        event.preventDefault();
        const touch = event.targetTouches[0];
        const original = event.target;

        // Create clone if the touch has moved enough
        if (!original.__cloneCreated && (Math.abs(touch.clientX - original.__initialTouchX) > 10 || Math.abs(touch.clientY - original.__initialTouchY) > 10)) {
            const clone = original.cloneNode(true);
            clone.classList.add('dragging');
            clone.style.position = 'absolute';
            clone.style.zIndex = 100;
            clone.style.pointerEvents = 'none';
            clone.style.left = touch.pageX - original.__offsetX + 'px';
            clone.style.top = touch.pageY - original.__offsetY + 'px';
            document.body.appendChild(clone);
            original.__clone = clone;
            original.__cloneCreated = true;
        }

        if (original.__cloneCreated) {
            // Adjust clone position
            const clone = original.__clone;
            clone.style.left = touch.pageX - original.__offsetX + 'px';
            clone.style.top = touch.pageY - original.__offsetY + 'px';
        }
    }

    function handleTouchEnd(event) {
        const original = event.target;
        const clone = original.__clone;
        if (clone) {
            // Get the drop position
            const board = document.getElementById('board');
            const boardRect = board.getBoundingClientRect();
            const dropX = parseFloat(clone.style.left) - boardRect.left;
            const dropY = parseFloat(clone.style.top) - boardRect.top;

            // Check if the clone is within the board boundaries
            if (dropX >= 0 && dropY >= 0 && dropX <= boardRect.width && dropY <= boardRect.height) {
                // Create a new word element at the drop position
                const wordElement = createWordElement(original.innerText);
                wordElement.style.position = 'absolute';
                wordElement.style.left = `${dropX}px`;
                wordElement.style.top = `${dropY}px`;
                board.appendChild(wordElement);

                updateMirrorBoard(); // Mirror board content

                if (remainingWords.length > 0) {
                    const newWord = remainingWords.shift();
                    const wordIndex = selectedWords.indexOf(original.innerText);
                    if (wordIndex !== -1) {
                        selectedWords[wordIndex] = newWord;
                        wordsContainer.children[wordIndex].textContent = newWord;
                    }
                }

                wordElement.addEventListener('dblclick', function () {
                    if (wordElement.parentNode && wordElement.parentNode.id !== 'words') { // Prevent deletion from the pool
                        wordElement.remove();
                        updateMirrorBoard(); // Update mirror board content
                    }
                });

                // Add double-tap functionality for touch devices
                let lastTap = 0;
                wordElement.addEventListener('touchend', function (event) {
                    const currentTime = new Date().getTime();
                    const tapLength = currentTime - lastTap;
                    if (tapLength < 500 && tapLength > 0 && wordElement.parentNode && wordElement.parentNode.id !== 'words') { // Prevent deletion from the pool
                        wordElement.remove();
                        updateMirrorBoard(); // Update mirror board content
                    }
                    lastTap = currentTime;
                });
            }

            // Remove clone from DOM if it was dropped outside the board
            clone.remove();

            // Reset the clone creation flag
            original.__cloneCreated = false;
        }
    }


    function updateMirrorBoard() {
        mirrorBoard.innerHTML = board.innerHTML;
    }
    function downloadMirroredBoardAsImage() {
        const mirrorBoardContainer = document.getElementById('mirror-board-container');
        html2canvas(mirrorBoardContainer, { scale: 10 }).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'mirror_poem.png';
            link.click();
        }).catch(err => {
            console.error("Error capturing the mirrored board:", err);
        });
    }

    function shareMirroredBoard() {
        const mirrorBoardContainer = document.getElementById('mirror-board-container');
        html2canvas(mirrorBoardContainer, { scale: 10 }).then(canvas => {
            canvas.toBlob(blob => {
                const file = new File([blob], "mirror_poem.png", { type: "image/png" });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({
                        files: [file],
                        title: 'my poem',
                        text: 'check out my poem - you might need a mirror!',
                    });
                } else {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(file);
                    link.download = 'mirror_poem.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    alert('Your browser does not support direct sharing. The image has been downloaded. Please share it manually.');
                }
            });
        }).catch(err => {
            console.error("Error capturing the mirrored board:", err);
        });
    }

});
