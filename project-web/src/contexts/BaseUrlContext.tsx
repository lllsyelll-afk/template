import { createContext, useContext, useState, ReactNode } from "react";

interface BaseUrlContextType {
  showBaseUrlPopup: boolean;
  openBaseUrlPopup: () => void;
  closeBaseUrlPopup: () => void;
}

const BaseUrlContext = createContext<BaseUrlContextType | undefined>(undefined);

export function BaseUrlProvider({ children }: { children: ReactNode }) {
  const [showBaseUrlPopup, setShowBaseUrlPopup] = useState(false);

  const openBaseUrlPopup = () => setShowBaseUrlPopup(true);
  const closeBaseUrlPopup = () => setShowBaseUrlPopup(false);

  return (
    <BaseUrlContext.Provider
      value={{ showBaseUrlPopup, openBaseUrlPopup, closeBaseUrlPopup }}
    >
      {children}
    </BaseUrlContext.Provider>
  );
}

export function useBaseUrlPopup() {
  const context = useContext(BaseUrlContext);
  if (!context) {
    throw new Error("useBaseUrlPopup must be used within BaseUrlProvider");
  }
  return context;
}
