import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/auth/login/Login"
import Register from "./pages/auth/register/Register"
import ForgotPassword from "./pages/auth/forgotpassword/ForgotPassword"
import ResetPassword from "./pages/auth/resetPassword/ResetPassword"
import VerifyOtp from "./pages/auth/verifyOtp/VerifyOtp"
import CollegePortal from "./pages/college/CollegePortal"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CollegePortal />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App