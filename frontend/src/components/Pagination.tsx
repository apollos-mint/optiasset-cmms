import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  setItemsPerPage: (num: number) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  itemsPerPage,
  setItemsPerPage,
  currentPage,
  setCurrentPage
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem 1rem',
      background: 'rgba(255, 255, 255, 0.02)',
      borderTop: '1px solid var(--border-color)',
      fontSize: '0.8rem',
      color: 'var(--text-secondary)',
      flexWrap: 'wrap',
      gap: '0.75rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>Mostrar</span>
        <select
          value={itemsPerPage}
          onChange={e => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            padding: '0.25rem 0.5rem',
            cursor: 'pointer',
            outline: 'none',
            fontSize: '0.8rem'
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span>registros</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span>
          Mostrando <strong>{startIdx}</strong> - <strong>{endIdx}</strong> de <strong>{totalItems}</strong>
        </span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="btn btn-secondary"
            style={{
              padding: '0.25rem 0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
              height: '32px',
              width: '32px'
            }}
            title="Página Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="btn btn-secondary"
            style={{
              padding: '0.25rem 0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1,
              height: '32px',
              width: '32px'
            }}
            title="Página Siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
