const Assignment = require("../../models/Assignment");
const Book = require("../../models/Book");
const BorrowRecord = require("../../models/BorrowRecord");
const CollegeSettings = require("../../models/CollegeSettings");
const Course = require("../../models/Course");
const Enrollment = require("../../models/Enrollment");
const Event = require("../../models/Event");
const Fee = require("../../models/Fee");
const Notice = require("../../models/Notice");
const Student = require("../../models/Student");
const Submission = require("../../models/Submission");
const Teacher = require("../../models/Teacher");
const Timetable = require("../../models/Timetable");

const escapeRegex = (value) => String(value).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isCollegeUpload = (value) => typeof value === "string" && /^\/uploads\/college\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/i.test(value);
const isCollegeImage = (value) => typeof value === "string" && /^\/uploads\/college\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(value);
const teacherProfile = (userId) => Teacher.findOne({ user: userId }).select("_id subjects");
const studentProfile = (userId) => Student.findOne({ user: userId }).select("_id semester section");
const isTeacherAssigned = async (teacherId, courseId) => {
    const teacher = await Teacher.findById(teacherId).select("subjects");
    const course = await Course.findById(courseId).select("semester");
    return Boolean(teacher && course && course.semester && teacher.subjects.some((subject) => subject.equals(courseId)));
};

const getAssignmentAccess = async (req, assignmentId) => {
    const assignment = await Assignment.findById(assignmentId).select("course teacher");
    if (!assignment) return { error: { status: 404, message: "Assignment not found" } };
    if (req.userRole === "admin") return { assignment };
    const teacher = await teacherProfile(req.user._id);
    if (!teacher || String(assignment.teacher) !== String(teacher._id)) {
        return { error: { status: 403, message: "You can only manage assignments you teach" } };
    }
    return { assignment };
};

const listNotices = async (req, res) => {
    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.search) {
        const expression = new RegExp(escapeRegex(req.query.search), "i");
        query.$or = [{ title: expression }, { description: expression }];
    }
    const records = await Notice.find(query).populate("publishedBy", "userName userRole").sort({ date: -1 }).limit(100);
    return res.json({ success: true, data: records });
};

const createNotice = async (req, res) => {
    if (req.body.attachment && !isCollegeUpload(req.body.attachment)) return res.status(400).json({ success: false, message: "Invalid attachment reference" });
    const notice = await Notice.create({ ...req.body, publishedBy: req.user._id });
    return res.status(201).json({ success: true, message: "Notice published", data: notice });
};

const updateNotice = async (req, res) => {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    if (req.userRole !== "admin" && !notice.publishedBy.equals(req.user._id)) return res.status(403).json({ success: false, message: "You can only edit notices you published" });
    if (req.body.attachment && !isCollegeUpload(req.body.attachment)) return res.status(400).json({ success: false, message: "Invalid attachment reference" });
    ["title", "description", "category", "date", "priority", "attachment"].forEach((field) => {
        if (req.body[field] !== undefined) notice[field] = req.body[field];
    });
    await notice.save();
    return res.json({ success: true, message: "Notice updated", data: notice });
};

const deleteNotice = async (req, res) => {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    if (req.userRole !== "admin" && !notice.publishedBy.equals(req.user._id)) return res.status(403).json({ success: false, message: "You can only delete notices you published" });
    await notice.deleteOne();
    return res.json({ success: true, message: "Notice deleted" });
};

const listAssignments = async (req, res) => {
    const query = {};
    let allowedCourses;
    if (req.userRole === "teacher") {
        const teacher = await teacherProfile(req.user._id);
        query.teacher = teacher?._id;
        allowedCourses = teacher?.subjects || [];
    } else if (req.userRole === "student") {
        const student = await studentProfile(req.user._id);
        const enrollments = student ? await Enrollment.find({ student: student._id, status: "active" }).select("course") : [];
        allowedCourses = enrollments.map(({ course }) => course);
        query.course = { $in: allowedCourses };
    }
    if (req.query.course) {
        if (allowedCourses && !allowedCourses.some((course) => course.equals(req.query.course))) query._id = { $in: [] };
        else query.course = req.query.course;
    }
    const assignments = await Assignment.find(query).populate("course", "courseCode courseName").populate("teacher", "teacherId").sort({ deadline: 1 }).limit(300);
    return res.json({ success: true, data: assignments });
};

