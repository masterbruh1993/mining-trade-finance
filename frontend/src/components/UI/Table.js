import React from 'react';
import './Table.css';

const Table = ({ children, className = '', striped = true, hover = true, ...props }) => {
  return (
    <div className={`ui-table-container ${className}`}>
      <table className={`ui-table ${striped ? 'striped' : ''} ${hover ? 'hover' : ''}`} {...props}>
        {children}
      </table>
    </div>
  );
};

const TableHeader = ({ children, className = '', ...props }) => {
  return (
    <thead className={`ui-table-header ${className}`} {...props}>
      {children}
    </thead>
  );
};

const TableBody = ({ children, className = '', ...props }) => {
  return (
    <tbody className={`ui-table-body ${className}`} {...props}>
      {children}
    </tbody>
  );
};

const TableRow = ({ children, className = '', ...props }) => {
  return (
    <tr className={`ui-table-row ${className}`} {...props}>
      {children}
    </tr>
  );
};

const TableCell = ({ children, className = '', header = false, ...props }) => {
  const Tag = header ? 'th' : 'td';
  return (
    <Tag className={`ui-table-cell ${header ? 'header' : ''} ${className}`} {...props}>
      {children}
    </Tag>
  );
};

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Cell = TableCell;

export default Table;