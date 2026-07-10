export class UniqueRegistrationHashSet {
  private registeredEmails: Set<string> = new Set();
  private registeredPhones: Set<string> = new Set();
  private userBuckets: Map<string, any> = new Map();
  private collisionCount: number = 0;

  constructor() {}

  /**
   * Check $O(1)$ if email or phone already exists
   */
  public isEmailRegistered(email: string): boolean {
    return this.registeredEmails.has(email.toLowerCase().trim());
  }

  public isPhoneRegistered(phone: string): boolean {
    return this.registeredPhones.has(phone.trim());
  }

  /**
   * Register user in $O(1)$ constant time or return error if duplicate exists
   */
  public registerUser(email: string, phone: string, userData: any): { success: boolean; error?: string } {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    if (this.registeredEmails.has(cleanEmail)) {
      this.collisionCount++;
      return { success: false, error: `$O(1)$ Hash Collision/Constraint: Email "${cleanEmail}" is already registered on this platform!` };
    }
    if (this.registeredPhones.has(cleanPhone)) {
      this.collisionCount++;
      return { success: false, error: `$O(1)$ Hash Collision/Constraint: Phone Number "${cleanPhone}" is already associated with another student account!` };
    }

    this.registeredEmails.add(cleanEmail);
    this.registeredPhones.add(cleanPhone);
    this.userBuckets.set(userData.id || cleanEmail, userData);
    return { success: true };
  }

  public getStats() {
    return {
      totalUsersCached: this.userBuckets.size,
      totalEmails: this.registeredEmails.size,
      totalPhones: this.registeredPhones.size,
      collisionCount: this.collisionCount,
      timeComplexity: 'O(1) Murmur3 / FNV-1a Hashing',
    };
  }
}

export const globalRegistrationHash = new UniqueRegistrationHashSet();
