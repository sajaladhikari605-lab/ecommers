import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { STATUSES } from "../../../globals/mis/statuses"
import { registerUser } from "../../../store/authSlice"
import "../authPages.css"

const initialForm = {
  userName: "",
  userPhoneNumber: "",
  userEmail: "",
  userPassword: "",
  gender: "",
  dateOfBirth: "",
  address: "",
}

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status } = useSelector((state) => state.auth)
  const [userData, setUserData] = useState(initialForm)
  const [errorMessage, setErrorMessage] = useState("")

  const handleChange = (event) => {
    setUserData((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage("")
    try {
      await dispatch(registerUser(userData))
      navigate("/login", { state: { registered: true } })
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create your account. Please try again.")
    }
  }

  return (
    <main className="scms-auth-shell register-shell">
      <Link to="/" className="scms-auth-brand"><span className="auth-mark">S</span><span><strong>SCMS</strong><small>SMART COLLEGE MANAGEMENT SYSTEM</small></span></Link>
      <section className="scms-auth-card register-card">
        <p className="auth-eyebrow">STUDENT ACCESS</p>
        <h1>Create your account.</h1>
        <p className="auth-intro">Your account will be registered with student access.</p>
        <form onSubmit={handleSubmit} className="auth-form auth-form-grid">
          <label>Full name<input autoComplete="name" name="userName" value={userData.userName} onChange={handleChange} required /></label>
          <label>Phone<input autoComplete="tel" type="tel" name="userPhoneNumber" value={userData.userPhoneNumber} onChange={handleChange} required /></label>
          <label className="auth-span-two">Email address<input autoComplete="email" type="email" name="userEmail" value={userData.userEmail} onChange={handleChange} required /></label>
          <label>Password<input autoComplete="new-password" type="password" name="userPassword" minLength="8" value={userData.userPassword} onChange={handleChange} required /></label>
          <label>Gender<select name="gender" value={userData.gender} onChange={handleChange}><option value="">Select</option><option value="female">Female</option><option value="male">Male</option><option value="non-binary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option></select></label>
          <label>Date of birth<input type="date" name="dateOfBirth" value={userData.dateOfBirth} onChange={handleChange} /></label>
          <label className="auth-span-two">Address<input autoComplete="street-address" name="address" value={userData.address} onChange={handleChange} /></label>
          {errorMessage && <p className="auth-error auth-span-two" role="alert">{errorMessage}</p>}
          <button className="auth-span-two" type="submit" disabled={status === STATUSES.LOADING}>{status === STATUSES.LOADING ? "Creating account..." : "Create student account"}<span aria-hidden="true">&rarr;</span></button>
        </form>
        <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
      </section>
      <footer className="auth-footer"><span>SECURE COLLEGE ACCESS</span><span>SCMS / 01</span></footer>
    </main>
  )
}