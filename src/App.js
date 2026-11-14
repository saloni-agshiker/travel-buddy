import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Trips from "./pages/Trips";
import { Toaster } from "sonner";

import './App.css';
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          richColors
          position="top-right"
          closeButton
          toastOptions={{ closeButtonAriaLabel: "Dismiss notification" }}
        />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/trips" element={<Trips />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