const createAssignment = async (req, res) => {
    const teacher = req.userRole === "teacher" ? await teacherProfile(req.user._id) : await Teacher.findById(req.body.teacher).select("_id subjects");
    if (!teacher) return res.status(400).json({ success: false, message: "A teacher profile is required" });
    if (!teacher.subjects.some((course) => course.equals(req.body.course))) return res.status(403).json({ success: false, message: "The teacher is not assigned to this course" });
    if (req.body.attachment && !isCollegeUpload(req.body.attachment)) return res.status(400).json({ success: false, message: "Invalid attachment reference" });
    const assignment = await Assignment.create({ ...req.body, teacher: teacher._id });
    return res.status(201).json({ success: true, message: "Assignment created", data: assignment });
};

const updateAssignment = async (req, res) => {
    const access = await getAssignmentAccess(req, req.params.id);
    if (access.error) return res.status(access.error.status).json({ success: false, message: access.error.message });
    const nextCourse = req.body.course || access.assignment.course;
    if (!await isTeacherAssigned(access.assignment.teacher, nextCourse)) return res.status(400).json({ success: false, message: "The assignment teacher must be assigned to the selected course" });
    if (req.userRole === "teacher") {
        const teacher = await teacherProfile(req.user._id);
        if (!teacher?.subjects.some((course) => course.equals(nextCourse))) return res.status(403).json({ success: false, message: "The teacher is not assigned to this course" });
    }
    if (req.body.attachment && !isCollegeUpload(req.body.attachment)) return res.status(400).json({ success: false, message: "Invalid attachment reference" });
    ["title", "description", "course", "deadline", "attachment"].forEach((field) => {
        if (req.body[field] !== undefined) access.assignment[field] = req.body[field];
    });
    await access.assignment.save();
    return res.json({ success: true, message: "Assignment updated", data: access.assignment });
};

const deleteAssignment = async (req, res) => {
    const access = await getAssignmentAccess(req, req.params.id);
    if (access.error) return res.status(access.error.status).json({ success: false, message: access.error.message });
    await Submission.deleteMany({ assignment: access.assignment._id });
    await access.assignment.deleteOne();
    return res.json({ success: true, message: "Assignment and submissions deleted" });
};

const listSubmissions = async (req, res) => {
    const query = {};
    if (req.userRole === "student") {
        const student = await studentProfile(req.user._id);
        if (!student) return res.json({ success: true, data: [] });
        query.student = student._id;
    } else if (req.userRole === "teacher") {
        const teacher = await teacherProfile(req.user._id);
        const assignments = await Assignment.find({ teacher: teacher?._id }).select("_id");
        query.assignment = { $in: assignments.map(({ _id }) => _id) };
    }
    if (req.query.assignment) {
        if (req.userRole === "teacher" && !query.assignment.$in.some((id) => id.equals(req.query.assignment))) query._id = { $in: [] };
        else query.assignment = req.query.assignment;
    }
    const records = await Submission.find(query).populate("student", "studentId").populate("assignment", "title deadline course").sort({ submittedAt: -1 }).limit(500);
    return res.json({ success: true, data: records });
};

const submitAssignment = async (req, res) => {
    const student = await studentProfile(req.user._id);
    const assignment = await Assignment.findById(req.body.assignment);
    if (!student || !assignment) return res.status(404).json({ success: false, message: "Student profile or assignment not found" });
    if (!isCollegeUpload(req.body.attachment)) return res.status(400).json({ success: false, message: "Upload a valid assignment file before submitting" });
    const enrolled = await Enrollment.exists({ student: student._id, course: assignment.course, status: "active" });
    if (!enrolled) return res.status(403).json({ success: false, message: "You are not enrolled in this assignment's course" });
    const submittedAt = new Date();
    const status = submittedAt > assignment.deadline ? "Late" : "Submitted";
    let record = await Submission.findOne({ assignment: assignment._id, student: student._id });
    if (record?.status === "Graded") return res.status(409).json({ success: false, message: "This submission has already been graded" });
    if (record) {
        record.attachment = req.body.attachment;
        record.submittedAt = submittedAt;
        record.status = status;
        await record.save();
    } else {
        record = await Submission.create({ assignment: assignment._id, student: student._id, attachment: req.body.attachment, submittedAt, status });
    }
    return res.status(201).json({ success: true, message: "Assignment submitted", data: record });
};

const gradeSubmission = async (req, res) => {
    const submission = await Submission.findById(req.params.id).populate("assignment", "teacher");
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
    if (req.userRole === "teacher") {
        const teacher = await teacherProfile(req.user._id);
        if (!teacher || !submission.assignment.teacher.equals(teacher._id)) return res.status(403).json({ success: false, message: "You can only grade submissions for your assignments" });
    }
    if (typeof req.body.marks !== "number" || req.body.marks < 0) return res.status(400).json({ success: false, message: "Marks must be a non-negative number" });
    submission.marks = req.body.marks;
    submission.feedback = String(req.body.feedback || "").slice(0, 2000);
    submission.status = "Graded";
    await submission.save();
    return res.json({ success: true, message: "Submission graded", data: submission });
};

