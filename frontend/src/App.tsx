import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Landing } from "./pages/Landing";
import { Voice } from "./pages/Voice";
import { Products } from "./pages/Products";
import { ShoppingList } from "./pages/ShoppingList";
import { History } from "./pages/History";
import { Home } from "./pages/Home";
import { AppLayout } from "./layouts/AppLayout";
import { AppProvider } from "./context/AppContext";

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Landing Page (No Sidebar) */}
          <Route path="/" element={
            <div className="flex min-h-screen flex-col font-sans">
              <Navbar />
              <Landing />
              <Footer />
            </div>
          } />
          
          {/* Internal Application Routes (With Sidebar) */}
          <Route path="/voice" element={<AppLayout><Voice /></AppLayout>} />
          <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
          <Route path="/list" element={<AppLayout><ShoppingList /></AppLayout>} />
          <Route path="/history" element={<AppLayout><History /></AppLayout>} />
          
          {/* Placeholders */}
          <Route path="/home" element={<AppLayout><Home /></AppLayout>} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

