'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  total?: number;
  limit?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  total,
  limit = 10
}: PaginationProps) {
  
  // Logic to generate page numbers with ellipses
  const generatePagination = () => {
    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    const start = Math.max(2, currentPage - siblingCount);
    const end = Math.min(totalPages - 1, currentPage + siblingCount);
    
    if (start > 2) {
      pages.push('...');
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (end < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page if totalPages > 1
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pages = generatePagination();

  return (
    <div className="flex items-center justify-between pt-6 border-t border-border mt-4">
      {total !== undefined && (
        <div className="text-xs text-muted font-medium">
          Showing {((currentPage - 1) * limit) + 1}–{Math.min(currentPage * limit, total)} of {total}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-muted hover:text-primary transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Previous
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p, i) => (
            <button
              key={i}
              onClick={() => typeof p === 'number' ? onPageChange(p) : null}
              disabled={typeof p !== 'number'}
              className={`w-9 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                p === currentPage
                  ? 'bg-brand text-white shadow-md'
                  : typeof p === 'number'
                    ? 'text-muted hover:bg-background hover:text-primary'
                    : 'text-muted cursor-default'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm font-medium text-muted hover:text-primary transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          Next
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
