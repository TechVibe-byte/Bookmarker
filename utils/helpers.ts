import { CategoryType } from '../types';

export const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return 'unknown';
  }
};

export const getCategoryFromDomain = (domain: string): CategoryType => {
  const d = domain.toLowerCase();
  
  // YouTube - Explicit checks for main domain and shortlink
  if (
    d.includes('youtube') || 
    d === 'youtu.be' || 
    d.endsWith('.youtu.be')
  ) return 'YouTube';
  
  // Social Media
  if (
    d.includes('instagram') ||
    d.includes('twitter') ||
    d.includes('x.com') ||
    d.includes('facebook') ||
    d.includes('fb.com') ||
    d.includes('linkedin') ||
    d.includes('tiktok') ||
    d.includes('pinterest') ||
    d.includes('reddit') ||
    d.includes('discord') ||
    d.includes('twitch') ||
    d.includes('whatsapp') ||
    d.includes('telegram') ||
    d.includes('t.me') ||
    d.includes('snapchat') ||
    d.includes('threads.net') ||
    d.includes('bluesky') || 
    d.includes('bsky.app')
  ) return 'Social';

  // Developer Tools & Resources
  // Note: Checked before Shopping to correctly categorize aws.amazon.com as Developer
  if (
    d.includes('github') ||
    d.includes('stackoverflow') ||
    d.includes('gitlab') ||
    d.includes('bitbucket') ||
    d.includes('dev.to') ||
    d.includes('npmjs') ||
    d.includes('pypi') ||
    d.includes('codepen') ||
    d.includes('codesandbox') ||
    d.includes('replit') ||
    d.includes('vercel') ||
    d.includes('netlify') ||
    d.includes('heroku') ||
    d.includes('digitalocean') ||
    d.includes('aws') ||
    d.includes('firebase') ||
    d.includes('docker') ||
    d.includes('kubernetes') ||
    d.includes('localhost') ||
    d.includes('127.0.0.1') ||
    d.includes('w3schools') ||
    d.includes('mdn') ||
    d.includes('mozilla.org') ||
    d.includes('geeksforgeeks') ||
    d.includes('hashnode') ||
    d.includes('medium') ||
    d.includes('openai') ||
    d.includes('chatgpt') ||
    d.includes('claude.ai') ||
    d.includes('huggingface')
  ) return 'Developer';

  // Shopping
  if (
    d.includes('amazon') ||
    d.includes('flipkart') ||
    d.includes('ebay') ||
    d.includes('shopify') ||
    d.includes('walmart') ||
    d.includes('target') ||
    d.includes('bestbuy') ||
    d.includes('etsy') ||
    d.includes('aliexpress') ||
    d.includes('temu') ||
    d.includes('shein') ||
    d.includes('craigslist')
  ) return 'Shopping';

  // Learning
  if (
    d.includes('coursera') ||
    d.includes('udemy') ||
    d.includes('edx') ||
    d.includes('pluralsight') ||
    d.includes('khanacademy') ||
    d.includes('codecademy') ||
    d.includes('freecodecamp') ||
    d.includes('udacity') ||
    d.includes('skillshare') ||
    d.includes('masterclass') ||
    d.includes('duolingo') ||
    d.includes('brilliant') ||
    d.includes('wikipedia') ||
    d.includes('quizlet')
  ) return 'Learning';

  return 'Websites';
};

export const getFaviconUrl = (domain: string): string => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
};

export const ensureUrlProtocol = (url: string): string => {
  if (!/^https?:\/\//i.test(url)) {
    return 'https://' + url;
  }
  return url;
};