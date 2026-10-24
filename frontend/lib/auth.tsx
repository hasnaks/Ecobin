'use client';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { gql, TOKEN_KEY, User } from './api';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

const USER_FIELDS = 'id name email role points totalWasteKg';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const d = await gql<{ me: User }>(`{ me { ${USER_FIELDS} } }`);
      setUser(d.me);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) refresh();
    else setLoading(false);
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const d = await gql(`mutation($e:String!,$p:String!){ login(email:$e,password:$p){ token user{ ${USER_FIELDS} } } }`, {
      e: email,
      p: password,
    });
    localStorage.setItem(TOKEN_KEY, d.login.token);
    setUser(d.login.user);
  };

  const adminLogin = async (email: string, password: string) => {
    const d = await gql(`mutation($e:String!,$p:String!){ adminLogin(email:$e,password:$p){ token user{ ${USER_FIELDS} } } }`, {
      e: email,
      p: password,
    });
    localStorage.setItem(TOKEN_KEY, d.adminLogin.token);
    setUser(d.adminLogin.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const d = await gql(
      `mutation($n:String!,$e:String!,$p:String!){ register(name:$n,email:$e,password:$p){ token user{ ${USER_FIELDS} } } }`,
      { n: name, e: email, p: password },
    );
    localStorage.setItem(TOKEN_KEY, d.register.token);
    setUser(d.register.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, adminLogin, register, logout, refresh }}>{children}</Ctx.Provider>;
}
