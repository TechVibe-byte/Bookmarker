import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Trash2, Globe, Edit2, Copy, Check, Share2, GripVertical, Folder, FolderOpen } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bookmark } from '../types';
import { getFaviconUrl } from '../utils/helpers';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onEdit: (bookmark: Bookmark) => void;
  onNavigate?: (id: string) => void;
  isDragOverlay?: boolean;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onDelete, onEdit, onNavigate, isDragOverlay = false }) => {
  const [imageError, setImageError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const isFolder = bookmark.type === 'folder';

  // dnd-kit hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id, disabled: false });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
    touchAction: 'none', // Prevents scrolling when dragging via the handle
  };

  const copyToClipboard = () => {
    if (bookmark.url) {
      navigator.clipboard.writeText(bookmark.url).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    copyToClipboard();
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share && bookmark.url) {
      try {
        await navigator.share({
          title: bookmark.title,
          text: `Check out this link: ${bookmark.title}`,
          url: bookmark.url,
        });
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isFolder && onNavigate) {
      e.preventDefault();
      onNavigate(bookmark.id);
    } else if (bookmark.url) {
      e.preventDefault();
      window.open(bookmark.url, '_blank', 'noopener,noreferrer');
    }
  };

  // If this is the "Ghost" overlay, we don't want the hook attributes/listeners on it again
  const cardProps = isDragOverlay ? {} : {
    ref: setNodeRef,
    style: style,
    ...attributes
  };

  return (
    <motion.div
      layout={!isDragging} // Disable layout animation while dragging to prevent fighting with DnD
      initial={isDragOverlay ? undefined : { opacity: 0, y: 20 }}
      animate={isDragOverlay ? undefined : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={isDragOverlay ? undefined : { y: -2 }}
      className={`group relative w-full ${isDragOverlay ? 'cursor-grabbing scale-105 z-50' : ''}`}
      {...cardProps}
    >
      {/* Material Card - Surface Container Low */}
      <div 
        onClick={handleClick}
        className={`
        relative overflow-hidden rounded-[16px]
        bg-m3-surfaceContainer-light dark:bg-m3-surfaceContainer-dark
        border border-gray-200 dark:border-gray-700
        transition-shadow duration-300
        h-full flex flex-col cursor-pointer
        ${isDragOverlay ? 'shadow-xl' : 'hover:shadow-md shadow-sm'}
      `}>
        {/* Ripple/State Layer on Hover */}
        {!isDragOverlay && (
          <div className="absolute inset-0 bg-current opacity-0 hover:opacity-[0.08] dark:hover:opacity-[0.08] transition-opacity duration-200 pointer-events-none text-indigo-900 dark:text-indigo-100" />
        )}
        
        <div className="p-4 flex flex-col h-full z-10 relative">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Drag Handle */}
              {!isDragOverlay && (
                 <div 
                  {...listeners}
                  onClick={(e) => e.stopPropagation()} 
                  className="cursor-grab active:cursor-grabbing p-1.5 -ml-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                  title="Drag to reorder"
                >
                  <GripVertical size={20} />
                </div>
              )}
              
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl shadow-sm border ${isFolder ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600'}`}>
                {isFolder ? (
                  <Folder className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  !imageError ? (
                    <img 
                      src={getFaviconUrl(bookmark.domain || '')} 
                      alt={bookmark.title}
                      className="w-6 h-6 object-contain"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  )
                )}
              </div>
            </div>
            
            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
              {/* Actions */}
              {!isFolder && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                    title="Share"
                  >
                    <Share2 size={18} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCopy}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                    title={isCopied ? "Copied!" : "Copy Link"}
                  >
                    {isCopied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                  </motion.button>
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(bookmark);
                }}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                title="Edit"
              >
                <Edit2 size={18} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(bookmark.id);
                }}
                className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 size={18} />
              </motion.button>
            </div>
          </div>

          <div className="flex-grow">
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-1 line-clamp-2 leading-tight">
              {bookmark.title || bookmark.domain}
            </h3>
            {!isFolder && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    {bookmark.category}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {bookmark.domain}
                </p>
              </>
            )}
            {isFolder && (
               <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                 Folder
               </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClick}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-full
                ${isFolder 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600' 
                  : 'bg-indigo-600 dark:bg-indigo-300 text-white dark:text-indigo-900 hover:bg-indigo-700 dark:hover:bg-indigo-200'}
                font-medium text-sm transition-colors shadow-sm
              `}
            >
              <span>{isFolder ? 'Open' : 'Visit Site'}</span>
              {isFolder ? <FolderOpen size={14} /> : <ExternalLink size={14} />}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookmarkCard;