import React from 'react';

interface CellProps {
  cell: {
    letter: string;
    number: number | null;
    blocked: boolean;
  };
  isActive: boolean;
  onClick: () => void;
}

const Cell: React.FC<CellProps> = ({ cell, isActive, onClick }) => {
  const classNames = ['cell'];
  
  if (cell.blocked) classNames.push('blocked');
  if (isActive) classNames.push('active');
  if (cell.letter) classNames.push('filled');
  
  return (
    <div className={classNames.join(' ')} onClick={onClick}>
      {cell.number && <span className="cell-number">{cell.number}</span>}
      {cell.letter}
    </div>
  );
};

export default Cell;