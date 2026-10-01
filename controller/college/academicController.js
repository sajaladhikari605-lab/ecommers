const mongoose = require("mongoose");
const Attendance = require("../../models/Attendance");
const Course = require("../../models/Course");
const Enrollment = require("../../models/Enrollment");
const Exam = require("../../models/Exam");
const Mark = require("../../models/Mark");
const Student = require("../../models/Student");
const Teacher = require("../../models/Teacher");

const getTeacherProfile = (userId) => Teacher.findOne({ user: userId }).select("_id subjects");

const verifyCourseAccess = async (req, courseId) => {
    if (req.userRole !== "teacher") return true;
    const teacher = await getTeacherProfile(req.user._id);
    return Boolean(teacher && teacher.subjects.some((subject) => subject.equals(courseId)));
};

const listAttendance = async (req, res) => {
    const query = {};
    if (req.userRole === "student") {
        const student = await Student.findOne({ user: req.user._id }).select("_id");
        if (!student) return res.json({ success: true, data: [] });
        query.student = student._id;
    }
    if (req.userRole === "teacher") {
        const teacher = await getTeacherProfile(req.user._id);
        query.course = { $in: teacher?.subjects || [] };
    }
    ["course", "student", "status"].forEach((key) => {
        if (!req.query[key] || req.userRole === "student") return;
        if (key === "course" && req.userRole === "teacher") {
            const allowedCourses = query.course?.$in || [];
            if (!allowedCourses.some((course) => course.equals(req.query.course))) query._id = { $in: [] };
            else query.course = req.query.course;
            return;
        }
        query[key] = req.query[key];
    });
    if (req.query.date) {
        const day = new Date(req.query.date);
        if (Number.isNaN(day.getTime())) return res.status(400).json({ success: false, message: "Invalid attendance date" });
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        query.date = { $gte: start, $lt: end };
    }
    const records = await Attendance.find(query).populate("student", "studentId").populate("course", "courseCode courseName").populate("teacher", "teacherId").sort({ date: -1 }).limit(500);
    return res.json({ success: true, data: records });
};

const writeAttendance = async (req, res) => {
    const { student, course, date, status } = req.body;
    if (!student || !course || !date || !["Present", "Absent", "Late"].includes(status)) {
        return res.status(400).json({ success: false, message: "Student, course, date, and a valid status are required" });
    }
    if (!await verifyCourseAccess(req, course)) return res.status(403).json({ success: false, message: "You can only manage attendance for your assigned courses" });
    const courseRecord = await Course.findById(course).select("_id");
    if (!courseRecord) return res.status(404).json({ success: false, message: "Course not found" });
    const enrolled = await Enrollment.exists({ student, course, status: "active" });
    if (!enrolled) return res.status(400).json({ success: false, message: "Student is not actively enrolled in this course" });
    const teacher = req.userRole === "teacher" ? await getTeacherProfile(req.user._id) : await Teacher.findById(req.body.teacher);
    if (!teacher) return res.status(400).json({ success: false, message: "A teacher profile is required to record attendance" });
    if (!teacher.subjects.some((subject) => subject.equals(course))) {
        return res.status(400).json({ success: false, message: "The selected teacher is not assigned to this course" });
    }
    const record = await Attendance.findOneAndUpdate(
        { student, course, date: new Date(date) },
        { $set: { status, teacher: teacher._id, date: new Date(date) } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ success: true, message: "Attendance saved", data: record });
};

const updateAttendance = async (req, res) => {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Attendance record not found" });
    if (!await verifyCourseAccess(req, record.course)) return res.status(403).json({ success: false, message: "You can only edit attendance for your assigned courses" });
    if (!req.body.status || !["Present", "Absent", "Late"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Choose Present, Absent, or Late" });
    record.status = req.body.status;
    await record.save();
    return res.json({ success: true, message: "Attendance updated", data: record });
};

const attendanceSummary = async (req, res) => {
    let studentId = req.query.student;
    if (req.userRole === "student") {
        const student = await Student.findOne({ user: req.user._id }).select("_id");
        if (!student) return res.json({ success: true, data: { totalClasses: 0, present: 0, absent: 0, percentage: 0 } });
        studentId = student._id;
    } else if (!studentId) {
        return res.status(400).json({ success: false, message: "Student ID is required" });
    }
    if (!mongoose.isValidObjectId(studentId)) return res.status(400).json({ success: false, message: "Invalid student ID" });
    const match = { student: new mongoose.Types.ObjectId(studentId) };
    if (req.userRole === "teacher") {
        const teacher = await getTeacherProfile(req.user._id);
        match.course = { $in: teacher?.subjects || [] };
    }
    const [summary] = await Attendance.aggregate([
        { $match: match },
        { $group: { _id: null, totalClasses: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } }, absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } } } }
    ]);
    const values = summary || { totalClasses: 0, present: 0, absent: 0 };
    return res.json({ success: true, data: { ...values, percentage: values.totalClasses ? Number(((values.present / values.totalClasses) * 100).toFixed(2)) : 0 } });
};

