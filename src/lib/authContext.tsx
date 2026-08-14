"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AccessLevel,
  EmployeeUser,
  ROLE_CONFIG,
  PERMISSIONS_MAP,
} from "./permissions";

export { ROLE_CONFIG, PERMISSIONS_MAP };
export type { AccessLevel, EmployeeUser };

interface AuthContextType {
  currentEmployee: EmployeeUser | null;
  employees: EmployeeUser[];
  isEnforced: boolean;
  setIsEnforced: (val: boolean) => void;
  canAccess: (path: string) => boolean;
  switchEmployee: (employee: EmployeeUser) => void;
  reloadEmployees: () => Promise<void>;
  loginWithPin: (employeeId: string, pin: string) => { success: boolean; message?: string };
}

const DEFAULT_ADMIN: EmployeeUser = {
  id: "admin-master",
  name: "Administrador Geral",
  role: "Diretoria",
  accessLevel: "ADMIN",
  pinCode: "1234",
  active: true,
};

const AuthContext = createContext<AuthContextType>({
  currentEmployee: DEFAULT_ADMIN,
  employees: [],
  isEnforced: false,
  setIsEnforced: () => {},
  canAccess: () => true,
  switchEmployee: () => {},
  reloadEmployees: async () => {},
  loginWithPin: () => ({ success: true }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeUser | null>(DEFAULT_ADMIN);
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [isEnforced, setIsEnforced] = useState<boolean>(false);

  const reloadEmployees = async () => {
    try {
      const res = await fetch("/api/equipe");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);

        if (!currentEmployee || currentEmployee.id === "admin-master") {
          const firstAdmin = data.find((e: EmployeeUser) => e.accessLevel === "ADMIN" && e.active);
          if (firstAdmin) {
            setCurrentEmployee(firstAdmin);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar lista de funcionários:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmp = localStorage.getItem("autogestao_current_employee");
      if (savedEmp) {
        try {
          setCurrentEmployee(JSON.parse(savedEmp));
        } catch (e) {}
      }

      const savedEnforced = localStorage.getItem("autogestao_is_enforced");
      if (savedEnforced !== null) {
        setIsEnforced(savedEnforced === "true");
      }
    }

    reloadEmployees();
  }, []);

  const switchEmployee = (employee: EmployeeUser) => {
    setCurrentEmployee(employee);
    if (typeof window !== "undefined") {
      localStorage.setItem("autogestao_current_employee", JSON.stringify(employee));
    }
  };

  const updateEnforced = (val: boolean) => {
    setIsEnforced(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("autogestao_is_enforced", String(val));
    }
  };

  const canAccess = (path: string): boolean => {
    if (!isEnforced) return true;
    if (!currentEmployee) return false;
    if (currentEmployee.accessLevel === "ADMIN") return true;

    const allowed = PERMISSIONS_MAP[currentEmployee.accessLevel] || [];
    return allowed.some((p) => (p === "/" ? path === "/" : path.startsWith(p)));
  };

  const loginWithPin = (employeeId: string, pin: string) => {
    const target = employees.find((e) => e.id === employeeId);
    if (!target) return { success: false, message: "Funcionário não encontrado." };

    if (target.pinCode && target.pinCode !== pin) {
      return { success: false, message: "PIN / Senha incorreta." };
    }

    switchEmployee(target);
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentEmployee,
        employees,
        isEnforced,
        setIsEnforced: updateEnforced,
        canAccess,
        switchEmployee,
        reloadEmployees,
        loginWithPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
