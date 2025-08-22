'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import Cell from './components/Cell';

// Predefined crossword data
const CROSSWORD_DATA = {
  grid: [
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
  ],
  words: [
    { id: 1, clue: "Popular programming language", answer: "JAVASCRIPT", direction: "across", row: 2, col: 2, solved: false },
    { id: 2, clue: "Front-end framework", answer: "REACT", direction: "down", row: 1, col: 5, solved: false },
    { id: 3, clue: "Database used with Firebase", answer: "FIRESTORE", direction: "across", row: 5, col: 4, solved: false },
    { id: 4, clue: "CSS framework", answer: "TAILWIND", direction: "down", row: 3, col: 9, solved: false },
    { id: 5, clue: "JavaScript runtime", answer: "NODE", direction: "across", row: 8, col: 7, solved: false }
  ]
};

// Initialize the grid with numbers and blocked cells
const initializeGrid = () => {
  const grid = JSON.parse(JSON.stringify(CROSSWORD_DATA.grid));
  const words = JSON.parse(JSON.stringify(CROSSWORD_DATA.words));
  
  // Place words on grid and add numbers
  words.forEach((word: any) => {
    const { row, col, answer, direction, id } = word;
    
    // Add number to grid
    if (grid[row][col] === '') {
      grid[row][col] = { letter: '', number: id, blocked: false };
    }
    
    // Place word on grid
    for (let i = 0; i < answer.length; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;
      
      if (grid[r][c] === '') {
        grid[r][c] = { letter: '', number: null, blocked: false };
      } else if (typeof grid[r][c] === 'object' && grid[r][c].number !== null) {
        // Cell already has a number, keep it
        grid[r][c].letter = '';
        grid[r][c].blocked = false;
      }
    }
  });
  
  // Fill in blocked cells
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = { letter: '', number: null, blocked: true };
      } else if (typeof grid[r][c] === 'object' && grid[r][c].number === null && !grid[r][c].hasOwnProperty('blocked')) {
        grid[r][c].blocked = false;
      }
    }
  }
  
  return { grid, words };
};

const { grid: initialGrid, words: initialWords } = initializeGrid();

