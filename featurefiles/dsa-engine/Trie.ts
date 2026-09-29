export interface TrieItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'user' | 'subject' | 'note' | 'question' | 'group' | 'post' | 'contributor';
  url?: string;
  tags?: string[];
  avatarUrl?: string;
}

export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
  items: TrieItem[] = [];
}

export interface TrieSearchResult {
  results: TrieItem[];
  latencyMs: number;
  nodesTraversed: number;
  pathString: string;
}

export class Trie {
  root: TrieNode = new TrieNode();
  totalInserted: number = 0;

  constructor() {}

  /**
   * Insert a keyword and associate a TrieItem with it.
   * Time Complexity: O(L) where L is the length of the word.
   */
  insert(word: string, item: TrieItem): void {
    const cleanWord = word.toLowerCase().trim();
    if (!cleanWord) return;

    let currentNode = this.root;
    for (const char of cleanWord) {
      if (!currentNode.children.has(char)) {
        currentNode.children.set(char, new TrieNode());
      }
      currentNode = currentNode.children.get(char)!;
    }
    currentNode.isEndOfWord = true;
    // Avoid duplicate item IDs
    if (!currentNode.items.some((i) => i.id === item.id)) {
      currentNode.items.push(item);
    }
    this.totalInserted++;
  }

  /**
   * Index multiple attributes of an item (title, tags, subtitle) into the Trie.
   */
  indexItem(item: TrieItem): void {
    // Index full title words
    const words = item.title.split(/\s+/);
    words.forEach((w) => this.insert(w, item));
    // Index full exact title
    this.insert(item.title, item);
    // Index tags
    if (item.tags) {
      item.tags.forEach((tag) => this.insert(tag, item));
    }
    // Index subtitle if present
    if (item.subtitle) {
      item.subtitle.split(/\s+/).forEach((w) => this.insert(w, item));
    }
  }

  /**
   * Search prefix and collect all items in the subtree.
   * Time Complexity: O(L + K) where L is prefix length and K is items collected.
   */
  searchPrefix(prefix: string, maxResults: number = 12): TrieSearchResult {
    const startTime = performance.now();
    const cleanPrefix = prefix.toLowerCase().trim();
    
    if (!cleanPrefix) {
      return {
        results: [],
        latencyMs: 0,
        nodesTraversed: 0,
        pathString: 'root (empty query)',
      };
    }

    let currentNode = this.root;
    let nodesTraversed = 0;
    let pathString = 'root';

    for (const char of cleanPrefix) {
      nodesTraversed++;
      pathString += ` → [${char}]`;
      if (!currentNode.children.has(char)) {
        const latencyMs = Number((performance.now() - startTime).toFixed(4));
        return {
          results: [],
          latencyMs,
          nodesTraversed,
          pathString: pathString + ' (Not Found)',
        };
      }
      currentNode = currentNode.children.get(char)!;
    }

    // Collect from subtree using BFS/DFS
    const resultsMap = new Map<string, TrieItem>();
    const queue: TrieNode[] = [currentNode];

    while (queue.length > 0 && resultsMap.size < maxResults) {
      const node = queue.shift()!;
      nodesTraversed++;
      if (node.isEndOfWord) {
        for (const item of node.items) {
          if (!resultsMap.has(item.id)) {
            resultsMap.set(item.id, item);
            if (resultsMap.size >= maxResults) break;
          }
        }
      }
      for (const childNode of node.children.values()) {
        queue.push(childNode);
      }
    }

    const latencyMs = Number((performance.now() - startTime).toFixed(4));
    return {
      results: Array.from(resultsMap.values()),
      latencyMs,
      nodesTraversed,
      pathString,
    };
  }

  /**
   * Clear all indexed items
   */
  clear(): void {
    this.root = new TrieNode();
    this.totalInserted = 0;
  }
}

// Global Singleton Trie instance for real-time application search
export const globalPlatformTrie = new Trie();