const listTimetable = async (req, res) => {
    const query = {};
    if (req.userRole === "student") {
        const student = await studentProfile(req.user._id);
        if (!student) return res.json({ success: true, data: [] });
        query.semester = student.semester;
        query.section = student.section;
    } else if (req.userRole === "teacher") {
        const teacher = await teacherProfile(req.user._id);
        query.course = { $in: teacher?.subjects || [] };
    }
    if (req.query.day) query.day = req.query.day;
    const entries = await Timetable.find(query).populate("course", "courseCode courseName").populate("teacher", "teacherId").sort({ day: 1, startTime: 1 }).limit(300);
    return res.json({ success: true, data: entries });
};

const createTimetableEntry = async (req, res) => {
    if (!await isTeacherAssigned(req.body.teacher, req.body.course)) return res.status(400).json({ success: false, message: "The teacher must be assigned to the selected course" });
    const entry = await Timetable.create(req.body);
    return res.status(201).json({ success: true, message: "Timetable entry created", data: entry });
};

const updateTimetableEntry = async (req, res) => {
    const entry = await Timetable.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: "Timetable entry not found" });
    const teacher = req.body.teacher || entry.teacher;
    const course = req.body.course || entry.course;
    if (!await isTeacherAssigned(teacher, course)) return res.status(400).json({ success: false, message: "The teacher must be assigned to the selected course" });
    Object.assign(entry, req.body);
    await entry.save();
    return res.json({ success: true, message: "Timetable entry updated", data: entry });
};

const deleteTimetableEntry = async (req, res) => {
    const entry = await Timetable.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: "Timetable entry not found" });
    return res.json({ success: true, message: "Timetable entry deleted" });
};

const listFees = async (req, res) => {
    const query = {};
    if (req.userRole === "student") {
        const student = await studentProfile(req.user._id);
        if (!student) return res.json({ success: true, data: [] });
        query.student = student._id;
    }
    if (req.query.status && req.userRole !== "student") query.status = req.query.status;
    const records = await Fee.find(query).populate("student", "studentId").sort({ dueDate: 1 }).limit(500);
    return res.json({ success: true, data: records });
};

const createFee = async (req, res) => {
    const fee = await Fee.create(req.body);
    return res.status(201).json({ success: true, message: "Fee record created", data: fee });
};

const updateFee = async (req, res) => {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: "Fee record not found" });
    ["feeType", "amount", "paidAmount", "dueDate", "paymentDate"].forEach((field) => {
        if (req.body[field] !== undefined) fee[field] = req.body[field];
    });
    if (fee.paidAmount > 0 && req.body.paymentDate === undefined) fee.paymentDate = new Date();
    await fee.save();
    return res.json({ success: true, message: "Fee record updated", data: fee });
};

const deleteFee = async (req, res) => {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: "Fee record not found" });
    return res.json({ success: true, message: "Fee record deleted" });
};

const listBooks = async (req, res) => {
    const query = {};
    if (req.query.search) {
        const expression = new RegExp(escapeRegex(req.query.search), "i");
        query.$or = [{ title: expression }, { author: expression }, { isbn: expression }, { category: expression }];
    }
    const books = await Book.find(query).sort({ title: 1 }).limit(300);
    return res.json({ success: true, data: books });
};

const createBook = async (req, res) => {
    const book = await Book.create({ ...req.body, availableQuantity: req.body.quantity });
    return res.status(201).json({ success: true, message: "Book added", data: book });
};

const updateBook = async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: "Book not found" });
    if (req.body.title !== undefined) book.title = req.body.title;
    if (req.body.author !== undefined) book.author = req.body.author;
    if (req.body.isbn !== undefined) book.isbn = req.body.isbn;
    if (req.body.category !== undefined) book.category = req.body.category;
    if (req.body.quantity !== undefined) {
        const borrowedCount = book.quantity - book.availableQuantity;
        book.quantity = req.body.quantity;
        book.availableQuantity = book.quantity - borrowedCount;
    }
    await book.save();
    return res.json({ success: true, message: "Book updated", data: book });
};

const deleteBook = async (req, res) => {
    const borrowHistory = await BorrowRecord.exists({ book: req.params.id });
    if (borrowHistory) return res.status(409).json({ success: false, message: "Books with circulation history cannot be deleted" });
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: "Book not found" });
    return res.json({ success: true, message: "Book deleted" });
};

