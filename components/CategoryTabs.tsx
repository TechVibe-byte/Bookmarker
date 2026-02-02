import React from 'react';
import { motion } from 'framer-motion';
import { CategoryType } from '../types';

interface CategoryTabsProps {
  selectedCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
  categories: CategoryType[];
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ 
  selectedCategory, 
  onSelectCategory,
  categories
}) => {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="w-full overflow-x-auto py-2 px-2 no-scrollbar">
        <div className="flex space-x-3 min-w-max">
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => onSelectCategory(category)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300
                ${selectedCategory === category 
                  ? 'text-white shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)]' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5'}
              `}
            >
              {/* Active Background Pill */}
              {selectedCategory === category && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              {/* Glass effect for inactive tabs */}
              {selectedCategory !== category && (
                <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-2xl -z-10 border border-white/10 dark:border-white/5" />
              )}
              
              {category}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;