export interface Bookmark {
  id: string;
  title: string;
  url?: string;
  domain?: string;
  type?: 'link' | 'folder';
  parentId?: string | null;
  category: CategoryType;
  createdAt: number;
  summary?: string;
  uid?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
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