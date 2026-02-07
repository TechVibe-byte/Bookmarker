export interface Bookmark {
  id: string;
  title: string;
  url?: string;
  domain?: string;
  type?: 'link' | 'folder';
  parentId?: string | null;
  category: CategoryType;
  createdAt: number;
}

export type CategoryType = 
  | 'All Bookmarks' 
  | 'YouTube' 
  | 'Social' 
  | 'Developer' 
  | 'Shopping' 
  | 'Learning' 
  | 'Websites';

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export type Theme = 'light' | 'dark';