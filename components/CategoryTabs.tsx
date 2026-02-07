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
      <div className="w-full overflow-x-auto py-2 px-1 no-scrollbar">
        <div className="flex space-x-2 min-w-max">
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <motion.button
                key={category}
                onClick={() => onSelectCategory(category)}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border
                  ${isSelected 
                    ? 'bg-indigo-100 text-indigo-900 border-transparent dark:bg-indigo-800 dark:text-indigo-50' 
                    : 'bg-transparent text-gray-600 border-gray-300 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}
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