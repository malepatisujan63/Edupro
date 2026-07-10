export interface HeapItem {
  id: string;
  title: string;
  authorName: string;
  authorCollege?: string;
  upvotes: number;
  commentsCount: number;
  category: string;
  createdAt: string;
  type: 'note' | 'question' | 'post' | 'contributor';
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'pdf';
}

export interface HeapLogStep {
  action: 'insert' | 'heapifyUp' | 'heapifyDown' | 'swap' | 'peek';
  indexA?: number;
  indexB?: number;
  description: string;
  timeComplexity: string;
}

export class MaxHeap<T extends { id: string; upvotes: number }> {
  private heap: T[] = [];
  private indexMap: Map<string, number> = new Map();
  private lastLogs: HeapLogStep[] = [];

  constructor() {}

  public get size(): number {
    return this.heap.length;
  }

  public getLogs(): HeapLogStep[] {
    return [...this.lastLogs];
  }

  public clearLogs(): void {
    this.lastLogs = [];
  }

  /**
   * Peek at the highest-priority item.
   * Time Complexity: O(1)
   */
  public peek(): T | undefined {
    this.lastLogs.push({
      action: 'peek',
      indexA: 0,
      description: `Peeked top element at root [0]: upvotes=${this.heap[0]?.upvotes ?? 'N/A'}`,
      timeComplexity: 'O(1)',
    });
    return this.heap[0];
  }

  /**
   * Get all items sorted by upvotes in O(N log N) or return raw heap array O(1).
   */
  public getRawArray(): T[] {
    return [...this.heap];
  }

  public getTopK(k: number): T[] {
    // Return copy sorted by upvotes descending
    return [...this.heap].sort((a, b) => b.upvotes - a.upvotes).slice(0, k);
  }

  /**
   * Insert a new post/contributor into the Max-Heap.
   * Time Complexity: O(log N)
   */
  public insert(item: T): void {
    if (this.indexMap.has(item.id)) {
      this.updateUpvotes(item.id, item.upvotes);
      return;
    }

    this.clearLogs();
    const index = this.heap.length;
    this.heap.push(item);
    this.indexMap.set(item.id, index);

    this.lastLogs.push({
      action: 'insert',
      indexA: index,
      description: `Inserted "${item.id}" at bottom leaf index [${index}] with upvotes=${item.upvotes}`,
      timeComplexity: 'O(1) insertion -> O(log N) heapifyUp',
    });

    this.heapifyUp(index);
  }

  /**
   * Update upvotes for an item and rebalance heap.
   * Time Complexity: O(log N)
   */
  public updateUpvotes(id: string, newUpvotes: number): void {
    const index = this.indexMap.get(id);
    if (index === undefined) return;

    const oldUpvotes = this.heap[index].upvotes;
    this.heap[index].upvotes = newUpvotes;
    this.clearLogs();

    if (newUpvotes > oldUpvotes) {
      this.lastLogs.push({
        action: 'heapifyUp',
        indexA: index,
        description: `Upvotes increased (${oldUpvotes} -> ${newUpvotes}) at index [${index}]. Triggering heapifyUp.`,
        timeComplexity: 'O(log N)',
      });
      this.heapifyUp(index);
    } else if (newUpvotes < oldUpvotes) {
      this.lastLogs.push({
        action: 'heapifyDown',
        indexA: index,
        description: `Upvotes decreased (${oldUpvotes} -> ${newUpvotes}) at index [${index}]. Triggering heapifyDown.`,
        timeComplexity: 'O(log N)',
      });
      this.heapifyDown(index);
    }
  }

  /**
   * Remove maximum element.
   * Time Complexity: O(log N)
   */
  public extractMax(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const max = this.heap[0];
    const last = this.heap.pop()!;
    this.indexMap.delete(max.id);

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.indexMap.set(last.id, 0);
      this.heapifyDown(0);
    }
    return max;
  }

  private heapifyUp(index: number): void {
    let currentIndex = index;
    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2);
      if (this.heap[currentIndex].upvotes > this.heap[parentIndex].upvotes) {
        this.swap(currentIndex, parentIndex);
        currentIndex = parentIndex;
      } else {
        break;
      }
    }
  }

  private heapifyDown(index: number): void {
    let currentIndex = index;
    const length = this.heap.length;

    while (true) {
      const leftIndex = 2 * currentIndex + 1;
      const rightIndex = 2 * currentIndex + 2;
      let largestIndex = currentIndex;

      if (leftIndex < length && this.heap[leftIndex].upvotes > this.heap[largestIndex].upvotes) {
        largestIndex = leftIndex;
      }
      if (rightIndex < length && this.heap[rightIndex].upvotes > this.heap[largestIndex].upvotes) {
        largestIndex = rightIndex;
      }

      if (largestIndex !== currentIndex) {
        this.swap(currentIndex, largestIndex);
        currentIndex = largestIndex;
      } else {
        break;
      }
    }
  }

  private swap(indexA: number, indexB: number): void {
    const temp = this.heap[indexA];
    this.heap[indexA] = this.heap[indexB];
    this.heap[indexB] = temp;

    this.indexMap.set(this.heap[indexA].id, indexA);
    this.indexMap.set(this.heap[indexB].id, indexB);

    this.lastLogs.push({
      action: 'swap',
      indexA,
      indexB,
      description: `Swapped index [${indexA}] (${this.heap[indexA].upvotes} upvotes) with parent/child [${indexB}] (${this.heap[indexB].upvotes} upvotes)`,
      timeComplexity: 'O(1) swap inside O(log N) tree path',
    });
  }
}

// Global instance for Trending Feed
export const globalTrendingHeap = new MaxHeap<HeapItem>();
