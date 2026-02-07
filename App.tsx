import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Moon, Sun, BookMarked, LayoutGrid, ArrowUpDown, ChevronDown, Settings, Download, Upload, Trash2, X, AlertTriangle, WifiOff, Smartphone, Home, ChevronRight } from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  TouchSensor
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';

import { Bookmark, CategoryType, Theme } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import CategoryTabs from './components/CategoryTabs';
import BookmarkCard from './components/BookmarkCard';
import AddBookmarkForm from './components/AddBookmarkForm';

const CATEGORIES: CategoryType[] = [
  'All Bookmarks',
  'YouTube',
  'Websites',
  'Developer',
  'Social',
  'Learning',
  'Shopping'
];

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'domain' | 'custom';

// Interface for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function App() {
  const [theme, setTheme] = useLocalStorage<Theme>('bookmarker-theme', 'dark');
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('bookmarker-data', []);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All Bookmarks');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  
  // DnD State
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // PWA & Connectivity State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Prevent drag on simple clicks
      },
    }),
    useSensor(TouchSensor, {
        // Press delay for touch to avoid conflict with scroll
        activationConstraint: {
            delay: 150,
            tolerance: 5,
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Splash Screen Logic
  useEffect(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
          splash.remove();
        }, 500);
      }, 2000);
    }
  }, []);

  // Connectivity Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // Apply theme to body
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('color-scheme', 'dark');
      document.body.style.backgroundColor = '#000000'; // Pitch Black for OLED
    } else {
      root.classList.remove('dark');
      root.style.setProperty('color-scheme', 'light');
      document.body.style.backgroundColor = '#FDFCFF'; // M3 Light Surface
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const openAddModal = () => {
    setEditingBookmark(null);
    setIsModalOpen(true);
  };

  const openEditModal = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsModalOpen(true);
  };

  const handleSaveBookmark = (bookmarkData: Omit<Bookmark, 'id' | 'createdAt'>) => {
    if (editingBookmark) {
      // Update existing
      setBookmarks(prev => prev.map(b => 
        b.id === editingBookmark.id 
          ? { ...b, ...bookmarkData } 
          : b
      ));
    } else {
      // Add new
      const newBookmark: Bookmark = {
        ...bookmarkData,
        id: crypto.randomUUID(),
        parentId: currentFolderId, // New items go to current folder
        createdAt: Date.now(),
      };
      setBookmarks(prev => [newBookmark, ...prev]);
    }
    setIsModalOpen(false);
    setEditingBookmark(null);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      // Recursively find all children IDs to delete
      const idsToDelete = new Set<string>();
      const findChildren = (parentId: string) => {
        idsToDelete.add(parentId);
        bookmarks
          .filter(b => b.parentId === parentId)
          .forEach(child => findChildren(child.id));
      };
      
      findChildren(itemToDelete);
      
      setBookmarks(prev => prev.filter(b => !idsToDelete.has(b.id)));
      setItemToDelete(null);
    }
  };

  const handleNavigate = (folderId: string) => {
    setCurrentFolderId(folderId);
    setSearchQuery(''); // Clear search on navigation
    setSelectedCategory('All Bookmarks'); // Reset category on navigation
  };

  const handleNavigateUp = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const breadcrumbs = useMemo(() => {
    const path = [];
    let currentId = currentFolderId;
    while (currentId) {
      const folder = bookmarks.find(b => b.id === currentId);
      if (folder) {
        path.unshift({ id: folder.id, title: folder.title });
        currentId = folder.parentId || null;
      } else {
        break;
      }
    }
    return path;
  }, [currentFolderId, bookmarks]);

  const handleExportData = () => {
    const dataStr = JSON.stringify(bookmarks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `bookmarker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = e => {
        if (e.target?.result) {
          try {
            const parsed = JSON.parse(e.target.result as string);
            if (Array.isArray(parsed)) {
              // Basic validation - check if objects have id and title
              const isValid = parsed.every(b => b.id && b.title);
              if (isValid) {
                if (confirm(`Found ${parsed.length} items. This will merge them with your current ${bookmarks.length} items. Continue?`)) {
                   const currentIds = new Set(bookmarks.map(b => b.id));
                   const newBookmarks = parsed.filter(b => !currentIds.has(b.id));
                   const updatedBookmarks = [...bookmarks, ...newBookmarks];
                   setBookmarks(updatedBookmarks);
                   alert(`Successfully imported ${newBookmarks.length} new items.`);
                   setIsSettingsOpen(false);
                }
              } else {
                alert("Invalid file format.");
              }
            } else {
              alert("Invalid JSON format. Expected an array of bookmarks.");
            }
          } catch (err) {
            console.error(err);
            alert("Error parsing JSON file.");
          }
        }
      };
    }
    if (event.target) event.target.value = '';
  };

  const handleClearAll = () => {
    if (confirm("WARNING: This will permanently delete ALL your bookmarks. This action cannot be undone. Are you absolutely sure?")) {
      setBookmarks([]);
      setIsSettingsOpen(false);
    }
  };

  // --- Filtering & Sorting Logic ---
  
  const filteredBookmarks = bookmarks
    .filter(bookmark => {
      // 1. Search (Global) overrides folder view
      if (searchQuery) {
        return (
          bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (bookmark.domain || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // 2. Folder Hierarchy
      const parentMatch = (bookmark.parentId || null) === currentFolderId;
      if (!parentMatch) return false;

      // 3. Category Filter
      if (selectedCategory !== 'All Bookmarks') {
        if (bookmark.type === 'folder') return false; // Hide folders in filtered views
        return bookmark.category === selectedCategory;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Always keep folders on top if custom sort isn't active
      if (sortOption !== 'custom') {
        const aIsFolder = a.type === 'folder';
        const bIsFolder = b.type === 'folder';
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
      }

      switch (sortOption) {
        case 'newest': return b.createdAt - a.createdAt;
        case 'oldest': return a.createdAt - b.createdAt;
        case 'a-z': return a.title.localeCompare(b.title);
        case 'z-a': return b.title.localeCompare(a.title);
        case 'domain': return (a.domain || '').localeCompare(b.domain || '');
        case 'custom': return 0; // Respect array order
        default: return 0;
      }
    });

  // --- Drag and Drop Logic ---

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Automatically switch to custom sort if user rearranges
    if (sortOption !== 'custom') {
      setSortOption('custom');
    }

    setBookmarks((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const activeBookmark = activeId ? bookmarks.find(b => b.id === activeId) : null;

  return (
    <div className={`h-[100dvh] w-full flex flex-col text-gray-900 dark:text-gray-100 overflow-hidden bg-m3-surface-light dark:bg-m3-surface-dark transition-colors duration-300`}>
      
      {/* Offline Banner - Material Style */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-none bg-red-600 text-white text-xs font-medium text-center overflow-hidden z-50 w-full shadow-md"
          >
            <div className="py-1.5 flex items-center justify-center gap-2">
              <WifiOff size={14} />
              <span>You are offline.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Header Section - Material Top App Bar style */}
      <div className="flex-none z-30 flex flex-col px-4 pt-4 pb-2 bg-m3-surface-light dark:bg-m3-surface-dark">
        {/* Top Row: Logo & Settings */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg shadow-sm text-white">
              <BookMarked className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-normal tracking-tight text-gray-900 dark:text-white">
              Bookmarker
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Second Row: Search & Sort - Material inputs */}
        <div className="flex items-center gap-2 w-full mb-3">
           {/* Sort Dropdown */}
           <div className="relative min-w-[100px]">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <ArrowUpDown className="h-3.5 w-3.5 text-gray-500" />
              </div>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="
                  block w-full pl-8 pr-6 py-2 appearance-none
                  bg-m3-surfaceContainer-light dark:bg-m3-surfaceContainer-dark
                  border border-gray-300 dark:border-gray-800
                  rounded-full
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  text-sm font-medium transition-all
                  text-gray-700 dark:text-gray-200
                  cursor-pointer outline-none
                  truncate
                "
              >
                <option value="custom" className="bg-white dark:bg-gray-900">Custom</option>
                <option value="newest" className="bg-white dark:bg-gray-900">Newest</option>
                <option value="oldest" className="bg-white dark:bg-gray-900">Oldest</option>
                <option value="a-z" className="bg-white dark:bg-gray-900">A-Z</option>
                <option value="z-a" className="bg-white dark:bg-gray-900">Z-A</option>
                <option value="domain" className="bg-white dark:bg-gray-900">Domain</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </div>
           </div>

           {/* Search Input */}
           <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  block w-full pl-9 pr-4 py-2 
                  bg-m3-surfaceContainer-light dark:bg-m3-surfaceContainer-dark
                  border border-gray-300 dark:border-gray-800
                  rounded-full
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  placeholder-gray-500 dark:placeholder-gray-400 
                  text-sm transition-all
                  text-gray-900 dark:text-white
                "
              />
           </div>
        </div>

        {/* Breadcrumbs - Only show when inside a folder and not searching */}
        {!searchQuery && currentFolderId && (
          <nav className="flex items-center gap-1 mb-3 overflow-x-auto no-scrollbar" aria-label="Breadcrumb">
             <button 
                onClick={() => handleNavigateUp(null)}
                className="flex items-center justify-center p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Go to Home"
             >
               <Home size={18} />
             </button>
             
             {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                <div key={crumb.id} className="flex items-center flex-shrink-0">
                  <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 mx-0.5" />
                  <button
                    onClick={() => !isLast && handleNavigateUp(crumb.id)}
                    disabled={isLast}
                    className={`
                      text-xs px-3 py-1 rounded-full transition-colors whitespace-nowrap font-medium border
                      ${isLast 
                        ? 'bg-indigo-100 text-indigo-900 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800 cursor-default shadow-sm' 
                        : 'bg-transparent text-gray-600 border-gray-300 dark:text-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'}
                    `}
                  >
                    {crumb.title}
                  </button>
                </div>
             )})}
          </nav>
        )}

        {/* Third Row: Categories - Scrollable Chips */}
        <div className="flex items-center justify-between pb-2">
           <div className="flex-grow overflow-hidden">
             <CategoryTabs 
               categories={CATEGORIES} 
               selectedCategory={selectedCategory} 
               onSelectCategory={setSelectedCategory} 
             />
           </div>
           
           {/* Desktop Add Button (Text/Icon style) */}
           <div className="pl-2 hidden md:block">
              <motion.button
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.95 }}
               onClick={openAddModal}
               className="
                 flex items-center space-x-2 px-4 py-2 rounded-full
                 bg-indigo-600 dark:bg-indigo-300 
                 text-white dark:text-indigo-900 
                 font-medium text-xs
                 hover:bg-indigo-700 dark:hover:bg-indigo-200 
                 transition-colors shadow-sm
               "
             >
               <Plus size={16} />
               <span>New</span>
             </motion.button>
           </div>
        </div>
      </div>

      {/* Scrollable Main Content */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:px-6 lg:px-8 pb-20 sm:pb-8 scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
         <div className="max-w-7xl mx-auto min-h-full">
            {bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center mt-10">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
                <LayoutGrid className="w-8 h-8 text-indigo-400 opacity-75" />
              </div>
              <h3 className="text-lg font-normal text-gray-900 dark:text-white mb-1">No bookmarks yet</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                Start building your collection by adding your first bookmark.
              </p>
              <button 
                onClick={openAddModal}
                className="mt-4 text-indigo-600 dark:text-indigo-300 font-medium text-sm hover:underline"
              >
                Create Bookmark
              </button>
            </div>
          ) : filteredBookmarks.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-center mt-10">
              {searchQuery ? (
                 <>
                   <Search className="w-10 h-10 text-gray-400 mb-3 opacity-75" />
                   <h3 className="text-base font-normal text-gray-900 dark:text-white">No matches found</h3>
                 </>
              ) : (
                <>
                  <LayoutGrid className="w-10 h-10 text-gray-400 mb-3 opacity-75" />
                  <h3 className="text-base font-normal text-gray-900 dark:text-white">Folder is empty</h3>
                </>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {searchQuery ? "Try adjusting your search." : "Add a bookmark or folder here."}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={filteredBookmarks.map(b => b.id)}
                strategy={rectSortingStrategy}
              >
                <motion.div 
                  layout={!activeId}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                >
                  <AnimatePresence>
                    {filteredBookmarks.map((bookmark) => (
                      <BookmarkCard 
                        key={bookmark.id} 
                        bookmark={bookmark} 
                        onDelete={handleDeleteClick} 
                        onEdit={openEditModal}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </SortableContext>

              <DragOverlay adjustScale={true}>
                {activeBookmark ? (
                  <div className="opacity-90">
                     <BookmarkCard
                        bookmark={activeBookmark}
                        onDelete={() => {}}
                        onEdit={() => {}}
                        onNavigate={() => {}}
                        isDragOverlay
                      />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
         </div>
      </div>

      {/* Material FAB - Smaller */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openAddModal}
        className="
          md:hidden fixed bottom-5 right-5 z-40 
          w-12 h-12 flex items-center justify-center
          bg-indigo-600 dark:bg-indigo-300 
          text-white dark:text-indigo-900 
          rounded-[14px] shadow-lg hover:shadow-xl
          transition-all
        "
      >
        <Plus size={20} />
      </motion.button>

      <AddBookmarkForm 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingBookmark(null);
        }} 
        onSubmit={handleSaveBookmark}
        initialData={editingBookmark}
        categories={CATEGORIES}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-xs bg-m3-surfaceContainer-light dark:bg-m3-surfaceContainer-dark rounded-[24px] p-5 text-center shadow-xl border border-transparent dark:border-gray-800">
                <div className="mx-auto w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-normal text-gray-900 dark:text-white mb-2">Delete Item?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                  Are you sure you want to delete this? If it's a folder, all contents will be deleted.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setItemToDelete(null)}
                    className="px-3 py-1.5 rounded-full text-indigo-600 dark:text-indigo-300 font-medium text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-3 py-1.5 rounded-full bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal - Material Dialog */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-sm">
                <div className="relative overflow-hidden rounded-[24px] bg-m3-surfaceContainer-light dark:bg-m3-surfaceContainer-dark shadow-2xl p-5 border border-transparent dark:border-gray-800">
                  
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-normal text-gray-900 dark:text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                      Settings
                    </h2>
                    <button onClick={() => setIsSettingsOpen(false)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Install App Button */}
                    {installPrompt && (
                      <button
                        onClick={handleInstallClick}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group mb-3"
                      >
                         <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-200">
                          <Smartphone size={18} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">Install App</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Add to Home Screen</p>
                        </div>
                      </button>
                    )}

                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider ml-1 mb-1">Data</p>
                      
                      <button
                        onClick={handleExportData}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Download size={18} className="text-gray-500 dark:text-gray-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Export Bookmarks</p>
                        </div>
                      </button>

                      <button
                        onClick={handleImportClick}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Upload size={18} className="text-gray-500 dark:text-gray-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Import Bookmarks</p>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleImportFile}
                          className="hidden"
                          accept="application/json"
                        />
                      </button>

                      <button
                        onClick={handleClearAll}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-400 transition-colors mt-1"
                      >
                        <Trash2 size={18} />
                        <p className="text-sm font-medium">Clear All Data</p>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;