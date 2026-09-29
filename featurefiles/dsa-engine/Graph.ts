export interface StudentNode {
  id: string;
  name: string;
  college: string;
  department: string;
  semester: number;
  avatarUrl: string;
  role: 'student' | 'senior' | 'mentor';
  reputationPoints: number;
  badges: string[];
}

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  timestamp: string;
}

export interface BFSPathResult {
  path: string[];
  distance: number;
  visitedNodesCount: number;
  stepsLog: string[];
  executionTimeMs: number;
}

export class SocialGraph {
  private adjacencyList: Map<string, Set<string>> = new Map();
  private studentNodes: Map<string, StudentNode> = new Map();
  private friendRequests: Map<string, FriendRequest> = new Map();

  constructor() {}

  /**
   * Add a student node to the social network graph
   * Time Complexity: O(1)
   */
  public addStudent(student: StudentNode): void {
    if (!this.studentNodes.has(student.id)) {
      this.studentNodes.set(student.id, student);
      this.adjacencyList.set(student.id, new Set());
    }
  }

  public getStudent(id: string): StudentNode | undefined {
    return this.studentNodes.get(id);
  }

  public getAllStudents(): StudentNode[] {
    return Array.from(this.studentNodes.values());
  }

  /**
   * Add undirected friend edge (O(1))
   */
  public addConnection(id1: string, id2: string): void {
    if (!this.adjacencyList.has(id1) || !this.adjacencyList.has(id2)) return;
    this.adjacencyList.get(id1)!.add(id2);
    this.adjacencyList.get(id2)!.add(id1);
  }

  public getNeighbors(id: string): StudentNode[] {
    const neighborIds = this.adjacencyList.get(id) || new Set();
    return Array.from(neighborIds).map((nId) => this.studentNodes.get(nId)!).filter(Boolean);
  }

  public getFriends(id: string): StudentNode[] {
    return this.getNeighbors(id);
  }

  /**
   * Send Friend Request state machine (PENDING -> ACCEPTED)
   */
  public sendFriendRequest(fromId: string, toId: string): FriendRequest {
    const reqId = `req_${fromId}_${toId}_${Date.now()}`;
    const request: FriendRequest = {
      id: reqId,
      fromId,
      toId,
      status: 'PENDING',
      timestamp: new Date().toLocaleTimeString(),
    };
    this.friendRequests.set(reqId, request);
    return request;
  }

  public acceptFriendRequest(arg1: string, arg2?: string): boolean {
    if (arg2) {
      // Called with (userId, senderId)
      this.addConnection(arg1, arg2);
      for (const req of this.friendRequests.values()) {
        if ((req.fromId === arg2 && req.toId === arg1) || (req.fromId === arg1 && req.toId === arg2)) {
          req.status = 'ACCEPTED';
        }
      }
      return true;
    } else {
      const req = this.friendRequests.get(arg1);
      if (!req || req.status !== 'PENDING') return false;
      req.status = 'ACCEPTED';
      this.addConnection(req.fromId, req.toId);
      return true;
    }
  }

  public getPendingRequestsFor(userId: string): FriendRequest[] {
    return Array.from(this.friendRequests.values()).filter(
      (r) => r.toId === userId && r.status === 'PENDING'
    );
  }

  public getFriendRequests(userId?: string): any[] {
    const reqs = userId ? this.getPendingRequestsFor(userId) : Array.from(this.friendRequests.values()).filter(r => r.status === 'PENDING');
    return reqs.map(r => {
      const sender = this.studentNodes.get(r.fromId);
      return {
        id: r.fromId,
        reqId: r.id,
        name: sender?.name || `Student (${r.fromId})`,
        college: sender?.college ? `${sender.college} • ${sender.department}` : 'Campus Student',
        avatarUrl: sender?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      };
    });
  }

  /**
   * Run BFS traversal returning student names in discovery order ($O(V+E)$)
   */
  public runBFS(startId: string): string[] {
    if (!this.studentNodes.has(startId)) {
      const all = Array.from(this.studentNodes.values());
      return all.map(s => s.name);
    }
    const order: string[] = [];
    const queue: string[] = [startId];
    const visited: Set<string> = new Set([startId]);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const node = this.studentNodes.get(curr);
      if (node) order.push(node.name);

      const neighbors = this.adjacencyList.get(curr) || new Set();
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }
    return order;
  }

  /**
   * Breadth-First Search (BFS) to find shortest connection path between two students.
   * Time Complexity: O(V + E)
   * Space Complexity: O(V)
   */
  public bfsPath(startId: string, targetId: string): BFSPathResult {
    const startTime = performance.now();
    const stepsLog: string[] = [];

    if (!this.studentNodes.has(startId) || !this.studentNodes.has(targetId)) {
      return { path: [], distance: -1, visitedNodesCount: 0, stepsLog: ['Error: Nodes not in graph'], executionTimeMs: 0 };
    }

    if (startId === targetId) {
      return { path: [startId], distance: 0, visitedNodesCount: 1, stepsLog: ['Target is starting node'], executionTimeMs: 0 };
    }

    const queue: string[] = [startId];
    const visited: Set<string> = new Set([startId]);
    const parentMap: Map<string, string> = new Map();

    stepsLog.push(`BFS Queue Init: [${this.studentNodes.get(startId)?.name}]`);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentName = this.studentNodes.get(currentId)?.name || currentId;

      if (currentId === targetId) {
        stepsLog.push(`🎯 Found Target: [${currentName}]! Reconstructing path along parent pointers.`);
        break;
      }

      const neighbors = this.adjacencyList.get(currentId) || new Set();
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          parentMap.set(neighborId, currentId);
          queue.push(neighborId);
          stepsLog.push(`→ Visited neighbor [${this.studentNodes.get(neighborId)?.name}] from [${currentName}]`);
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | undefined = targetId;
    if (!parentMap.has(targetId)) {
      return {
        path: [],
        distance: -1,
        visitedNodesCount: visited.size,
        stepsLog: [...stepsLog, `❌ No connection path exists between nodes.`],
        executionTimeMs: Number((performance.now() - startTime).toFixed(4)),
      };
    }

    while (curr) {
      path.unshift(curr);
      curr = parentMap.get(curr);
    }

    return {
      path,
      distance: path.length - 1,
      visitedNodesCount: visited.size,
      stepsLog,
      executionTimeMs: Number((performance.now() - startTime).toFixed(4)),
    };
  }
}

// Global social graph instance
export const globalSocialGraph = new SocialGraph();