const listExams = async (req, res) => {
    const query = {};
    if (req.query.course) query.course = req.query.course;
    if (req.query.semester) query.semester = req.query.semester;
    if (req.userRole === "teacher") {
        const teacher = await getTeacherProfile(req.user._id);
        query.course = { $in: teacher?.subjects || [] };
    }
    let exams = await Exam.find(query).populate("course", "courseCode courseName").sort({ date: 1 }).limit(200);
    if (req.userRole === "student") {
        const student = await Student.findOne({ user: req.user._id }).select("_id");
        const enrollments = student ? await Enrollment.find({ student: student._id, status: "active" }).select("course") : [];
        const courses = new Set(enrollments.map(({ course }) => String(course)));
        exams = exams.filter((exam) => courses.has(String(exam.course?._id)));
    }
    return res.json({ success: true, data: exams });
};

const createExam = async (req, res) => {
    const { name, course, semester, date, fullMarks, passMarks } = req.body;
    if (!name || !course || !date || !await verifyCourseAccess(req, course)) {
        return res.status(400).json({ success: false, message: "Provide valid exam details for an assigned course" });
    }
    if (!await Course.exists({ _id: course })) return res.status(404).json({ success: false, message: "Course not found" });
    if (Number(passMarks) > Number(fullMarks)) return res.status(400).json({ success: false, message: "Pass marks cannot exceed full marks" });
    const exam = await Exam.create({ name, course, semester, date, fullMarks, passMarks, createdBy: req.user._id });
    return res.status(201).json({ success: true, message: "Exam created successfully", data: exam });
};

const updateExam = async (req, res) => {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });
    if (!await verifyCourseAccess(req, req.body.course || exam.course)) return res.status(403).json({ success: false, message: "You can only manage exams for your assigned courses" });
    Object.assign(exam, req.body);
    await exam.save();
    return res.json({ success: true, message: "Exam updated successfully", data: exam });
};

const deleteExam = async (req, res) => {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });
    if (!await verifyCourseAccess(req, exam.course)) return res.status(403).json({ success: false, message: "You can only manage exams for your assigned courses" });
    await Mark.deleteMany({ exam: exam._id });
    await exam.deleteOne();
    return res.json({ success: true, message: "Exam and associated marks deleted" });
};

const listMarks = async (req, res) => {
    const query = {};
    if (req.query.exam) query.exam = req.query.exam;
    if (req.userRole === "student") {
        const student = await Student.findOne({ user: req.user._id }).select("_id");
        if (!student) return res.json({ success: true, data: [] });
        query.student = student._id;
    } else if (req.query.student) query.student = req.query.student;
    if (req.userRole === "teacher") {
        const teacher = await getTeacherProfile(req.user._id);
        query.course = { $in: teacher?.subjects || [] };
    }
    const marks = await Mark.find(query).populate("student", "studentId").populate("course", "courseCode courseName").populate("exam", "name fullMarks passMarks date").sort({ createdAt: -1 }).limit(500);
    return res.json({ success: true, data: marks });
};

const writeMarks = async (req, res) => {
    const { student, exam: examId, theoryMarks = 0, practicalMarks = 0 } = req.body;
    const exam = await Exam.findById(examId);
    if (!student || !exam) return res.status(400).json({ success: false, message: "A valid student and exam are required" });
    if (!await verifyCourseAccess(req, exam.course)) return res.status(403).json({ success: false, message: "You can only enter marks for your assigned courses" });
    const enrolled = await Enrollment.exists({ student, course: exam.course, status: "active" });
    if (!enrolled) return res.status(400).json({ success: false, message: "Student is not actively enrolled in this course" });
    let mark = await Mark.findOne({ student, exam: exam._id });
    if (mark) {
        mark.theoryMarks = theoryMarks;
        mark.practicalMarks = practicalMarks;
        await mark.save();
    } else {
        mark = await Mark.create({ student, exam: exam._id, course: exam.course, theoryMarks, practicalMarks });
    }
    return res.status(200).json({ success: true, message: "Marks saved", data: mark });
};

module.exports = { listAttendance, writeAttendance, updateAttendance, attendanceSummary, listExams, createExam, updateExam, deleteExam, listMarks, writeMarks };