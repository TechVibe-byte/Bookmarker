import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Link as LinkIcon, Type, Loader2, Save, Tag } from 'lucide-react';
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
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('Websites');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out "All Bookmarks" from the selectable options
  const selectableCategories = categories.filter(c => c !== 'All Bookmarks');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setUrl(initialData.url);
        setTitle(initialData.title);
        setCategory(initialData.category);
      } else {
        setUrl('');
        setTitle('');
        setCategory('Websites');
      }
    }
  }, [isOpen, initialData]);

  // Auto-detect category when URL changes, but only if not in edit mode (or if user just cleared it)
  useEffect(() => {
    if (url && !initialData) { 
      const formattedUrl = ensureUrlProtocol(url);
      const domain = getDomainFromUrl(formattedUrl);
      const detectedCategory = getCategoryFromDomain(domain);
      // Only switch if we detect something specific, or if we are just starting
      if (detectedCategory !== 'Websites') {
        setCategory(detectedCategory);
      }
    }
  }, [url, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsSubmitting(true);

    try {
      const formattedUrl = ensureUrlProtocol(url);
      const domain = getDomainFromUrl(formattedUrl);
      
      let finalTitle = title.trim();

      // Attempt 1: YouTube specific handling via NoEmbed (oEmbed proxy)
      // This bypasses YouTube's consent pages which cause generic titles on other scrapers
      if (!finalTitle && (domain.includes('youtube.com') || domain.includes('youtu.be'))) {
        try {
          const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(formattedUrl)}`);
          const data = await response.json();
          if (data.title) {
            finalTitle = data.title;
          }
        } catch (error) {
          console.warn('NoEmbed fetch failed for YouTube', error);
        }
      }

      // Attempt 2: If title is still empty, try to fetch it from Microlink
      if (!finalTitle) {
        try {
          const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(formattedUrl)}`);
          const data = await response.json();
          if (data.status === 'success' && data.data && data.data.title) {
            finalTitle = data.data.title;
          }
        } catch (error) {
          console.warn('Failed to fetch title from Microlink, falling back to domain', error);
        }
      }

      // Fallback if fetch failed or title was still empty
      if (!finalTitle) {
        finalTitle = domain;
      }

      onSubmit({
        url: formattedUrl,
        title: finalTitle,
        domain,
        category: category
      });

      // Reset and close (though parent might handle close)
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md">
              <div className="
                relative overflow-hidden rounded-[2rem]
                bg-white/90 dark:bg-gray-900/95
                backdrop-blur-2xl
                border border-white/20 dark:border-white/10
                shadow-2xl
                p-6 sm:p-8
              ">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                    {initialData ? 'Edit Bookmark' : 'Add Bookmark'}
                  </h2>
                  <button 
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="text-gray-600 dark:text-gray-300" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300 ml-1">Website URL</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LinkIcon size={18} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="example.com"
                        className="
                          w-full pl-11 pr-4 py-4 rounded-2xl
                          bg-gray-50/50 dark:bg-black/30
                          border border-gray-200 dark:border-white/10
                          focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                          outline-none transition-all
                          text-gray-800 dark:text-white
                          placeholder-gray-400
                        "
                        autoFocus={!initialData}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300 ml-1">Title (Optional)</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Type size={18} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="My Favorite Site"
                        className="
                          w-full pl-11 pr-4 py-4 rounded-2xl
                          bg-gray-50/50 dark:bg-black/30
                          border border-gray-200 dark:border-white/10
                          focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                          outline-none transition-all
                          text-gray-800 dark:text-white
                          placeholder-gray-400
                        "
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300 ml-1">Category</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Tag size={18} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as CategoryType)}
                        className="
                          w-full pl-11 pr-4 py-4 rounded-2xl
                          bg-gray-50/50 dark:bg-black/30
                          border border-gray-200 dark:border-white/10
                          focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                          outline-none transition-all
                          text-gray-800 dark:text-white
                          appearance-none cursor-pointer
                        "
                        disabled={isSubmitting}
                      >
                        {selectableCategories.map(cat => (
                          <option key={cat} value={cat} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                            {cat}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="
                      w-full py-4 rounded-2xl
                      bg-gradient-to-r from-indigo-600 to-purple-600
                      hover:from-indigo-500 hover:to-purple-500
                      text-white font-bold text-lg
                      shadow-lg shadow-indigo-500/30
                      transform transition-all active:scale-95
                      flex items-center justify-center space-x-2
                      disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100
                    "
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Fetching info...</span>
                      </>
                    ) : (
                      <>
                        {initialData ? <Save size={20} /> : <Plus size={20} />}
                        <span>{initialData ? 'Update Bookmark' : 'Save Bookmark'}</span>
                      </>
                    )}
                  </button>
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