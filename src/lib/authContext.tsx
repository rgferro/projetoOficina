"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AccessLevel,
  EmployeeUser,
  ROLE_CONFIG,
  DEFAULT_PERMISSIONS_MAP,
  SYSTEM_MODULES,
  SystemModule,
  SaaSPlan,
  isRouteAllowedForPlan,
} from "./permissions";

export { ROLE_CONFIG, DEFAULT_PERMISSIONS_MAP, SYSTEM_MODULES };
export type { AccessLevel, EmployeeUser, SystemModule };

interface AuthContextType {
  currentEmployee: EmployeeUser | null;
  currentPlan: SaaSPlan;
  employees: EmployeeUser[];
  isEnforced: boolean;
  setIsEnforced: (val: boolean) => void;
  permissionsMap: Record<AccessLevel, string[]>;
  togglePermission: (role: AccessLevel, moduleHref: string) => void;
  setRolePermissions: (role: AccessLevel, routes: string[]) => void;
  resetPermissions: () => void;
  canAccess: (path: string) => boolean;
  reloadEmployees: () => Promise<void>;
  updateCurrentUser: (user: Partial<EmployeeUser>) => void;
  syncUserProfile: () => Promise<void>;
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
  currentPlan: "STARTER",
  employees: [],
  isEnforced: true,
  setIsEnforced: () => {},
  permissionsMap: DEFAULT_PERMISSIONS_MAP,
  togglePermission: () => {},
  setRolePermissions: () => {},
  resetPermissions: () => {},
  canAccess: () => true,
  reloadEmployees: async () => {},
  updateCurrentUser: () => {},
  syncUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeUser | null>(DEFAULT_ADMIN);
  const [currentPlan, setCurrentPlan] = useState<SaaSPlan>("STARTER");
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [isEnforced, setIsEnforced] = useState<boolean>(true);
  const [permissionsMap, setPermissionsMap] = useState<Record<AccessLevel, string[]>>(
    DEFAULT_PERMISSIONS_MAP
  );

  const updateCurrentUser = (updatedUser: Partial<EmployeeUser>) => {
    setCurrentEmployee((prev) => {
      if (!prev) return null;
      const merged: EmployeeUser = {
        ...prev,
        ...updatedUser,
        accessLevel: (updatedUser.accessLevel || prev.accessLevel) as AccessLevel,
      };
      if (typeof window !== "undefined") {
        try {
          const savedUser = localStorage.getItem("torque_user");
          const parsed = savedUser ? JSON.parse(savedUser) : {};
          const nextSaved = { ...parsed, ...merged };
          localStorage.setItem("torque_user", JSON.stringify(nextSaved));
          if (nextSaved.plan === "STARTER" || nextSaved.plan === "PRO" || nextSaved.plan === "ELITE") {
            setCurrentPlan(nextSaved.plan);
          }
          window.dispatchEvent(new CustomEvent("torque:user-updated", { detail: nextSaved }));
        } catch (e) {}
      }
      return merged;
    });
  };

