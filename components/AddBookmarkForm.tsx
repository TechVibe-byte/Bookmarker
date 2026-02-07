import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Type, Loader2, Save, Tag, Folder } from 'lucide-react';
import { ensureUrlProtocol, getDomainFromUrl, getCategoryFromDomain } from '../utils/helpers';
import { Bookmark, CategoryType } from '../types';

interface AddBookmarkFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  initialData?: Bookmark | null;
  categories: CategoryType[];
}

const AddBookmarkForm: React.FC<AddBookmarkFormProps> = ({ isOpen, onClose, onSubmit, initialData, categories }) => {
  const [type, setType] = useState<'link' | 'folder'>('link');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('Websites');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out "All Bookmarks" from the selectable options
  const selectableCategories = categories.filter(c => c !== 'All Bookmarks');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type || 'link');
        setUrl(initialData.url || '');
        setTitle(initialData.title);
        setCategory(initialData.category);
      } else {
        setType('link');
        setUrl('');
        setTitle('');
        setCategory('Websites');
      }
    }
  }, [isOpen, initialData]);

  // Auto-detect category when URL changes
  useEffect(() => {
    if (type === 'link' && url && !initialData) { 
      const formattedUrl = ensureUrlProtocol(url);
      const domain = getDomainFromUrl(formattedUrl);
      const detectedCategory = getCategoryFromDomain(domain);
      if (detectedCategory !== 'Websites') {
        setCategory(detectedCategory);
      }
    }
  }, [url, initialData, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'link' && !url) return;
    if (!title && type === 'folder') return; // Folders must have titles

    setIsSubmitting(true);

    try {
      if (type === 'link') {
        const formattedUrl = ensureUrlProtocol(url);
        const domain = getDomainFromUrl(formattedUrl);
        
        let finalTitle = title.trim();

        // Fetch Title Logic (Simplified)
        if (!finalTitle && (domain.includes('youtube.com') || domain.includes('youtu.be'))) {
          try {
            const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(formattedUrl)}`);
            const data = await response.json();
            if (data.title) finalTitle = data.title;
          } catch (error) {
            console.warn('NoEmbed fetch failed for YouTube', error);
          }
        }
        
        // Fallback title
        if (!finalTitle) {
          finalTitle = domain;
        }

        onSubmit({
          type: 'link',
          url: formattedUrl,
          title: finalTitle,
          domain,
          category: category,
          parentId: initialData?.parentId || null // Preserve parentId if editing
        });
      } else {
        // Folder
        onSubmit({
          type: 'folder',
          title: title.trim(),
          category: 'All Bookmarks', // Folders don't strictly have categories, but we set a default
          parentId: initialData?.parentId || null
        });
      }

      if (!initialData) {
          setUrl('');
          setTitle('');
          setCategory('Websites');
      }
      onClose();
    } catch (error) {
      console.error('Error saving bookmark:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md">
              <div className="
                relative overflow-hidden rounded-[24px]
                bg-m3-surfaceContainer-light dark:bg-m3-surfaceContainer-dark
                shadow-2xl
                p-5
                border border-transparent dark:border-gray-800
              ">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-normal text-gray-900 dark:text-gray-100">
                    {initialData ? 'Edit Item' : 'Add New'}
                  </h2>
                  <button 
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="text-gray-600 dark:text-gray-300 w-5 h-5" />
                  </button>
                </div>

                {/* Type Toggle */}
                {!initialData && (
                  <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-full mb-5">
                    <button 
                      type="button"
                      onClick={() => setType('link')}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full text-sm font-medium transition-colors ${type === 'link' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      <LinkIcon size={14} /> Link
                    </button>
                    <button 
                      type="button"
                      onClick={() => setType('folder')}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full text-sm font-medium transition-colors ${type === 'folder' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      <Folder size={14} /> Folder
                    </button>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {type === 'link' && (
                    <div className="space-y-1">
                      <div className="relative group">
                        <div className="absolute top-3 left-3 pointer-events-none">
                          <LinkIcon size={18} className="text-gray-500" />
                        </div>
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="Website URL"
                          className="
                            peer w-full pl-9 pr-4 py-2.5 rounded-lg
                            bg-transparent
                            border border-gray-400 dark:border-gray-600
                            focus:border-indigo-600 dark:focus:border-indigo-400
                            focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-400
                            outline-none transition-all
                            text-gray-900 dark:text-white
                            placeholder-transparent
                            text-sm
                          "
                          autoFocus={!initialData}
                          required
                          disabled={isSubmitting}
                          id="urlInput"
                        />
                        <label 
                          htmlFor="urlInput"
                          className="
                            absolute left-9 -top-2 bg-m3-surfaceContainer-light dark:bg-m3-surfaceContainer-dark px-1 text-[10px] text-gray-600 dark:text-gray-400 
                            peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-2.5 peer-placeholder-shown:left-9
                            peer-focus:-top-2 peer-focus:text-[10px] peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                            transition-all duration-200 pointer-events-none
                          "
                        >
                          Website URL
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                     <div className="relative group">
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <Type size={18} className="text-gray-500" />
                      </div>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={type === 'folder' ? "Folder Name" : "Title"}
                        className="
                          peer w-full pl-9 pr-4 py-2.5 rounded-lg
                          bg-transparent
                          border border-gray-400 dark:border-gray-600
                          focus:border-indigo-600 dark:focus:border-indigo-400
                          focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-400
                          outline-none transition-all
                          text-gray-900 dark:text-white
                          placeholder-transparent
                          text-sm
                        "
                        required={type === 'folder'}
                        disabled={isSubmitting}
                        id="titleInput"
                      />
                       <label 
                        htmlFor="titleInput"
                        className="
                          absolute left-9 -top-2 bg-m3-surfaceContainer-light dark:bg-m3-surfaceContainer-dark px-1 text-[10px] text-gray-600 dark:text-gray-400 
                          peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-2.5 peer-placeholder-shown:left-9
                          peer-focus:-top-2 peer-focus:text-[10px] peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400
                          transition-all duration-200 pointer-events-none
                        "
                      >
                        {type === 'folder' ? "Folder Name" : "Title (Optional)"}
                      </label>
                    </div>
                  </div>

                  {type === 'link' && (
                    <div className="space-y-1">
                       <div className="relative group">
                        <div className="absolute top-3 left-3 pointer-events-none">
                          <Tag size={18} className="text-gray-500" />
                        </div>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as CategoryType)}
                          className="
                            peer w-full pl-9 pr-4 py-2.5 rounded-lg
                            bg-transparent
                            border border-gray-400 dark:border-gray-600
                            focus:border-indigo-600 dark:focus:border-indigo-400
                            focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-400
                            outline-none transition-all
                            text-gray-900 dark:text-white
                            appearance-none cursor-pointer
                            text-sm
                          "
                          disabled={isSubmitting}
                          id="catSelect"
                        >
                          {selectableCategories.map(cat => (
                            <option key={cat} value={cat} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                              {cat}
                            </option>
                          ))}
                        </select>
                         <label 
                          htmlFor="catSelect"
                          className="
                            absolute left-9 -top-2 bg-m3-surfaceContainer-light dark:bg-m3-surfaceContainer-dark px-1 text-[10px] text-indigo-600 dark:text-indigo-400
                            transition-all duration-200 pointer-events-none
                          "
                        >
                          Category
                        </label>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-full text-indigo-600 dark:text-indigo-300 font-medium text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="
                        px-5 py-2 rounded-full
                        bg-indigo-600 dark:bg-indigo-300
                        hover:bg-indigo-700 dark:hover:bg-indigo-200
                        text-white dark:text-indigo-900
                        font-medium text-sm shadow-md hover:shadow-lg
                        transition-all active:scale-95
                        flex items-center space-x-2
                        disabled:opacity-70 disabled:cursor-not-allowed
                      "
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>{initialData ? 'Update' : 'Save'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddBookmarkForm;