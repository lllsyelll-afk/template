import { Route } from "wouter";
import { LanguageProvider } from "../components/LanguageContext";
import { ThemeProvider } from "./components/ThemeContext";


// Main App Component
export const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Route path="*">
          <div className="min-h-screen bg-background"></div>
        </Route>
      </LanguageProvider>
    </ThemeProvider>
  );
};