// Main App Component
export default function CrosswordBattleArena() {
  const [gameState, setGameState] = useState({
    grid: initialGrid,
    humanScore: 0,
    aiScore: 0,
    status: 'waiting⏳',
    wordsSolved: { human: [], ai: [] },
    chat: [
      { sender: 'system', text: 'Welcome to Crossword Battle Arena!🎮', timestamp: new Date() },
      { sender: 'system', text: 'Click Start Game to begin playing against AI.🤖', timestamp: new Date() }
    ],
    turn: 'human',
    words: initialWords
  });
  
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [activeCell, setActiveCell] = useState({ row: -1, col: -1 });
  const [selectedClue, setSelectedClue] = useState<number | null>(null);

  // Set up real-time listener
  useEffect(() => {
    console.log("Setting up Firebase listener");
    
    const unsubscribe = onSnapshot(
      doc(db, 'games', 'crosswordBattle'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setGameState(data as any);
          setFirebaseConnected(true);
          console.log("Game state updated from Firebase");
        } else {
          console.log("No game state found in Firebase, initializing...");
          // Initialize game state in Firebase if it doesn't exist
          updateDoc(doc(db, 'games', 'crosswordBattle'), gameState)
            .then(() => {
              console.log("Initial game state saved to Firebase");
              setFirebaseConnected(true);
            })
            .catch(error => {
              console.error("Error saving initial game state: ", error);
            });
        }
      },
      (error) => {
        console.error("Error listening to game state: ", error);
        setFirebaseConnected(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update Firebase when game state changes
  useEffect(() => {
    if (firebaseConnected) {
      console.log("Updating Firebase with new game state");
      updateDoc(doc(db, 'games', 'crosswordBattle'), gameState)
        .catch(error => {
          console.error("Error updating game state: ", error);
          setFirebaseConnected(false);
        });
    }
  }, [gameState, firebaseConnected]);

  // AI Turn Logic
  useEffect(() => {
    if (gameState.status === 'playing' && gameState.turn === 'ai') {
      console.log("AI's turn");
      
      // Find unsolved words
      const unsolvedWords = gameState.words.filter((word: any) => !word.solved);
      
      if (unsolvedWords.length > 0) {
        // AI picks a random word to solve after a delay
        const delay = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
        
        const aiTimeout = setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * unsolvedWords.length);
          const wordToSolve = unsolvedWords[randomIndex];
          
          // Update game state with AI's move
          const updatedGrid = JSON.parse(JSON.stringify(gameState.grid));
          const updatedWords = [...gameState.words];
          const updatedWordsSolved = {...gameState.wordsSolved};
          const updatedChat = [...gameState.chat];
          
          // Mark word as solved by AI
          const wordIndex = updatedWords.findIndex((w: any) => w.id === wordToSolve.id);
          updatedWords[wordIndex] = { ...wordToSolve, solved: true };
          
          // Update grid with the solved word
          const { row, col, answer, direction } = wordToSolve;
          for (let i = 0; i < answer.length; i++) {
            const r = direction === 'across' ? row : row + i;
            const c = direction === 'across' ? col + i : col;
            
            if (updatedGrid[r][c] && !updatedGrid[r][c].blocked) {
              updatedGrid[r][c].letter = answer[i];
            }
          }
          
          // Update scores
          const newAiScore = gameState.aiScore + answer.length * 10;
          
          // Add AI message to chat
          const aiMessages = [
            `I've solved "${wordToSolve.answer}"! Too easy!`,
            `"${wordToSolve.answer}" was no match for me!`,
            `Just solved "${wordToSolve.answer}". Your turn, human!`,
            `Another one bites the dust: "${wordToSolve.answer}"!`
          ];
          const randomMessage = aiMessages[Math.floor(Math.random() * aiMessages.length)];
          
          updatedChat.push({
            sender: 'ai',
            text: randomMessage,
            timestamp: new Date()
          });
          
          // Check if game is finished
          const allSolved = updatedWords.every((word: any) => word.solved);
          const newStatus = allSolved ? 'finished' : gameState.status;
          
          // Update game state
          setGameState({
            ...gameState,
            grid: updatedGrid,
            words: updatedWords,
            aiScore: newAiScore,
            wordsSolved: {
              ...updatedWordsSolved,
              ai: [...updatedWordsSolved.ai, wordToSolve.id]
            },
            chat: updatedChat,
            turn: allSolved ? 'none' : 'human',
            status: newStatus
          });
          
        }, delay);
        
        return () => clearTimeout(aiTimeout);
      }
    }
  }, [gameState.status, gameState.turn]);

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (gameState.status !== 'playing' || gameState.turn !== 'human') return;
    
    const cell = gameState.grid[row][col];
    if (cell.blocked) return;
    
    setActiveCell({ row, col });
    
    // Find if the cell belongs to any clue
    const clues = gameState.words.filter((word: any) => {
      const { row: wRow, col: wCol, answer, direction } = word;
      
      for (let i = 0; i < answer.length; i++) {
        const r = direction === 'across' ? wRow : wRow + i;
        const c = direction === 'across' ? wCol + i : wCol;
        
        if (r === row && c === col) {
          return true;
        }
      }
      return false;
    });
    
    if (clues.length > 0) {
      setSelectedClue(clues[0].id);
    }
  };

  // Handle letter input
  const handleLetterInput = (letter: string) => {
    if (gameState.status !== 'playing' || 
        gameState.turn !== 'human' || 
        activeCell.row === -1 || 
        activeCell.col === -1) return;
    
    const { row, col } = activeCell;
    const updatedGrid = JSON.parse(JSON.stringify(gameState.grid));
    
    // Update the cell with the letter
    updatedGrid[row][col] = {
      ...updatedGrid[row][col],
      letter: letter.toUpperCase()
    };
    
    setGameState({
      ...gameState,
      grid: updatedGrid
    });
    
    // Check if any words are solved
    checkForSolvedWords(updatedGrid);
  };

  // Check if any words are solved
  const checkForSolvedWords = (grid: any[][]) => {
    const updatedWords = [...gameState.words];
    const updatedWordsSolved = {...gameState.wordsSolved};
    const updatedChat = [...gameState.chat];
    let newHumanScore = gameState.humanScore;
    let solvedWord = null;
    
    for (const word of updatedWords) {
      if (word.solved) continue;
      
      const { row, col, answer, direction } = word;
      let isSolved = true;
      
      // Check if all letters in the word match the answer
      for (let i = 0; i < answer.length; i++) {
        const r = direction === 'across' ? row : row + i;
        const c = direction === 'across' ? col + i : col;
        
        if (!grid[r][c] || grid[r][c].letter !== answer[i]) {
          isSolved = false;
          break;
        }
      }
      
      if (isSolved) {
        solvedWord = word;
        word.solved = true;
        newHumanScore += answer.length * 10;
        updatedWordsSolved.human.push(word.id);
        
        // Add success message to chat
        updatedChat.push({
          sender: 'system',
          text: `You solved "${word.answer}"! +${answer.length * 10} points!`,
          timestamp: new Date()
        });
        
        break;
      }
    }
    
    if (solvedWord) {
      // Check if game is finished
      const allSolved = updatedWords.every((word: any) => word.solved);
      
      setGameState({
        ...gameState,
        grid,
        words: updatedWords,
        humanScore: newHumanScore,
        wordsSolved: updatedWordsSolved,
        chat: updatedChat,
        turn: allSolved ? 'none' : 'ai',
        status: allSolved ? 'finished' : gameState.status
      });
    }
  };

  // Start game
  const startGame = () => {
    const { grid, words } = initializeGrid();
    
    setGameState({
      grid,
      humanScore: 0,
      aiScore: 0,
      status: 'playing',
      wordsSolved: { human: [], ai: [] },
      chat: [
        { sender: 'system', text: 'Game started! Your turn first.', timestamp: new Date() },
        { sender: 'ai', text: 'Good luck, human! You will need it!', timestamp: new Date() }
      ],
      turn: 'human',
      words
    });
    
    setActiveCell({ row: -1, col: -1 });
    setSelectedClue(null);
  };

  // Reset game
  const resetGame = () => {
    const { grid, words } = initializeGrid();
    
    setGameState({
      grid,
      humanScore: 0,
      aiScore: 0,
      status: 'waiting',
      wordsSolved: { human: [], ai: [] },
      chat: [
        { sender: 'system', text: 'Game has been reset.', timestamp: new Date() },
        { sender: 'system', text: 'Click Start Game to begin a new game.', timestamp: new Date() }
      ],
      turn: 'human',
      words
    });
    
    setActiveCell({ row: -1, col: -1 });
    setSelectedClue(null);
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
        handleLetterInput(e.key);
      } else if (e.key === 'Backspace') {
        handleLetterInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCell, gameState]);

  // Render the crossword grid
  const renderGrid = () => {
    return gameState.grid.map((row, rowIndex) => (
      <div key={rowIndex} className="crossword-row">
        {row.map((cell, colIndex) => {
          const isActive = activeCell.row === rowIndex && activeCell.col === colIndex;
          
          return (
            <Cell
              key={colIndex}
              cell={cell}
              isActive={isActive}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            />
          );
        })}
      </div>
    ));
  };

  // Render clues
  const renderClues = () => {
    const across = gameState.words.filter((word: any) => word.direction === 'across');
    const down = gameState.words.filter((word: any) => word.direction === 'down');
    
    return (
      <div className="clues-container">
        <div className="clue-section">
          <div className="clue-title">Across</div>
          <ul className="clue-list">
            {across.map((word: any) => (
              <li
                key={word.id}
                className={`clue-item ${word.solved ? 'solved' : ''} ${selectedClue === word.id ? 'selected' : ''}`}
                onClick={() => setSelectedClue(word.id)}
              >
                <strong>{word.id}.</strong> {word.clue}
              </li>
            ))}
          </ul>
        </div>
        <div className="clue-section">
          <div className="clue-title">Down</div>
          <ul className="clue-list">
            {down.map((word: any) => (
              <li
                key={word.id}
                className={`clue-item ${word.solved ? 'solved' : ''} ${selectedClue === word.id ? 'selected' : ''}`}
                onClick={() => setSelectedClue(word.id)}
              >
                <strong>{word.id}.</strong> {word.clue}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // Render chat messages
  const renderChat = () => {
    return (
      <div className="chat-container">
        <div className="chat-title">Game Chat</div>
        <div className="chat-messages">
          {gameState.chat.map((message: any, index: number) => (
            <div key={index} className={`message ${message.sender}`}>
              <strong>{message.sender}:</strong> {message.text}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <header>
        <h1>Crossword Battle Arena</h1>
        <div className="subtitle">Battle against AI in real-time crossword solving</div>
      </header>
      
      <div className="game-container">
        <div className="crossword-section">
          <div className="score-board">
            <div className="player-score">
              <div className="player-name human">Human</div>
              <div className="score-value">{gameState.humanScore}</div>
            </div>
            <div className="player-score">
              <div className="player-name ai">AI Opponent</div>
              <div className="score-value">{gameState.aiScore}</div>
            </div>
          </div>
          
          <div className="game-status">
            <div>Game Status: <span className={`status-badge ${gameState.status}`}>{gameState.status}</span></div>
            {gameState.status === 'playing' && (
              <div>Current Turn: <span className={gameState.turn}>{gameState.turn}</span></div>
            )}
          </div>
          
          <div className="crossword-grid">
            {renderGrid()}
          </div>
          
          <div className="controls">
            <button className="start" onClick={startGame} disabled={gameState.status === 'playing'}>
              Start Game
            </button>
            <button className="reset" onClick={resetGame}>
              Reset Game
            </button>
          </div>
        </div>
        
        <div className="game-info">
          {renderChat()}
          
          <div className="firebase-status">
            Firebase Connection: 
            <span className={firebaseConnected ? 'connected' : 'disconnected'}>
              {firebaseConnected ? ' Connected' : ' Disconnected'}
            </span>
          </div>
        </div>
      </div>
      
      {renderClues()}
    </div>
  );
}