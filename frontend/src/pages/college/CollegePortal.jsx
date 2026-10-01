import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useDispatch } from "react-redux"
import { APIAuth } from "../../http"
import { logOut, setToken as setAuthToken, setUser } from "../../store/authSlice"

const navigation = {
  admin: ["Overview", "Profile", "Students", "Teachers", "Departments", "Courses", "Enrollments", "Attendance", "Exams", "Marks", "Assignments", "Submissions", "Notices", "Timetable", "Fees", "Books", "Borrowing", "Events", "Settings"],
  teacher: ["Overview", "Profile", "Students", "Courses", "Attendance", "Exams", "Marks", "Assignments", "Submissions", "Notices", "Timetable"],
  student: ["Overview", "Profile", "Departments", "Courses", "Enrollments", "Attendance", "Exams", "Marks", "Assignments", "Submissions", "Timetable", "Fees", "Books", "Borrowing", "Notices", "Events"],
  accountant: ["Overview", "Profile", "Departments", "Courses", "Fees", "Books", "Borrowing", "Notices", "Events"],
}

const resources = {
  Students: {
    endpoint: "students",
    columns: [["Student ID", "studentId"], ["Student", "user.userName"], ["Email", "user.userEmail"], ["Department", "department.name"], ["Program", "program"], ["Semester", "semester"]],
    fields: [["userName", "Full name", "text"], ["userEmail", "Email", "email"], ["userPhoneNumber", "Phone", "tel"], ["userPassword", "Temporary password", "password"], ["gender", "Gender", "gender"], ["dateOfBirth", "Date of birth", "date"], ["address", "Address", "text"], ["profilePicture", "Profile picture", "upload"], ["studentId", "Student ID", "text"], ["department", "Department", "choice"], ["program", "Program", "text"], ["semester", "Semester", "number"], ["section", "Section", "text"], ["rollNumber", "Roll number", "text"], ["admissionDate", "Admission date", "date"]],
  },
  Teachers: {
    endpoint: "teachers",
    columns: [["Teacher ID", "teacherId"], ["Teacher", "user.userName"], ["Email", "user.userEmail"], ["Department", "department.name"], ["Qualification", "qualification"]],
    fields: [["userName", "Full name", "text"], ["userEmail", "Email", "email"], ["userPhoneNumber", "Phone", "tel"], ["userPassword", "Temporary password", "password"], ["teacherId", "Teacher ID", "text"], ["department", "Department", "choice"], ["qualification", "Qualification", "text"], ["joiningDate", "Joining date", "date"]],
  },
  Departments: {
    endpoint: "departments",
    columns: [["Code", "code"], ["Department", "name"], ["Description", "description"]],
    fields: [["name", "Department name", "text"], ["code", "Code", "text"], ["description", "Description", "text"]],
  },
  Courses: {
    endpoint: "courses",
    columns: [["Code", "courseCode"], ["Course", "courseName"], ["Department", "department.name"], ["Semester", "semester"], ["Credits", "creditHours"], ["Type", "courseType"]],
    fields: [["courseCode", "Course code", "text"], ["courseName", "Course name", "text"], ["description", "Description", "text"], ["creditHours", "Credit hours", "number"], ["department", "Department", "choice"], ["semester", "Semester", "number"], ["teacher", "Teacher", "choice"], ["courseType", "Course type", "courseType"]],
  },
  Enrollments: {
    endpoint: "enrollments",
    columns: [["Student", "student.studentId"], ["Course", "course.courseName"], ["Academic year", "academicYear"], ["Semester", "semester"], ["Status", "status"]],
    fields: [["student", "Student", "choice"], ["course", "Course", "choice"], ["semester", "Semester", "number"], ["academicYear", "Academic year", "text"]],
  },
  Profile: {
    path: "auth/me",
    columns: [["Photo", "profilePicture"], ["Name", "userName"], ["Email", "userEmail"], ["Phone", "userPhoneNumber"], ["Role", "userRole"], ["Address", "address"]],
    fields: [["userName", "Full name", "text"], ["userEmail", "Email", "email"], ["userPhoneNumber", "Phone", "tel"], ["gender", "Gender", "gender"], ["dateOfBirth", "Date of birth", "date"], ["address", "Address", "text"], ["profilePicture", "Profile picture", "upload"]],
    writeRoles: ["admin", "teacher", "student", "accountant"],
    createRoles: [],
    updateRoles: ["admin", "teacher", "student", "accountant"],
    deletable: false,
  },
  Attendance: {
    endpoint: "attendance",
    columns: [["Student", "student.studentId"], ["Course", "course.courseName"], ["Date", "date"], ["Status", "status"]],
    fields: [["student", "Student", "choice"], ["course", "Course", "choice"], ["teacher", "Teacher", "choice"], ["date", "Date", "date"], ["status", "Attendance status", "attendanceStatus"]],
    writeRoles: ["admin", "teacher"],
    updateRoles: ["admin", "teacher"],
  },
  Exams: {
    endpoint: "exams",
    columns: [["Exam", "name"], ["Course", "course.courseName"], ["Date", "date"], ["Semester", "semester"], ["Full marks", "fullMarks"], ["Pass marks", "passMarks"]],
    fields: [["name", "Exam name", "text"], ["course", "Course", "choice"], ["semester", "Semester", "number"], ["date", "Exam date", "date"], ["fullMarks", "Full marks", "number"], ["passMarks", "Pass marks", "number"]],
    writeRoles: ["admin", "teacher"],
  },
  Marks: {
    endpoint: "marks",
    columns: [["Student", "student.studentId"], ["Exam", "exam.name"], ["Course", "course.courseName"], ["Obtained", "total"], ["Grade", "grade"], ["Result", "result"]],
    fields: [["student", "Student", "choice"], ["exam", "Exam", "choice"], ["theoryMarks", "Theory marks", "number"], ["practicalMarks", "Practical marks", "number"]],
    writeRoles: ["admin", "teacher"],
    editable: false,
  },
  Assignments: {
    endpoint: "assignments",
    columns: [["Title", "title"], ["Course", "course.courseName"], ["Teacher", "teacher.teacherId"], ["Deadline", "deadline"], ["Attachment", "attachment"]],
    fields: [["title", "Title", "text"], ["description", "Description", "text"], ["course", "Course", "choice"], ["teacher", "Teacher", "choice"], ["deadline", "Deadline", "date"], ["attachment", "Attachment", "upload"]],
    writeRoles: ["admin", "teacher"],
  },
  Submissions: {
    endpoint: "submissions",
    columns: [["Assignment", "assignment.title"], ["Student", "student.studentId"], ["Submitted file", "attachment"], ["Submitted", "submittedAt"], ["Status", "status"], ["Marks", "marks"]],
    fields: [["assignment", "Assignment", "choice"], ["attachment", "Submission file", "upload"], ["marks", "Marks", "number"], ["feedback", "Feedback", "text"]],
    writeRoles: ["admin", "teacher", "student"],
    createRoles: ["student"],
    updateRoles: ["admin", "teacher"],
    gradeAction: true,
    deletable: false,
  },
  Notices: {
    endpoint: "notices",
    columns: [["Title", "title"], ["Category", "category"], ["Priority", "priority"], ["Published by", "publishedBy.userName"], ["Date", "date"]],
    fields: [["title", "Title", "text"], ["description", "Description", "text"], ["category", "Category", "noticeCategory"], ["priority", "Priority", "noticePriority"], ["attachment", "Attachment", "upload"]],
    writeRoles: ["admin", "teacher"],
  },
  Timetable: {
    endpoint: "timetable",
    columns: [["Day", "day"], ["Time", "startTime"], ["Course", "course.courseName"], ["Teacher", "teacher.teacherId"], ["Room", "room"], ["Semester", "semester"], ["Section", "section"]],
    fields: [["day", "Day", "weekday"], ["startTime", "Start time", "time"], ["endTime", "End time", "time"], ["course", "Course", "choice"], ["teacher", "Teacher", "choice"], ["room", "Room", "text"], ["semester", "Semester", "number"], ["section", "Section", "text"]],
    writeRoles: ["admin"],
  },
  Fees: {
    endpoint: "fees",
    columns: [["Student", "student.studentId"], ["Type", "feeType"], ["Amount", "amount"], ["Paid", "paidAmount"], ["Remaining", "remainingAmount"], ["Due date", "dueDate"], ["Status", "status"]],
    fields: [["student", "Student", "choice"], ["feeType", "Fee type", "feeType"], ["amount", "Amount", "number"], ["paidAmount", "Initial payment", "number"], ["dueDate", "Due date", "date"]],
    writeRoles: ["admin", "accountant"],
  },
  Books: {
    endpoint: "books",
    columns: [["Book ID", "bookId"], ["Title", "title"], ["Author", "author"], ["ISBN", "isbn"], ["Category", "category"], ["Available", "availableQuantity"], ["Total", "quantity"]],
    fields: [["bookId", "Book ID", "text"], ["title", "Title", "text"], ["author", "Author", "text"], ["isbn", "ISBN", "text"], ["category", "Category", "text"], ["quantity", "Quantity", "number"]],
    writeRoles: ["admin", "accountant"],
  },
  Borrowing: {
    endpoint: "borrows",
    columns: [["Student", "student.studentId"], ["Book", "book.title"], ["Issued", "issueDate"], ["Due", "dueDate"], ["Returned", "returnDate"], ["Fine", "fine"], ["Status", "status"]],
    fields: [["student", "Student", "choice"], ["book", "Book", "choice"], ["dueDate", "Due date", "date"]],
    writeRoles: ["admin", "accountant"],
    createLabel: "Issue book",
    editable: false,
    deletable: false,
    returnAction: true,
  },
  Events: {
    endpoint: "events",
    columns: [["Event", "name"], ["Image", "image"], ["Date", "date"], ["Time", "time"], ["Location", "location"], ["Organizer", "organizer"]],
    fields: [["name", "Event name", "text"], ["description", "Description", "text"], ["date", "Date", "date"], ["time", "Time", "time"], ["location", "Location", "text"], ["organizer", "Organizer", "text"], ["image", "Event image", "upload"]],
    writeRoles: ["admin"],
  },
  Settings: {
    endpoint: "settings",
    columns: [["College", "collegeName"], ["Academic year", "academicYear"], ["Semester", "currentSemester"], ["Email", "email"], ["Phone", "phone"]],
    fields: [["collegeName", "College name", "text"], ["collegeLogo", "College logo", "upload"], ["academicYear", "Academic year", "text"], ["currentSemester", "Current semester", "number"], ["gradingScale", "Grade thresholds (JSON)", "json"], ["contactInformation", "Contact information", "text"], ["address", "Address", "text"], ["email", "Email", "email"], ["phone", "Phone", "tel"]],
    writeRoles: ["admin"],
    deletable: false,
  },
}