const listBorrows = async (req, res) => {
    const query = {};
    if (req.userRole === "student") {
        const student = await studentProfile(req.user._id);
        if (!student) return res.json({ success: true, data: [] });
        query.student = student._id;
    }
    if (req.query.status && req.userRole !== "student") query.status = req.query.status;
    await BorrowRecord.updateMany({ status: "Borrowed", dueDate: { $lt: new Date() } }, { $set: { status: "Overdue" } });
    const records = await BorrowRecord.find(query).populate("student", "studentId").populate("book", "bookId title author").sort({ dueDate: 1 }).limit(500);
    return res.json({ success: true, data: records });
};

const issueBook = async (req, res) => {
    const { student: studentId, book: bookId, dueDate } = req.body;
    const student = await Student.findById(studentId).select("_id");
    if (!student || !dueDate || new Date(dueDate) <= new Date()) return res.status(400).json({ success: false, message: "Select a student and a future due date" });
    const book = await Book.findOneAndUpdate({ _id: bookId, availableQuantity: { $gt: 0 } }, { $inc: { availableQuantity: -1 } }, { new: true });
    if (!book) return res.status(409).json({ success: false, message: "Book is unavailable" });
    try {
        const record = await BorrowRecord.create({ student: student._id, book: book._id, dueDate });
        return res.status(201).json({ success: true, message: "Book issued", data: record });
    } catch (error) {
        await Book.findByIdAndUpdate(book._id, { $inc: { availableQuantity: 1 } });
        throw error;
    }
};

const returnBook = async (req, res) => {
    const returnedAt = new Date();
    const record = await BorrowRecord.findOneAndUpdate(
        { _id: req.params.id, status: { $in: ["Borrowed", "Overdue"] } },
        { $set: { status: "Returned", returnDate: returnedAt } },
        { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: "Active borrow record not found" });
    const lateDays = Math.max(0, Math.ceil((returnedAt - record.dueDate) / 86400000));
    record.fine = lateDays * Number(process.env.LIBRARY_DAILY_FINE || 5);
    await record.save();
    await Book.findByIdAndUpdate(record.book, { $inc: { availableQuantity: 1 } });
    return res.json({ success: true, message: "Book returned", data: record });
};

const listEvents = async (req, res) => {
    const query = req.userRole === "admin" ? {} : { date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } };
    const events = await Event.find(query).sort({ date: 1 }).limit(100);
    return res.json({ success: true, data: events });
};

const createEvent = async (req, res) => {
    if (req.body.image && !isCollegeImage(req.body.image)) return res.status(400).json({ success: false, message: "Invalid image reference" });
    const event = await Event.create(req.body);
    return res.status(201).json({ success: true, message: "Event created", data: event });
};

const updateEvent = async (req, res) => {
    if (req.body.image && !isCollegeImage(req.body.image)) return res.status(400).json({ success: false, message: "Invalid image reference" });
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    return res.json({ success: true, message: "Event updated", data: event });
};

const deleteEvent = async (req, res) => {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    return res.json({ success: true, message: "Event deleted" });
};

const getSettings = async (_req, res) => {
    const settings = await CollegeSettings.findOne({ key: "college" });
    return res.json({ success: true, data: settings });
};

const updateSettings = async (req, res) => {
    const allowed = ["collegeName", "collegeLogo", "academicYear", "currentSemester", "gradingScale", "contactInformation", "address", "email", "phone"];
    const updates = Object.fromEntries(allowed.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    if (updates.collegeLogo && !isCollegeImage(updates.collegeLogo)) return res.status(400).json({ success: false, message: "Invalid college logo reference" });
    const settings = await CollegeSettings.findOneAndUpdate({ key: "college" }, { $set: updates, $setOnInsert: { key: "college" } }, { new: true, upsert: true, runValidators: true });
    return res.json({ success: true, message: "College settings saved", data: settings });
};

module.exports = {
    listNotices, createNotice, updateNotice, deleteNotice,
    listAssignments, createAssignment, updateAssignment, deleteAssignment,
    listSubmissions, submitAssignment, gradeSubmission,
    listTimetable,
    createTimetableEntry, updateTimetableEntry, deleteTimetableEntry,
    listFees, createFee, updateFee, deleteFee,
    listBooks, createBook, updateBook, deleteBook,
    listBorrows, issueBook, returnBook,
    listEvents, createEvent, updateEvent, deleteEvent,
    getSettings, updateSettings
};