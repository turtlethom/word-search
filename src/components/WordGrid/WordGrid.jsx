import React, { useEffect, useState, useRef } from "react";
import './WordGrid.css';
import WordList from "../WordList/WordList";
import Cell from "../Cell/Cell";
import placeWord from "../../utils/wordUtils";
import getRandomColor from "../../utils/colorUtils";
import { fillEmptySpaces, getRandomLetter } from "../../utils/gridUtils";

const WordGrid = ({ words, gridSize }) => {
  
  const [ grid, setGrid ] = useState(Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => '')));
  const [ wordsFound, setWordsFound ] = useState(new Map());
  
  const [ startCoordinate, setStartCoordinate ] = useState(null);
  const [ endCoordinate, setEndCoordinate ] = useState(null);

  const [ selections, setSelections ] = useState([]);
  const [ colorsInUse, setColorsInUse ] = useState(new Set());
  const [ remainingWords, setRemainingWords ] = useState([...words]);

  // Initial Render
  useEffect(() => {
    setGrid(grid)
  }, [])

  // Selection Functionality

  const handleMouseDown = (rowIndex, columnIndex) => {
    // Initializing The Start Of The User Selection
    setStartCoordinate({ x: columnIndex, y: rowIndex });
    setEndCoordinate({ x: columnIndex, y: rowIndex });
  }

  const handleMouseOver = (rowIndex, columnIndex) => {
    // Update `EndCoordinate` Upon User Dragging Mouse Over Cells
    if (startCoordinate) {
      setEndCoordinate({ x: columnIndex, y: rowIndex });
    }
  }

  const handleMouseUp = () => {
    // Initialize If A Selection Has Been Made By The User
    if (startCoordinate && endCoordinate) {
      const { cells, word } = getSelectedCells(startCoordinate, endCoordinate);
      const joinedWord = word.join('');
      
      // Checking If User Selection Is Valid
      if (joinedWord && words.includes(joinedWord)) {

        let color = getRandomColor(colorsInUse);
        // Debug Invalid Selections --- Ensure Colors Are Not Accidently Excluded From Invalid User Selections
        console.log(`Current User Selection: ${joinedWord}`)
        console.log(`Selection's Made: ${colorsInUse.size} ===> ${color}}`);

        // Tracking & Updating Total User Selections
        setSelections(prevSelections => {
          const newSelection = { cells, word: joinedWord, color: color };

          return [...prevSelections, newSelection];
        });

        // Tracking & Updating Total Words Found
        setWordsFound(prevWordsFounds => {
          const newWordsFound = new Map(prevWordsFounds);
          newWordsFound.set(joinedWord, true);

          return newWordsFound;
        })
        
        // Tracking Remaining Words
        setRemainingWords(prevRemainingWords => {
          const updatedRemainingWords = prevRemainingWords.filter(w => w !== joinedWord);
          console.log(`Remaining Words Left To Find: ${updatedRemainingWords}`);

          if (updatedRemainingWords.length === 0) {
            // Something happens, e.g., show a restart pop-up
            console.log("No remaining words!");
          }

          return updatedRemainingWords;
        })


      } else {
        // DEBUG
        console.log(`${joinedWord} is not one of the valid words`);
      }
    }
    
    // Reset Coordinates For Next User Selection
    setStartCoordinate(null);
    setEndCoordinate(null);
  };

  const getSelectedCells = (startCoord, endCoord) => {
    // **** Bresenham's Line Algorithm ****
    const selectedCells = [];
    let x = startCoord.x;
    let y = startCoord.y;
    const dx = Math.abs(endCoord.x - startCoord.x);
    const dy = Math.abs(endCoord.y - startCoord.y);
    const sx = startCoord.x < endCoord.x ? 1 : -1;
    const sy = startCoord.y < endCoord.y ? 1 : -1;
    let err = dx - dy;

    while (true) {
      selectedCells.push({ x, y })

      if (x === endCoord.x && y === endCoord.y) {
        break;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
    const selectedWord = selectedCells.map(cell => grid[cell.y][cell.x]);
    return { cells: selectedCells, word: selectedWord }
  };

  const refreshGrid = () => {
    updateWordGrid();
  }

  const updateWordGrid = () => {
    let newGrid = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => ''));
    // Sorting Words By Length In DESC Order
    const sortedWords = words.sort((a, b) => b.length - a.length);

    sortedWords.forEach(word => {
      let placed = false;
      let attempts = 0;

      const directionOrder = (word.length > 8 
      ? ['horizontal', 'vertical', 'diagonal-up', 'diagonal-down']
      : ['horizontal', 'vertical', 'diagonal-up', 'diagonal-down', 'horizontal-reverse', 'vertical-reverse']);

      // `attempts` Introduced To Prevent Infinite Looping
      while (!placed && attempts < 100) {
        // Attempting To Place Words Within Grid
        const directionIndex = Math.floor(Math.random() * directionOrder.length);
        const direction = directionOrder[directionIndex];
  
        const wordLength = word.length;
  
        let row, col;
  
        if (direction.startsWith('horizontal')) {
          row = Math.floor(Math.random() * gridSize);
          col = Math.floor(Math.random() * (gridSize - wordLength + 1));
        } else if (direction.startsWith('vertical')) {
          row = Math.floor(Math.random() * (gridSize - wordLength + 1));
          col = Math.floor(Math.random() * gridSize);
        } else {
          row = Math.floor(Math.random() * (gridSize - wordLength + 1));
          col = Math.floor(Math.random() * (gridSize - wordLength + 1));
        }
  
        const newGridAttempt = placeWord(newGrid, word, row, col, direction);
        if (newGridAttempt !== null) {
          placed = true;
          newGrid = newGridAttempt;
        }
        attempts++;
      }

      // DEBUG WORD PLACEMENT ON GRID
      // ==============================================================================
      const misplacedWords = words.filter(w => !sortedWords.includes(w));
      if (misplacedWords.length === 0) {
        console.log("**** SUCCESS: All words have been placed on the grid ****")
      } else {
        console.log(`**** ERROR: Words not placed on the grid: ${misplacedWords.forEach(word => word)} ****`)
      }
      // ==============================================================================
    });
    // Fill Grid && Reset Grid Controls
    fillEmptySpaces(newGrid);
    setGrid(newGrid);
    setSelections([]);
    setColorsInUse(new Set());
    setRemainingWords([...words]);
  };

  // ... (previous code)

  return (
    <>
      <button onClick={ refreshGrid }>Shuffle</button>
      <table className="word-grid">
        <tbody>
          {grid.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, columnIndex) => {
                const cellCoord = { x: columnIndex, y: rowIndex };
                const selectedInfo = selections.find(
                  (selection) =>
                    selection.cells.some(
                      (selectedCell) =>
                        selectedCell.x === cellCoord.x &&
                        selectedCell.y === cellCoord.y
                    )
                ) || {};
                const isSelected =
                  selectedInfo.word &&
                  selections.some(
                    (selection) =>
                      selection.cells.some(
                        (selectedCell) =>
                          selectedCell.x === cellCoord.x &&
                          selectedCell.y === cellCoord.y &&
                          selection.word === selectedInfo.word
                      )
                  );

                return (
                  <Cell 
                    key={columnIndex}
                    cellCoord={cellCoord}
                    isSelected={isSelected}
                    selectedInfo={selectedInfo}
                    letter={grid[cellCoord.y][cellCoord.x]}
                    handleMouseDown={handleMouseDown}
                    handleMouseOver={handleMouseOver}
                    handleMouseUp={handleMouseUp}
                    />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <WordList words={words} wordsFound={wordsFound} />
    </>
  );

};

export default WordGrid;