const metricsForRole = {
  admin: [["Students", "studentCount", "01"], ["Teachers", "teacherCount", "02"], ["Courses", "courseCount", "03"], ["Departments", "departmentCount", "04"], ["Fee collection", "totalRevenue", "05"], ["Fees outstanding", "pendingFees", "06"], ["Today's attendance", "todayAttendanceCount", "07"], ["Upcoming exams", "upcomingExamCount", "08"]],
  teacher: [["Assigned subjects", "courseCount", "01"], ["Students", "studentCount", "02"], ["Today's classes", "todayClassCount", "03"], ["Pending submissions", "pendingAssignmentCount", "04"], ["Today's attendance", "todayAttendanceCount", "05"]],
  student: [["Attendance", "attendancePercentage", "01"], ["Semester", "currentSemester", "02"], ["My subjects", "enrollmentCount", "03"], ["Upcoming exams", "upcomingExamCount", "04"], ["Pending assignments", "pendingAssignmentCount", "05"], ["Fees due", "feeRemaining", "06"]],
  accountant: [["Students", "studentCount", "01"], ["Fee collection", "totalRevenue", "02"], ["Fees outstanding", "pendingFees", "03"], ["Books on loan", "outstandingBorrowCount", "04"]],
}

const currentYear = new Date().getFullYear()
const academicYear = `${currentYear} / ${String(currentYear + 1).slice(-2)}`
const valueAt = (record, path) => path.split(".").reduce((value, part) => value?.[part], record) ?? "Not available"
const formatRole = (role = "student") => role.charAt(0).toUpperCase() + role.slice(1)
const formatMetric = (key, value) => {
  if (["totalRevenue", "pendingFees", "feeRemaining"].includes(key)) return `Rs. ${Number(value || 0).toLocaleString()}`
  if (key === "attendancePercentage") return `${value ?? 0}%`
  return value ?? 0
}

