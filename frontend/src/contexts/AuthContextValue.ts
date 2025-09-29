import { createContext } from "react";
import { User } from "../types";

export interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

export type AuthAction =
    | { type: "LOGIN_START" }
    | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
    | { type: "LOGIN_FAILURE"; payload: string }
    | { type: "LOGOUT" }
    | { type: "SET_USER"; payload: User }
    | { type: "CLEAR_ERROR" };

export interface AuthContextType {
    state: AuthState;
    login: (email: string, password: string) => Promise<void>;
    register: (
        username: string,
        email: string,
        password: string,
    ) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined,
);
