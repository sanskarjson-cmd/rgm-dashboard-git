import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const USERS = [
  { email:"executive@mars.com", password:"exec123",  name:"Sarah Chen",    role:"Executive", initials:"SC" },
  { email:"finance@mars.com",   password:"fin123",   name:"Alex Johnson",  role:"Finance",   initials:"AJ" },
  { email:"admin@mars.com",     password:"password123", name:"Alex Johnson", role:"Finance", initials:"AJ" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    const found = USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
    if (found) { setUser({ ...found }); return { success: true }; }
    return { success: false, error: "Invalid email or password." };
  };

  const logout = () => setUser(null);
  const updatePersona = (persona) => setUser(u => ({ ...u, role: persona }));

  return (
    <AuthContext.Provider value={{ user, login, logout, updatePersona }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);