  const syncUserProfile = async () => {
    try {
      const res = await fetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const u = data.user;
          const freshEmployee: EmployeeUser = {
            id: u.id,
            name: u.name,
            role: u.role,
            accessLevel: u.accessLevel as AccessLevel,
            plan: u.plan,
            email: u.email,
            phone: u.phone,
            active: u.active !== undefined ? u.active : true,
          };
          setCurrentEmployee(freshEmployee);
          if (u.plan === "STARTER" || u.plan === "PRO" || u.plan === "ELITE") {
            setCurrentPlan(u.plan);
          }
          if (typeof window !== "undefined") {
            const savedUser = localStorage.getItem("torque_user");
            const parsed = savedUser ? JSON.parse(savedUser) : {};
            const nextSaved = { ...parsed, ...u, accessLevel: u.accessLevel, role: u.role };
            localStorage.setItem("torque_user", JSON.stringify(nextSaved));
            window.dispatchEvent(new CustomEvent("torque:user-updated", { detail: nextSaved }));
          }
        }
      }
    } catch (err) {
      console.error("Erro ao sincronizar perfil do usuário:", err);
    }
  };

  const reloadEmployees = async () => {
    try {
      const res = await fetch("/api/equipe");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEmployees(data);
          if (typeof window !== "undefined") {
            try {
              const savedUser = localStorage.getItem("torque_user");
              if (savedUser) {
                const u = JSON.parse(savedUser);
                const matching = data.find(
                  (emp: any) =>
                    emp.id === u.id ||
                    (emp.email && u.email && emp.email.toLowerCase() === u.email.toLowerCase())
                );
                if (matching) {
                  const updated: EmployeeUser = {
                    id: matching.id,
                    name: matching.name,
                    role: matching.role,
                    accessLevel: matching.accessLevel as AccessLevel,
                    email: matching.email,
                    phone: matching.phone,
                    active: matching.active,
                  };
                  setCurrentEmployee(updated);
                  const nextSaved = { ...u, ...updated };
                  localStorage.setItem("torque_user", JSON.stringify(nextSaved));
                  window.dispatchEvent(
                    new CustomEvent("torque:user-updated", { detail: nextSaved })
                  );
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar lista de funcionários:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Carrega dados do usuário autenticado real de forma síncrona para evitar flicker
      try {
        const savedUser = localStorage.getItem("torque_user");
        if (savedUser) {
          const u = JSON.parse(savedUser);
          setCurrentEmployee({
            id: u.id || "admin-owner",
            name: u.name || "Dono da Oficina",
            role: u.role || (u.isOwner ? "Proprietário" : "Administrador"),
            accessLevel: (u.accessLevel as AccessLevel) || (u.isOwner ? "ADMIN" : "MECANICO"),
            plan: u.plan,
            email: u.email,
            phone: u.phone,
            active: true,
          });
          if (u.plan === "STARTER" || u.plan === "PRO" || u.plan === "ELITE") {
            setCurrentPlan(u.plan);
          }
        }
      } catch (e) {}

      const savedPerms = localStorage.getItem("autogestao_permissions_map");
      if (savedPerms) {
        try {
          setPermissionsMap(JSON.parse(savedPerms));
        } catch (e) {}
      }

      const handleUserUpdated = (e: any) => {
        const u = e.detail;
        if (u) {
          setCurrentEmployee((prev) => ({
            id: u.id || prev?.id || "admin-owner",
            name: u.name || prev?.name || "Usuário",
            role: u.role || prev?.role || "Colaborador",
            accessLevel: (u.accessLevel as AccessLevel) || prev?.accessLevel || "MECANICO",
            plan: (u.plan as SaaSPlan) || prev?.plan || "STARTER",
            email: u.email || prev?.email,
            phone: u.phone || prev?.phone,
            active: u.active !== undefined ? u.active : (prev?.active ?? true),
          }));
          if (u.plan === "STARTER" || u.plan === "PRO" || u.plan === "ELITE") {
            setCurrentPlan(u.plan);
          }
        }
      };

      window.addEventListener("torque:user-updated", handleUserUpdated);

      // Revalida em segundo plano contra o servidor para garantir permissões frescas
      syncUserProfile();
      reloadEmployees();

      return () => {
        window.removeEventListener("torque:user-updated", handleUserUpdated);
      };
    }
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
    const planAllowed = isRouteAllowedForPlan(currentPlan, path);
    if (!planAllowed) return false;

    if (currentEmployee.accessLevel === "ADMIN") return true;

    const allowed = permissionsMap[currentEmployee.accessLevel] || [];
    return allowed.some((p) => (p === "/dashboard" ? path === "/dashboard" : path.startsWith(p)));
  };

  return (
    <AuthContext.Provider
      value={{
        currentEmployee,
        currentPlan,
        employees,
        isEnforced,
        setIsEnforced,
        permissionsMap,
        togglePermission,
        setRolePermissions,
        resetPermissions,
        canAccess,
        reloadEmployees,
        updateCurrentUser,
        syncUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
