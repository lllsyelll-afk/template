// State management for CLI application
export interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  photo?: string;
  blocked: boolean;
  permissions?: string[];
}

export interface Credential {
  phone: string;
  email?: string;
  password: string;
  name: string;
}

export class CliState {
  private _cliApiKey: string | null = null;
  private _authToken: string | null = null;
  private _currentUser: User | null = null;
  private _createdCredentials: Credential[] = [];

  // CLI API Key
  get cliApiKey(): string | null {
    return this._cliApiKey;
  }

  set cliApiKey(value: string | null) {
    this._cliApiKey = value;
  }

  // Auth Token
  get authToken(): string | null {
    return this._authToken;
  }

  set authToken(value: string | null) {
    this._authToken = value;
  }

  // Current User
  get currentUser(): User | null {
    return this._currentUser;
  }

  set currentUser(value: User | null) {
    this._currentUser = value;
  }

  // Created Credentials
  get createdCredentials(): Credential[] {
    return [...this._createdCredentials];
  }

  addCredential(credential: Credential): void {
    this._createdCredentials.push(credential);
  }

  clearCredentials(): void {
    this._createdCredentials = [];
  }

  // Authentication helpers
  isAuthenticated(): boolean {
    return this._authToken !== null && this._currentUser !== null;
  }

  // Clear all state (logout)
  clear(): void {
    this._cliApiKey = null;
    this._authToken = null;
    this._currentUser = null;
    this._createdCredentials = [];
  }

  // Get state summary for debugging
  getSummary(): object {
    return {
      hasApiKey: !!this._cliApiKey,
      hasAuthToken: !!this._authToken,
      currentUser: this._currentUser ? {
        id: this._currentUser._id,
        name: this._currentUser.name,
        phone: this._currentUser.phone
      } : null,
      credentialsCount: this._createdCredentials.length
    };
  }
}

// Global state instance (singleton pattern)
export const state = new CliState();
