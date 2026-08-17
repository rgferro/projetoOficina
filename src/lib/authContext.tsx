"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AccessLevel,
  EmployeeUser,
  ROLE_CONFIG,
  DEFAULT_PERMISSIONS_MAP,
  SYSTEM_MODULES,
  SystemModule,
} from "./permissions";

export { ROLE_CONFIG, DEFAULT_PERMISSIONS_MAP, SYSTEM_MODULES };
export type { AccessLevel, EmployeeUser, SystemModule };

interface AuthContextType {
  currentEmployee: EmployeeUser | null;
  employees: EmployeeUser[];
  isEnforced: boolean;
  setIsEnforced: (val: boolean) => void;
  permissionsMap: Record<AccessLevel, string[]>;
  togglePermission: (role: AccessLevel, moduleHref: string) => void;
  setRolePermissions: (role: AccessLevel, routes: string[]) => void;
  resetPermissions: () => void;
  canAccess: (path: string) => boolean;
  reloadEmployees: () => Promise<void>;
}

const DEFAULT_ADMIN: EmployeeUser = {
  id: "admin-master",
  name: "Proprietário",
  role: "Administrador",
  accessLevel: "ADMIN",
  active: true,
};

const AuthContext = createContext<AuthContextType>({
  currentEmployee: DEFAULT_ADMIN,
  employees: [],
  isEnforced: true,
  setIsEnforced: () => {},
  permissionsMap: DEFAULT_PERMISSIONS_MAP,
  togglePermission: () => {},
  setRolePermissions: () => {},
  resetPermissions: () => {},
  canAccess: () => true,
  reloadEmployees: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeUser | null>(DEFAULT_ADMIN);
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [isEnforced, setIsEnforced] = useState<boolean>(true);
  const [permissionsMap, setPermissionsMap] = useState<Record<AccessLevel, string[]>>(
    DEFAULT_PERMISSIONS_MAP
  );

  const reloadEmployees = async () => {
    try {
      const res = await fetch("/api/equipe");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEmployees(data);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar lista de funcionários:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Carrega dados do usuário autenticado real
      try {
        const savedUser = localStorage.getItem("torque_user");
        if (savedUser) {
          const u = JSON.parse(savedUser);
          setCurrentEmployee({
            id: u.id || "admin-owner",
            name: u.name || "Dono da Oficina",
            role: u.role || (u.isOwner ? "Proprietário" : "Administrador"),
            accessLevel: (u.accessLevel as AccessLevel) || (u.isOwner ? "ADMIN" : "MECANICO"),
            email: u.email,
            phone: u.phone,
            active: true,
          });
        }
      } catch (e) {}

      const savedPerms = localStorage.getItem("autogestao_permissions_map");
      if (savedPerms) {
        try {
          setPermissionsMap(JSON.parse(savedPerms));
        } catch (e) {}
      }
    }

    reloadEmployees();
  }, []);

  const savePermissions = (newMap: Record<AccessLevel, string[]>) => {
    setPermissionsMap(newMap);
    if (typeof window !== "undefined") {
      localStorage.setItem("autogestao_permissions_map", JSON.stringify(newMap));
    }
  };

  const togglePermission = (role: AccessLevel, moduleHref: string) => {
    const currentList = permissionsMap[role] || [];
    const isAllowed = currentList.includes(moduleHref);

    let updatedList: string[];
    if (isAllowed) {
      updatedList = currentList.filter((p) => p !== moduleHref);
    } else {
      updatedList = [...currentList, moduleHref];
    }

    const updatedMap = {
      ...permissionsMap,
      [role]: updatedList,
    };

    savePermissions(updatedMap);
  };

  const setRolePermissions = (role: AccessLevel, routes: string[]) => {
    const updatedMap = {
      ...permissionsMap,
      [role]: routes,
    };
    savePermissions(updatedMap);
  };

  const resetPermissions = () => {
    savePermissions(DEFAULT_PERMISSIONS_MAP);
  };

  const canAccess = (path: string): boolean => {
    if (!isEnforced) return true;
    if (!currentEmployee) return false;
    if (currentEmployee.accessLevel === "ADMIN") return true;

    const allowed = permissionsMap[currentEmployee.accessLevel] || [];
    return allowed.some((p) => (p === "/dashboard" ? path === "/dashboard" : path.startsWith(p)));
  };

  return (
    <AuthContext.Provider
      value={{
        currentEmployee,
        employees,
        isEnforced,
        setIsEnforced,
        permissionsMap,
        togglePermission,
        setRolePermissions,
        resetPermissions,
        canAccess,
        reloadEmployees,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
