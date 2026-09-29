export interface UnionFindLog {
  action: 'find' | 'union';
  elementA: string;
  elementB?: string;
  rootA: string;
  rootB?: string;
  pathCompressed: boolean;
  description: string;
  timeComplexity: string;
}

export class DisjointSet {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();
  private groupNames: Map<string, string> = new Map();
  private logs: UnionFindLog[] = [];

  constructor() {}

  public getLogs(): UnionFindLog[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * MakeSet: Create a singleton set for a study group / student pod
   */
  public makeSet(id: string, name: string): void {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
      this.rank.set(id, 0);
      this.groupNames.set(id, name);
    }
  }

  /**
   * Find with Path Compression.
   * Time Complexity: Amortized O(α(N)) ~ O(1)
   */
  public find(id: string): string {
    if (!this.parent.has(id)) return id;

    const originalParent = this.parent.get(id)!;
    if (originalParent !== id) {
      const root = this.find(originalParent);
      if (originalParent !== root) {
        // Path Compression step!
        this.parent.set(id, root);
        this.logs.push({
          action: 'find',
          elementA: id,
          rootA: root,
          pathCompressed: true,
          description: `⚡ Path Compression: Attached group "${this.groupNames.get(id)}" directly to community root "${this.groupNames.get(root)}"`,
          timeComplexity: 'Amortized O(α(N)) -> O(1)',
        });
      }
      return root;
    }
    return id;
  }

  /**
   * Union by Rank: Merge two study groups into a connected academic cluster.
   * Time Complexity: Amortized O(α(N)) ~ O(1)
   */
  public union(id1: string, id2: string): boolean {
    const root1 = this.find(id1);
    const root2 = this.find(id2);

    if (root1 === root2) {
      this.logs.push({
        action: 'union',
        elementA: id1,
        elementB: id2,
        rootA: root1,
        rootB: root2,
        pathCompressed: false,
        description: `Groups "${this.groupNames.get(id1)}" and "${this.groupNames.get(id2)}" are ALREADY in the same cluster root (${this.groupNames.get(root1)}).`,
        timeComplexity: 'O(1)',
      });
      return false;
    }

    const rank1 = this.rank.get(root1) || 0;
    const rank2 = this.rank.get(root2) || 0;

    if (rank1 < rank2) {
      this.parent.set(root1, root2);
      this.logs.push({
        action: 'union',
        elementA: id1,
        elementB: id2,
        rootA: root1,
        rootB: root2,
        pathCompressed: false,
        description: `Merged "${this.groupNames.get(root1)}" under taller root "${this.groupNames.get(root2)}" (Union by Rank)`,
        timeComplexity: 'Amortized O(α(N)) ~ O(1)',
      });
    } else if (rank1 > rank2) {
      this.parent.set(root2, root1);
      this.logs.push({
        action: 'union',
        elementA: id1,
        elementB: id2,
        rootA: root1,
        rootB: root2,
        pathCompressed: false,
        description: `Merged "${this.groupNames.get(root2)}" under taller root "${this.groupNames.get(root1)}" (Union by Rank)`,
        timeComplexity: 'Amortized O(α(N)) ~ O(1)',
      });
    } else {
      this.parent.set(root2, root1);
      this.rank.set(root1, rank1 + 1);
      this.logs.push({
        action: 'union',
        elementA: id1,
        elementB: id2,
        rootA: root1,
        rootB: root2,
        pathCompressed: false,
        description: `Merged equal rank trees: Attached "${this.groupNames.get(root2)}" under "${this.groupNames.get(root1)}" and incremented root rank to ${rank1 + 1}`,
        timeComplexity: 'Amortized O(α(N)) ~ O(1)',
      });
    }

    return true;
  }

  public getConnectedComponents(): Map<string, string[]> {
    const components: Map<string, string[]> = new Map();
    for (const id of this.parent.keys()) {
      const root = this.find(id);
      const rootName = this.groupNames.get(root) || root;
      if (!components.has(rootName)) {
        components.set(rootName, []);
      }
      components.get(rootName)!.push(this.groupNames.get(id) || id);
    }
    return components;
  }
}

export const globalStudyGroupUnionFind = new DisjointSet();
