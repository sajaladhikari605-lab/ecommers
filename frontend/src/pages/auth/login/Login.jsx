import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { STATUSES } from "../../../globals/mis/statuses"
import { loginUser } from "../../../store/authSlice"
import "../authPages.css"

export default function Login() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { status } = useSelector((state) => state.auth)
  const [errorMessage, setErrorMessage] = useState("")
  const [credentials, setCredentials] = useState({ userEmail: "", userPassword: "" })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage("")
    try {
      await dispatch(loginUser(credentials))
      navigate("/")
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to sign in. Check your email and password.")
    }
  }

  return (
    <main className="scms-auth-shell">
      <Link to="/" className="scms-auth-brand"><span className="auth-mark">S</span><span><strong>SCMS</strong><small>SMART COLLEGE MANAGEMENT SYSTEM</small></span></Link>
      <section className="scms-auth-card">
        <p className="auth-eyebrow">CAMPUS PORTAL</p>
        <h1>Welcome back.</h1>
        <p className="auth-intro">Sign in with your college account to continue.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email address<input autoComplete="email" type="email" name="userEmail" required value={credentials.userEmail} onChange={(event) => setCredentials({ ...credentials, userEmail: event.target.value })} /></label>
          <label>Password<input autoComplete="current-password" type="password" name="userPassword" required value={credentials.userPassword} onChange={(event) => setCredentials({ ...credentials, userPassword: event.target.value })} /></label>
          {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
          <div className="auth-form-note"><Link to="/forgot-password">Forgot password?</Link></div>
          <button type="submit" disabled={status === STATUSES.LOADING}>{status === STATUSES.LOADING ? "Signing in..." : "Sign in"}<span aria-hidden="true">&rarr;</span></button>
        </form>
        <p className="auth-switch">New to SCMS? <Link to="/register">Create a student account</Link></p>
      </section>
      <footer className="auth-footer"><span>SECURE COLLEGE ACCESS</span><span>SCMS / 01</span></footer>
    </main>
  )
}