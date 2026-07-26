import { Route, Routes } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Scanner } from "./pages/Scanner";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Scanner />} />
    </Routes>
  );
}
