export interface LoginCredentials {
    username: string;
    password: string;
  }
  
export interface LoginResponse {
    token: string;
    role: string;
    username: string;
  }

  export interface RegisterCredentials {
    username: string;
    password: string;
    role: string;
  }

  export interface RegisterResponse {
    message: string;
  }
  