export default function CollegePortal() {
  const dispatch = useDispatch()
  const [token, setToken] = useState(() => localStorage.getItem("token"))
  const [user, setLocalUser] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [academicYearText, setAcademicYearText] = useState(academicYear)
  const [activeSection, setActiveSection] = useState("Overview")
  const [records, setRecords] = useState([])
  const [recordsSection, setRecordsSection] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [lookups, setLookups] = useState({ departments: [], teachers: [], students: [], courses: [], exams: [], assignments: [], books: [] })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" })
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const role = user?.userRole || "student"

  useEffect(() => {
    if (!token) return
    let active = true
    const loadPortal = async () => {
      setLoading(true)
      setError("")
      try {
        const { data: profileResponse } = await APIAuth.get("auth/me")
        const role = profileResponse.data.userRole
        const [dashboardResponse, attendanceResponse, settingsResponse] = await Promise.all([
          APIAuth.get("college/dashboard"),
          role === "student" ? APIAuth.get("college/attendance/summary") : Promise.resolve(null),
          APIAuth.get("college/settings"),
        ])
        if (!active) return
        setLocalUser(profileResponse.data)
        dispatch(setUser(profileResponse.data))
        setAcademicYearText(settingsResponse.data.data?.academicYear || academicYear)
        setDashboard({
          ...dashboardResponse.data.data,
          ...(attendanceResponse ? { attendancePercentage: attendanceResponse.data.data.percentage } : {}),
        })
      } catch (requestError) {
        if (!active) return
        setError(requestError.response?.data?.message || "Unable to load your college workspace.")
        if (requestError.response?.status === 401) {
          localStorage.removeItem("token")
          setToken("")
          dispatch(logOut())
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadPortal()
    return () => { active = false }
  }, [dispatch, token])

  useEffect(() => {
    if (!user || activeSection === "Overview") return
    const resource = resources[activeSection]
    if (!resource) return
    let active = true
    APIAuth.get(resource.path || `college/${resource.endpoint}`, { params: search ? { search } : {} })
      .then(({ data }) => {
        if (!active) return
        const loadedRecords = Array.isArray(data.data) ? data.data : data.data ? [data.data] : []
        setRecords(loadedRecords)
        setRecordsSection(activeSection)
      })
      .catch((requestError) => {
        if (!active) return
        setRecords([])
        setRecordsSection(activeSection)
        setError(requestError.response?.data?.message || "Unable to load this directory.")
      })
    return () => { active = false }
  }, [activeSection, refreshVersion, search, user])

  useEffect(() => {
    if (!modalOpen) return
    const requiredLookups = activeSection === "Students" || activeSection === "Teachers"
      ? ["departments"]
      : activeSection === "Courses"
        ? ["departments", "teachers"]
        : activeSection === "Enrollments"
          ? role === "student" ? ["courses"] : ["students", "courses"]
          : activeSection === "Attendance"
            ? role === "teacher" ? ["students", "courses"] : ["students", "courses", "teachers"]
            : activeSection === "Exams"
              ? ["courses"]
              : activeSection === "Marks"
                ? ["students", "exams"]
                : activeSection === "Assignments"
                  ? role === "teacher" ? ["courses"] : ["courses", "teachers"]
                  : activeSection === "Submissions"
                    ? role === "student" ? ["assignments"] : []
                    : activeSection === "Timetable"
                      ? ["courses", "teachers"]
                      : activeSection === "Fees" || activeSection === "Borrowing"
                        ? ["students", ...(activeSection === "Borrowing" ? ["books"] : [])]
          : []
    let active = true
    Promise.all(requiredLookups.map((resource) =>
      APIAuth.get(resource === "students" && role === "accountant" ? "college/students/options" : `college/${resource}`).then(({ data }) => [resource, Array.isArray(data.data) ? data.data : data.data ? [data.data] : []])
    )).then((entries) => {
      if (active) setLookups((current) => ({ ...current, ...Object.fromEntries(entries) }))
    }).catch(() => {
      if (active) setError("Unable to load related college records for this form.")
    })
    return () => { active = false }
  }, [activeSection, modalOpen, role])

  const openCreateForm = () => {
    setSelectedRecord(null)
    setDraft(Object.fromEntries(formFields.map(([name, , type]) => [name, type === "courseType" ? "Core" : ""])))
    setModalOpen(true)
  }

  const openEditForm = (record) => {
    const editableFields = resources[activeSection].gradeAction
      ? resources[activeSection].fields.filter(([name]) => ["marks", "feedback"].includes(name))
      : activeSection === "Attendance"
        ? resources[activeSection].fields.filter(([name]) => name === "status")
      : resources[activeSection].fields.filter(([name]) => (activeSection === "Profile" || !["userName", "userEmail", "userPhoneNumber", "userPassword", "student"].includes(name)) && !(activeSection === "Assignments" && name === "teacher"))
    setSelectedRecord(record)
    setDraft(Object.fromEntries(editableFields.map(([name]) => {
      const value = record[name]
      if (name === "gradingScale" && value) return [name, JSON.stringify(value, null, 2)]
      if (value instanceof Date) return [name, value.toISOString().slice(0, 10)]
      if (resources[activeSection].fields.find(([field]) => field === name)?.[2] === "date" && value) {
        return [name, new Date(value).toISOString().slice(0, 10)]
      }
      return [name, value && typeof value === "object" ? value._id || "" : value ?? ""]
    })))
    setModalOpen(true)
  }

  const submitRecord = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    const payload = { ...draft }
    try {
      resources[activeSection].fields.forEach(([name, , type]) => {
        if (type === "number" && payload[name] !== "") payload[name] = Number(payload[name])
        if (type === "json" && payload[name]) payload[name] = JSON.parse(payload[name])
        if (name === "teacher" && !payload[name]) delete payload[name]
      })
      const resource = resources[activeSection]
      const endpoint = `college/${resource.endpoint}`
      let response
      if (resource.path === "auth/me") response = await APIAuth.patch("auth/me", payload)
      else if (resource.endpoint === "settings") response = await APIAuth.put(endpoint, payload)
      else if (activeSection === "Attendance" && selectedRecord) response = await APIAuth.patch(`${endpoint}/${selectedRecord._id}`, payload)
      else if (activeSection === "Submissions" && selectedRecord) response = await APIAuth.patch(`${endpoint}/${selectedRecord._id}/grade`, payload)
      else if (selectedRecord) response = await APIAuth.put(`${endpoint}/${selectedRecord._id}`, payload)
      else response = await APIAuth.post(endpoint, payload)
      if (resource.path === "auth/me") {
        setLocalUser(response.data.data)
        dispatch(setUser(response.data.data))
      }
      setModalOpen(false)
      setRefreshVersion((version) => version + 1)
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this record.")
    } finally {
      setSaving(false)
    }
  }

  const deleteRecord = async (record) => {
    if (!window.confirm("Delete this college record? This action cannot be undone.")) return
    setError("")
    try {
      await APIAuth.delete(`college/${resources[activeSection].endpoint}/${record._id}`)
      setRefreshVersion((version) => version + 1)
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete this record.")
    }
  }

  const uploadField = async (field, file) => {
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    setUploading(true)
    setError("")
    try {
      const { data } = await APIAuth.post("college/uploads", formData)
      setDraft((current) => ({ ...current, [field]: data.data.path }))
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to upload this file.")
    } finally {
      setUploading(false)
    }
  }

  const returnBorrowedBook = async (record) => {
    try {
      await APIAuth.patch(`college/borrows/${record._id}/return`)
      setRefreshVersion((version) => version + 1)
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to return this book.")
    }
  }

  const downloadCollegeFile = async (filePath) => {
    const filename = filePath.split("/").at(-1)
    try {
      const { data } = await APIAuth.get(`college/uploads/${encodeURIComponent(filename)}`, { responseType: "blob" })
      const downloadUrl = URL.createObjectURL(data)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      link.click()
      URL.revokeObjectURL(downloadUrl)
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to download this file.")
    }
  }

  const changePassword = async (event) => {
    event.preventDefault()
    setPasswordMessage("")
    setPasswordError("")
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New passwords must be at least 8 characters.")
      return
    }
    try {
      const { data } = await APIAuth.patch("auth/password", passwordForm)
      localStorage.setItem("token", data.token)
      dispatch(setAuthToken(data.token))
      setPasswordForm({ currentPassword: "", newPassword: "" })
      setPasswordMessage(data.message)
    } catch (requestError) {
      setPasswordError(requestError.response?.data?.message || "Unable to update your password.")
    }
  }

  const signOut = async () => {
    try { await APIAuth.post("auth/logout") } catch { /* Session is cleared locally below. */ }
    localStorage.removeItem("token")
    setToken("")
    setLocalUser(null)
    dispatch(logOut())
  }

  if (!token) {
    return (
      <main className="scms-welcome">
        <div className="welcome-top"><span className="brand-mark">S</span><span><strong>SCMS</strong><small>SMART COLLEGE MANAGEMENT SYSTEM</small></span></div>
        <section className="welcome-content">
          <div className="welcome-copy">
            <p className="eyebrow">ACADEMIC OPERATIONS, IN ONE PLACE</p>
            <h1>A clearer view of campus life.</h1>
            <p>One connected workspace for students, faculty, and college administration.</p>
            <div className="welcome-actions"><Link to="/login" className="primary-link">Sign in <span aria-hidden="true">&rarr;</span></Link><Link to="/register" className="secondary-link">Create student account</Link></div>
          </div>
          <aside className="welcome-panel" aria-label="College workspace preview">
            <div className="panel-heading"><span className="status-dot" /> CAMPUS OVERVIEW <span>{academicYearText}</span></div>
            <div className="panel-stat"><strong>01</strong><div><b>Academic records</b><small>Courses, enrollment and departments</small></div></div>
            <div className="panel-stat"><strong>02</strong><div><b>Role-based access</b><small>One secure workspace for every role</small></div></div>
            <div className="panel-stat"><strong>03</strong><div><b>Connected campus</b><small>Built around the people who learn here</small></div></div>
            <div className="panel-bottom"><span>SMART COLLEGE</span><span>SCMS / 01</span></div>
          </aside>
        </section>
        <footer className="welcome-footer"><span>SCMS / CAMPUS PORTAL</span><span>LEARN / TEACH / GROW</span></footer>
      </main>
    )
  }

  const sections = navigation[role] || navigation.student
  const selectedResource = resources[activeSection]
  const currentRecords = recordsSection === activeSection ? records : []
  const filteredRecords = currentRecords.filter((record) => JSON.stringify(record).toLowerCase().includes(search.toLowerCase()))
  const canManage = Boolean(selectedResource?.fields && (selectedResource.writeRoles || ["admin"]).includes(role))
  const canCreateRecord = Boolean(canManage && (selectedResource.createRoles || selectedResource.writeRoles || ["admin"]).includes(role))
  const canEditRecord = Boolean(selectedResource?.fields && selectedResource.editable !== false && (selectedResource.updateRoles || selectedResource.writeRoles || ["admin"]).includes(role))
  const canDeleteRecord = Boolean(selectedResource?.fields && selectedResource.deletable !== false && (selectedResource.deleteRoles || selectedResource.writeRoles || ["admin"]).includes(role))
  const canReturnBook = Boolean(selectedResource?.returnAction && ["admin", "accountant"].includes(role))
  const hasRowActions = canEditRecord || canDeleteRecord || canReturnBook
  const canCreateEnrollment = role === "student" && activeSection === "Enrollments"
  const formFields = selectedResource?.fields?.filter(([name]) => {
    if (selectedRecord && selectedResource.gradeAction) return ["marks", "feedback"].includes(name)
    if (selectedRecord && activeSection === "Attendance") return name === "status"
    if (selectedRecord && activeSection !== "Profile" && ["userName", "userEmail", "userPhoneNumber", "userPassword", "student"].includes(name)) return false
    if (canCreateEnrollment && name === "student") return false
    if (role === "teacher" && name === "teacher") return false
    if (activeSection === "Submissions" && role === "student" && ["marks", "feedback"].includes(name)) return false
    return true
  }) || []
  const upcomingItems = [
    ...(dashboard?.upcomingExams || []).map((item) => ({ id: item._id, title: item.name, detail: item.course?.courseName || "Examination", date: item.date })),
    ...(dashboard?.upcomingAssignments || []).map((item) => ({ id: item._id, title: item.title, detail: item.course?.courseName || "Assignment", date: item.deadline })),
    ...(dashboard?.upcomingEvents || []).map((item) => ({ id: item._id, title: item.name, detail: item.location || "Campus event", date: item.date })),
    ...(dashboard?.feesDue || []).map((item) => ({ id: item._id, title: item.feeType, detail: `Rs. ${Number(item.remainingAmount).toLocaleString()} due`, date: item.dueDate })),
  ].sort((first, second) => new Date(first.date) - new Date(second.date)).slice(0, 5)

  return (
    <div className="scms-shell">
      <aside className={`scms-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="sidebar-brand"><span className="brand-mark">S</span><span><strong>SCMS</strong><small>COLLEGE PORTAL</small></span></div>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav aria-label="Main navigation" className="sidebar-nav">
          {sections.map((section, index) => (
            <button key={section} type="button" onClick={() => { setActiveSection(section); setMenuOpen(false) }} className={`nav-item ${activeSection === section ? "active" : ""}`}>
              <span className="nav-index">{String(index + 1).padStart(2, "0")}</span><span>{section}</span>{activeSection === section && <span className="nav-current" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-academic"><span>ACADEMIC YEAR</span><strong>{academicYearText}</strong></div><button className="signout-button" onClick={signOut}><span aria-hidden="true">&larr;</span> Sign out</button></div>
      </aside>

      <main className="scms-main">
        <header className="scms-topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={menuOpen}><span className="menu-lines"><i /><i /><i /></span></button>
          <div className="breadcrumb">SCMS <span>/</span> {activeSection}</div>
          <div className="topbar-user"><div className="user-avatar">{user?.userName?.[0]?.toUpperCase() || "U"}</div><div><strong>{user?.userName || "Campus user"}</strong><span>{formatRole(role)}</span></div></div>
        </header>

        <div className="scms-content">
          {error && <div className="portal-error" role="alert">{error}</div>}
          {activeSection === "Overview" ? (
            <>
              <div className="page-heading"><div><p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</p><h1>Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {user?.userName?.split(" ")[0] || "there"}.</h1><p className="page-subtitle">Here's what's happening across your college workspace.</p></div><div className="semester-badge"><span className="status-dot" /> ACADEMIC YEAR <strong>{academicYearText}</strong></div></div>
              <section className="metric-grid" aria-label="College statistics">
                {(metricsForRole[role] || metricsForRole.student).map(([label, key, index]) => (
                  <article className={`metric-card metric-${index}`} key={key}><div className="metric-top"><span>{label}</span><span className="metric-mark">{index}</span></div><strong>{loading && !dashboard ? "..." : formatMetric(key, dashboard?.[key])}</strong><small>Updated from college records</small></article>
                ))}
              </section>
              {role === "admin" && <section className="analytics-grid" aria-label="College analytics">
                <article className="content-panel chart-panel"><p className="eyebrow">ADMISSIONS</p><h2>Student growth</h2>{dashboard?.studentGrowth?.length ? <div className="chart-bars">{dashboard.studentGrowth.map((item) => { const maximum = Math.max(...dashboard.studentGrowth.map((entry) => entry.count), 1); return <div className="chart-column" key={item._id}><strong>{item.count}</strong><span style={{ height: `${Math.max(8, (item.count / maximum) * 100)}%` }} /><small>{item._id.slice(5)}</small></div> })}</div> : <p className="activity-empty">No enrollment history yet.</p>}</article>
                <article className="content-panel chart-panel"><p className="eyebrow">WEEKLY CLASSROOM</p><h2>Attendance</h2>{dashboard?.attendanceByDay?.length ? <div className="chart-bars">{dashboard.attendanceByDay.map((item) => { const total = item.present + item.absent + item.late; return <div className="chart-column" key={item._id}><strong>{total}</strong><span className="chart-attendance" style={{ height: `${Math.max(8, (item.present / Math.max(total, 1)) * 100)}%` }} /><small>{item._id.slice(5)}</small></div> })}</div> : <p className="activity-empty">No attendance recorded this week.</p>}</article>
                <article className="content-panel chart-panel"><p className="eyebrow">ACCOUNTS</p><h2>Fee collection</h2>{dashboard?.feeCollection?.length ? <div className="chart-bars">{dashboard.feeCollection.map((item) => { const maximum = Math.max(...dashboard.feeCollection.map((entry) => entry.collected), 1); return <div className="chart-column" key={item._id}><strong>{Number(item.collected).toLocaleString()}</strong><span className="chart-fees" style={{ height: `${Math.max(8, (item.collected / maximum) * 100)}%` }} /><small>{item._id.slice(5)}</small></div> })}</div> : <p className="activity-empty">No fee payments recorded yet.</p>}</article>
                <article className="content-panel chart-panel"><p className="eyebrow">ACADEMIC STRUCTURE</p><h2>Department distribution</h2>{dashboard?.departmentDistribution?.length ? <div className="department-bars">{dashboard.departmentDistribution.map((item) => { const maximum = Math.max(...dashboard.departmentDistribution.map((entry) => entry.studentCount), 1); return <div className="department-bar" key={item._id}><div><span>{item.name}</span><strong>{item.studentCount}</strong></div><i style={{ width: `${Math.max(item.studentCount ? 4 : 0, (item.studentCount / maximum) * 100)}%` }} /></div> })}</div> : <p className="activity-empty">No departments available.</p>}</article>
              </section>}
              <section className="overview-lower">
                <article className="content-panel overview-panel"><div className="panel-title"><div><p className="eyebrow">ACADEMIC DIRECTORY</p><h2>Explore your campus</h2></div><span className="panel-number">01 / 04</span></div><p className="panel-description">Browse the academic records available to your account. Access is determined by your college role.</p><div className="directory-links">{sections.filter((item) => item !== "Overview").slice(0, 4).map((section) => <button key={section} onClick={() => setActiveSection(section)}><span>{section}</span><span aria-hidden="true">&rarr;</span></button>)}</div></article>
                <article className="welcome-note"><span className="note-label">YOUR WORKSPACE</span><strong>{formatRole(role)} access</strong><p>Your account is connected to the college system. Available modules are tailored to your role.</p><div className="note-rule" /><span className="note-foot">SMART COLLEGE MANAGEMENT SYSTEM</span></article>
              </section>
              <section className="dashboard-lists">
                <article className="content-panel activity-panel"><div className="panel-title"><div><p className="eyebrow">CAMPUS BULLETIN</p><h2>Latest notices</h2></div><button onClick={() => setActiveSection("Notices")}>View all <span aria-hidden="true">&rarr;</span></button></div>{dashboard?.latestNotices?.length ? dashboard.latestNotices.map((notice) => <div className="activity-row" key={notice._id}><div><strong>{notice.title}</strong><span>{notice.category} / {notice.priority}</span></div><time>{new Date(notice.date).toLocaleDateString()}</time></div>) : <p className="activity-empty">No notices have been published.</p>}</article>
                <article className="content-panel activity-panel"><div className="panel-title"><div><p className="eyebrow">ACADEMIC CALENDAR</p><h2>Coming up</h2></div><span className="panel-number">NEXT 05</span></div>{upcomingItems.length ? upcomingItems.map((item) => <div className="activity-row" key={item.id}><div><strong>{item.title}</strong><span>{item.detail}</span></div><time>{new Date(item.date).toLocaleDateString()}</time></div>) : <p className="activity-empty">No upcoming items on your calendar.</p>}</article>
              </section>
            </>
          ) : (
            <section className="content-panel directory-panel">
              <div className="directory-heading"><div><p className="eyebrow">COLLEGE RECORDS</p><h1>{activeSection}</h1><p className="page-subtitle">Search and review records available to your account.</p></div><div className="directory-tools"><label className="search-box"><span aria-hidden="true">&#9906;</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${activeSection.toLowerCase()}...`} type="search" /></label>{(canCreateRecord || canCreateEnrollment) && <button className="create-record" onClick={openCreateForm}><span aria-hidden="true">+</span> {canCreateEnrollment ? "Enroll in a course" : selectedResource.createLabel || ({ Students: "Add student", Teachers: "Add teacher", Departments: "Add department", Courses: "Add course", Enrollments: "Add enrollment", Attendance: "Record attendance", Exams: "Create exam", Marks: "Enter marks", Assignments: "Create assignment", Submissions: "Submit assignment", Notices: "Publish notice", Timetable: "Add timetable entry", Fees: "Add fee", Books: "Add book", Events: "Add event", Settings: "Save college settings" }[activeSection])}</button>}</div></div>
              {recordsSection !== activeSection ? <div className="empty-state">Loading college records...</div> : filteredRecords.length === 0 ? <div className="empty-state">No {activeSection.toLowerCase()} records found.</div> : (
                <div className="table-scroll"><table><thead><tr>{selectedResource.columns.map(([label]) => <th key={label}>{label}</th>)}{hasRowActions && <th>Actions</th>}</tr></thead><tbody>{filteredRecords.map((record) => <tr key={record._id || record.id}>{selectedResource.columns.map(([, field]) => { const value = valueAt(record, field); return <td key={field}>{typeof value === "string" && value.startsWith("/uploads/college/") ? <button className="file-link" onClick={() => downloadCollegeFile(value)}>Download file</button> : String(value)}</td> })}{hasRowActions && <td><div className="row-actions">{canEditRecord && <button onClick={() => openEditForm(record)}>{selectedResource.gradeAction ? "Grade" : "Edit"}</button>}{canDeleteRecord && <button onClick={() => deleteRecord(record)}>Delete</button>}{canReturnBook && ["Borrowed", "Overdue"].includes(record.status) && <button onClick={() => returnBorrowedBook(record)}>Return</button>}</div></td>}</tr>)}</tbody></table></div>
              )}
              <div className="table-footer"><span>{filteredRecords.length} RECORD{filteredRecords.length === 1 ? "" : "S"}</span><span>SCMS / {formatRole(role).toUpperCase()} VIEW</span></div>
            </section>
          )}
          {activeSection === "Profile" && <section className="content-panel password-panel"><div><p className="eyebrow">ACCOUNT SECURITY</p><h2>Change password</h2><p className="page-subtitle">Other active sessions will be signed out after your password changes.</p></div><form className="password-form" onSubmit={changePassword}><label>Current password<input type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} /></label><label>New password<input type="password" autoComplete="new-password" minLength={8} required value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} /></label><button type="submit">Update password</button>{passwordMessage && <p role="status">{passwordMessage}</p>}{passwordError && <p className="auth-error" role="alert">{passwordError}</p>}</form></section>}
          {modalOpen && selectedResource && (
            <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false) }}>
              <section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="record-modal-title">
                <div className="modal-heading"><div><p className="eyebrow">COLLEGE RECORDS</p><h2 id="record-modal-title">{selectedRecord ? selectedResource.gradeAction ? "Grade submission" : "Edit record" : selectedResource.createLabel || `Add ${activeSection.slice(0, -1).toLowerCase()}`}</h2></div><button aria-label="Close dialog" onClick={() => setModalOpen(false)}>×</button></div>
                <form className="record-form" onSubmit={submitRecord}>
                  {formFields.map(([name, label, type]) => {
                    const choices = name === "department" ? lookups.departments : name === "teacher" ? lookups.teachers : name === "student" ? lookups.students : name === "course" ? lookups.courses : name === "exam" ? lookups.exams : name === "assignment" ? lookups.assignments : name === "book" ? lookups.books : null
                    const choiceRequired = name !== "teacher" || role === "admin"
                    const options = { attendanceStatus: ["Present", "Absent", "Late"], courseType: ["Core", "Elective", "Lab"], weekday: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], noticeCategory: ["General", "Exam", "Holiday", "Event", "Important", "Emergency"], noticePriority: ["Low", "Normal", "High", "Urgent"], feeType: ["Admission Fee", "Semester Fee", "Exam Fee", "Library Fee", "Lab Fee", "Other"], gender: ["female", "male", "non-binary", "prefer-not-to-say"] }[type]
                    return <label key={name}>{label}{choices ? <select required={choiceRequired} value={draft[name] || ""} onChange={(event) => setDraft({ ...draft, [name]: event.target.value })}><option value="">{name === "teacher" ? "Unassigned" : "Select a record"}</option>{choices.map((choice) => <option key={choice._id} value={choice._id}>{choice.name || choice.title || choice.courseName || choice.studentId || choice.user?.userName || choice.teacherId || choice.bookId} {choice.code ? `(${choice.code})` : ""}</option>)}</select> : options ? <select required value={draft[name] || ""} onChange={(event) => setDraft({ ...draft, [name]: event.target.value })}><option value="">Select an option</option>{options.map((option) => <option key={option}>{option}</option>)}</select> : type === "upload" ? <><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required={activeSection === "Submissions" && !draft[name]} onChange={(event) => uploadField(name, event.target.files?.[0])} />{draft[name] && <small>{draft[name]}</small>}</> : type === "json" ? <textarea rows={8} spellCheck="false" value={draft[name] ?? ""} onChange={(event) => setDraft({ ...draft, [name]: event.target.value })} /> : <input required={!selectedRecord && !["description", "teacher", "attachment", "image", "collegeLogo", "paidAmount", "feedback"].includes(name)} min={type === "number" ? name.endsWith("Marks") || name === "paidAmount" ? 0 : 1 : undefined} type={type} value={draft[name] ?? ""} onChange={(event) => setDraft({ ...draft, [name]: event.target.value })} />}</label>
                  })}
                  {error && <p className="auth-error" role="alert">{error}</p>}
                  <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="save-button" disabled={saving || uploading}>{uploading ? "Uploading..." : saving ? "Saving..." : "Save record"}</button></div>
                </form>
              </section>
            </div>
          )}
          <footer className="content-footer"><span>SMART COLLEGE MANAGEMENT SYSTEM</span><span>SECURE CAMPUS WORKSPACE</span></footer>
        </div>
      </main>
    </div>
  )
}