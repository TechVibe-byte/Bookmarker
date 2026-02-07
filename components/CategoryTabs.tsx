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
      <div className="w-full overflow-x-auto py-1 px-1 no-scrollbar">
        <div className="flex space-x-2 min-w-max">
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <motion.button
                key={category}
                onClick={() => onSelectCategory(category)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border
                  ${isSelected 
                    ? 'bg-indigo-100 text-indigo-900 border-transparent dark:bg-indigo-900/40 dark:text-indigo-100' 
                    : 'bg-transparent text-gray-600 border-gray-300 dark:text-gray-400 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'}
                `}
              >
                {category}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;