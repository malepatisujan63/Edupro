export interface CommentNode {
  id: string;
  authorName: string;
  authorCollege: string;
  content: string;
  upvotes: number;
  timestamp: string;
  isAcceptedAnswer?: boolean;
  children: CommentNode[];
}

export class NaryCommentTree {
  private rootComments: CommentNode[] = [];
  private nodeMap: Map<string, CommentNode> = new Map();

  constructor() {}

  public addRootComment(comment: CommentNode): void {
    this.rootComments.push(comment);
    this.nodeMap.set(comment.id, comment);
  }

  public addReply(parentId: string, reply: CommentNode): boolean {
    const parent = this.nodeMap.get(parentId);
    if (!parent) return false;
    parent.children.push(reply);
    this.nodeMap.set(reply.id, reply);
    return true;
  }

  public getRootComments(): CommentNode[] {
    return [...this.rootComments];
  }

  public countTotalComments(): number {
    return this.nodeMap.size;
  }
}

export interface SubjectBSTNode {
  code: string; // e.g., "CS-401"
  name: string; // e.g., "Operating Systems"
  semester: number;
  resourceCount: number;
  left: SubjectBSTNode | null;
  right: SubjectBSTNode | null;
}

export class SubjectTaxonomyBST {
  public root: SubjectBSTNode | null = null;

  constructor() {}

  /**
   * Insert subject by academic code order (BST insertion O(log N))
   */
  public insert(code: string, name: string, semester: number, resourceCount: number): void {
    const newNode: SubjectBSTNode = { code, name, semester, resourceCount, left: null, right: null };
    if (!this.root) {
      this.root = newNode;
      return;
    }

    let current = this.root;
    while (true) {
      if (code < current.code) {
        if (current.left === null) {
          current.left = newNode;
          break;
        }
        current = current.left;
      } else if (code > current.code) {
        if (current.right === null) {
          current.right = newNode;
          break;
        }
        current = current.right;
      } else {
        current.resourceCount += resourceCount;
        break;
      }
    }
  }

  /**
   * In-order traversal returning sorted subjects exactly
   */
  public getInOrderSorted(): SubjectBSTNode[] {
    const result: SubjectBSTNode[] = [];
    const traverse = (node: SubjectBSTNode | null) => {
      if (!node) return;
      traverse(node.left);
      result.push(node);
      traverse(node.right);
    };
    traverse(this.root);
    return result;
  }
}

export const globalSubjectTaxonomy = new SubjectTaxonomyBST();
