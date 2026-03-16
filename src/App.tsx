import { BrowserRouter, useLocation } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { ContentProvider } from "./contexts/ContentContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import TerminalLayout from "./components/feature/TerminalLayout";

function LayoutWrapper() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return <AppRoutes />;
  }

  return (
    <TerminalLayout currentView={location.pathname}>
      <AppRoutes />
    </TerminalLayout>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <ContentProvider>
          <BrowserRouter basename={__BASE_PATH__}>
            <LayoutWrapper />
          </BrowserRouter>
        </ContentProvider>
      </LanguageProvider>
    </I18nextProvider>
  );
}

export default App;
