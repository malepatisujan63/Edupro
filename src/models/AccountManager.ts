// src/models/AccountManager.ts
// ─── Singleton Registry managing all active StudentAccount instances ───
// Java equivalent: public class AccountManager (Singleton pattern)

import { StudentAccount } from './StudentAccount';
import { type FirestoreUser } from '../lib/supabaseService';

/**
 * Singleton AccountManager — manages the lifecycle of StudentAccount objects.
 * Only one AccountManager exists per application session.
 *
 * Java equivalent:
 *   public class AccountManager {
 *     private static AccountManager instance;
 *     private Map<String, StudentAccount> accounts = new HashMap<>();
 *     private AccountManager() {}
 *     public static AccountManager getInstance() { ... }
 *   }
 */
export class AccountManager {
  private static instance: AccountManager | null = null;

  // HashMap: uid → StudentAccount  (O(1) lookup)
  private accounts: Map<string, StudentAccount> = new Map();

  // Current active session
  private _currentAccount: StudentAccount | null = null;

  // Private constructor — enforces singleton pattern
  private constructor() {}

  /** Get or create the singleton instance */
  public static getInstance(): AccountManager {
    if (!AccountManager.instance) {
      AccountManager.instance = new AccountManager();
    }
    return AccountManager.instance;
  }

  /**
   * Creates a new StudentAccount from a Firestore profile and registers it.
   * If the account already exists (same uid), returns the existing object.
   */
  public createAccount(profile: FirestoreUser): StudentAccount {
    if (this.accounts.has(profile.uid)) {
      return this.accounts.get(profile.uid)!;
    }
    const account = new StudentAccount(profile);
    this.accounts.set(profile.uid, account);
    this._currentAccount = account;
    return account;
  }

  /**
   * Retrieves an existing account by UID. Returns null if not found.
   * O(1) HashMap lookup.
   */
  public getAccount(uid: string): StudentAccount | null {
    return this.accounts.get(uid) ?? null;
  }

  /** Returns the currently logged-in account */
  public get currentAccount(): StudentAccount | null {
    return this._currentAccount;
  }

  /** Sets the current active session account */
  public setCurrentAccount(uid: string): void {
    const account = this.accounts.get(uid);
    if (account) this._currentAccount = account;
  }

  /**
   * Destroys an account from the registry on logout / account deletion.
   */
  public destroyAccount(uid: string): void {
    this.accounts.delete(uid);
    if (this._currentAccount?.uid === uid) {
      this._currentAccount = null;
    }
  }

  /** Returns total number of active account objects in memory */
  public get accountCount(): number {
    return this.accounts.size;
  }

  /** Clear all accounts (on hard reset) */
  public clearAll(): void {
    this.accounts.clear();
    this._currentAccount = null;
  }
}

// Export convenience singleton accessor
export const accountManager = AccountManager.getInstance();
