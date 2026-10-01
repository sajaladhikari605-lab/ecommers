const Course = require("../../models/Course");
const Department = require("../../models/Department");
const Enrollment = require("../../models/Enrollment");
const Student = require("../../models/Student");
const Teacher = require("../../models/Teacher");
const User = require("../../models/UserModel");
const bcrypt = require("bcrypt");
const Attendance = require("../../models/Attendance");
const Assignment = require("../../models/Assignment");
const BorrowRecord = require("../../models/BorrowRecord");
const Event = require("../../models/Event");
const Fee = require("../../models/Fee");
const Exam = require("../../models/Exam");
const Notice = require("../../models/Notice");
const Submission = require("../../models/Submission");
const Timetable = require("../../models/Timetable");
const CollegeSettings = require("../../models/CollegeSettings");

const configurations = {
    departments: {
        model: Department,
        searchFields: ["name", "code"],
        filters: []
    },
    courses: {
        model: Course,
        searchFields: ["courseCode", "courseName"],
        filters: ["department", "semester", "courseType"],
        populate: ["department", { path: "teacher", populate: { path: "user", select: "userName" } }]
    },
    students: {
        model: Student,
        searchFields: ["studentId", "program", "section", "rollNumber"],
        filters: ["department", "semester", "section"],
        populate: [{ path: "user", select: "userName userEmail userPhoneNumber gender dateOfBirth address profilePicture" }, "department"]
    },
    teachers: {
        model: Teacher,
        searchFields: ["teacherId", "qualification"],
        filters: ["department"],
        populate: [{ path: "user", select: "userName userEmail userPhoneNumber profilePicture" }, "department", "subjects"]
    },
    enrollments: {
        model: Enrollment,
        searchFields: ["academicYear"],
        filters: ["semester", "status", "student", "course"],
        populate: ["student", "course"]
    }
};

const getConfig = (resource) => configurations[resource];

const list = (resource) => async (req, res) => {
    const config = getConfig(resource);
    const query = {};
    let assignedCourses;
    if (req.userRole === "teacher" && ["students", "enrollments", "courses"].includes(resource)) {
        const teacher = await Teacher.findOne({ user: req.user._id }).select("subjects");
        assignedCourses = teacher?.subjects || [];
        if (resource === "students") {
            query._id = { $in: await Enrollment.distinct("student", { course: { $in: assignedCourses }, status: "active" }) };
        } else if (resource === "enrollments") {
            query.course = { $in: assignedCourses };
        } else {
            query._id = { $in: assignedCourses };
        }
    }
    config.filters.forEach((field) => {
        if (!req.query[field]) return;
        if (field === "course" && assignedCourses) {
            const hasAccess = assignedCourses.some((course) => course.equals(req.query.course));
            if (hasAccess) query.course = req.query.course;
            else query._id = { $in: [] };
            return;
        }
        query[field] = req.query[field];
    });
    if (req.query.search) {
        const expression = new RegExp(String(req.query.search).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = config.searchFields.map((field) => ({ [field]: expression }));
    }
    if (resource === "enrollments" && req.userRole === "student") {
        const student = await Student.findOne({ user: req.user._id }).select("_id");
        if (!student) return res.json({ success: true, data: [] });
        query.student = student._id;
    }
    let request = config.model.find(query).sort({ createdAt: -1 }).limit(100);
    config.populate?.forEach((path) => { request = request.populate(path); });
    const records = await request;
    return res.json({ success: true, data: records });
};

const getOne = (resource) => async (req, res) => {
    const config = getConfig(resource);
        if (["students", "teachers"].includes(resource)) {
            const matchingUsers = await User.find({ $or: [{ userName: expression }, { userEmail: expression }, { userPhoneNumber: expression }] }).select("_id");
            query.$or.push({ user: { $in: matchingUsers.map(({ _id }) => _id) } });
        }
    let record = await config.model.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    if (resource === "students" && req.userRole === "teacher") {
        const teacher = await Teacher.findOne({ user: req.user._id }).select("subjects");
        const assignedEnrollment = await Enrollment.exists({ student: record._id, course: { $in: teacher?.subjects || [] }, status: "active" });
        if (!assignedEnrollment) return res.status(403).json({ success: false, message: "This student is not in your assigned classes" });
    }
    if (resource === "courses" && req.userRole === "teacher") {
        const teacher = await Teacher.findOne({ user: req.user._id }).select("subjects");
        if (!teacher?.subjects.some((course) => course.equals(record._id))) return res.status(403).json({ success: false, message: "This course is not assigned to you" });
    }
    if (resource === "enrollments") {
        if (req.userRole === "student") {
            const student = await Student.findOne({ user: req.user._id }).select("_id");
            if (!student || !record.student.equals(student._id)) return res.status(403).json({ success: false, message: "You can only view your own enrollments" });
        } else if (req.userRole === "teacher") {
            const teacher = await Teacher.findOne({ user: req.user._id }).select("subjects");
            if (!teacher?.subjects.some((course) => course.equals(record.course))) return res.status(403).json({ success: false, message: "This enrollment is outside your assigned courses" });
        }
    }
    await record.populate(config.populate || []);
    return res.json({ success: true, data: record });
};

const create = (resource) => async (req, res) => {
    const payload = { ...req.body };
    let enrollmentStudent;
    if (resource === "enrollments") {
        const course = await Course.findById(payload.course).select("semester");
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });
        payload.semester = course.semester;
        if (req.userRole === "student") {
            enrollmentStudent = await Student.findOne({ user: req.user._id }).select("_id semester");
            if (!enrollmentStudent) return res.status(403).json({ success: false, message: "Student profile is not set up" });
            if (course.semester !== enrollmentStudent.semester) return res.status(400).json({ success: false, message: "Students can enroll only in courses for their current semester" });
            const settings = await CollegeSettings.findOne({ key: "college" }).select("academicYear");
            payload.academicYear = settings?.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
            payload.status = "active";
        }
    }
    if (resource === "enrollments" && req.userRole === "student") {
        payload.student = enrollmentStudent._id;
    }
    let linkedUser;
    if (resource === "students" || resource === "teachers") {
        const { userName, userEmail, userPhoneNumber, userPassword, gender, dateOfBirth, address, profilePicture, ...profile } = payload;
        if (!userName || !userEmail || !userPhoneNumber || !userPassword || userPassword.length < 8) {
            return res.status(400).json({ success: false, message: "Name, email, phone, and a password of at least 8 characters are required" });
        }
        if (profilePicture && !/^\/uploads\/college\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(profilePicture)) {
            return res.status(400).json({ success: false, message: "Invalid profile image reference" });
        }
        const email = userEmail.trim().toLowerCase();
        const duplicate = await User.findOne({ $or: [{ userEmail: email }, { userPhoneNumber }] });
        if (duplicate) return res.status(409).json({ success: false, message: "An account with this email or phone number already exists" });
        linkedUser = await User.create({
            userName,
            userEmail: email,
            userPhoneNumber,
            userPassword: await bcrypt.hash(userPassword, 10),
            gender,
            dateOfBirth,
            address,
            profilePicture,
            userRole: resource === "students" ? "student" : "teacher"
        });
        payload.user = linkedUser._id;
        Object.assign(payload, profile);
    }

    let record;
    try {
        record = await getConfig(resource).model.create(payload);
    } catch (error) {
        if (linkedUser) await User.findByIdAndDelete(linkedUser._id);
        throw error;
    }
    if (resource === "courses" && record.teacher) {
        await Teacher.findByIdAndUpdate(record.teacher, { $addToSet: { subjects: record._id } });
    }
    return res.status(201).json({ success: true, message: `${resource.slice(0, -1)} created successfully`, data: record });
};

const update = (resource) => async (req, res) => {
    const config = getConfig(resource);
    const previous = resource === "courses" ? await config.model.findById(req.params.id).select("teacher") : null;
    const record = await config.model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    if (resource === "courses" && String(previous?.teacher || "") !== String(record.teacher || "")) {
        if (previous?.teacher) await Teacher.findByIdAndUpdate(previous.teacher, { $pull: { subjects: record._id } });
        if (record.teacher) await Teacher.findByIdAndUpdate(record.teacher, { $addToSet: { subjects: record._id } });
    }
    await record.populate(config.populate || []);
    return res.json({ success: true, message: "Record updated successfully", data: record });
};

const remove = (resource) => async (req, res) => {
    const record = await getConfig(resource).model.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    if (resource === "courses" && record.teacher) {
        await Teacher.findByIdAndUpdate(record.teacher, { $pull: { subjects: record._id } });
    }
    if (["students", "teachers"].includes(resource)) {
        await User.findByIdAndUpdate(record.user, { isActive: false });
    }
    return res.json({ success: true, message: "Record deleted successfully" });
};

const dashboard = async (req, res) => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfDay);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    if (req.userRole === "student") {
        const student = await Student.findOne({ user: req.user._id }).select("_id semester section");
        if (!student) return res.json({ success: true, data: {
            role: "student", enrollmentCount: 0, courseCount: await Course.countDocuments(), departmentCount: await Department.countDocuments(),
            attendancePercentage: 0, currentSemester: 0, upcomingExamCount: 0, pendingAssignmentCount: 0,
            feeTotal: 0, feePaid: 0, feeRemaining: 0, upcomingExams: [], upcomingAssignments: [], latestNotices: [], upcomingEvents: [], timetable: []
        } });
        const enrollments = await Enrollment.find({ student: student._id, status: "active" }).select("course");
        const courses = enrollments.map(({ course }) => course);
        const submittedAssignmentIds = student ? await Submission.distinct("assignment", { student: student._id }) : [];
        const [courseCount, departmentCount, attendanceStats, upcomingExams, upcomingAssignments, feeTotals, latestNotices, upcomingEvents, timetable, feesDue] = await Promise.all([
            Course.countDocuments(),
            Department.countDocuments(),
            Attendance.aggregate([{ $match: { student: student?._id } }, { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } } } }]),
            Exam.find({ course: { $in: courses }, date: { $gte: now } }).populate("course", "courseName").sort({ date: 1 }).limit(3),
            Assignment.find({ course: { $in: courses }, deadline: { $gte: now }, _id: { $nin: submittedAssignmentIds } }).populate("course", "courseName").sort({ deadline: 1 }).limit(3),
            Fee.aggregate([{ $match: { student: student?._id } }, { $group: { _id: null, total: { $sum: "$amount" }, paid: { $sum: "$paidAmount" }, remaining: { $sum: "$remainingAmount" } } }]),
            Notice.find().sort({ date: -1 }).limit(3).select("title category priority date"),
            Event.find({ date: { $gte: startOfDay } }).sort({ date: 1 }).limit(3).select("name date time location"),
            Timetable.find({ semester: student.semester, section: student.section }).populate("course", "courseName").sort({ day: 1, startTime: 1 }).limit(5),
            Fee.find({ student: student._id, remainingAmount: { $gt: 0 } }).sort({ dueDate: 1 }).limit(3).select("feeType remainingAmount dueDate")
        ]);
        const attendance = attendanceStats[0] || { total: 0, present: 0 };
        const fees = feeTotals[0] || { total: 0, paid: 0, remaining: 0 };
        return res.json({ success: true, data: {
            role: "student", enrollmentCount: enrollments.length, courseCount, departmentCount, currentSemester: student.semester,
            attendancePercentage: attendance.total ? Number(((attendance.present / attendance.total) * 100).toFixed(2)) : 0,
            upcomingExamCount: upcomingExams.length,
            pendingAssignmentCount: upcomingAssignments.length,
            feeTotal: fees.total, feePaid: fees.paid, feeRemaining: fees.remaining,
            upcomingExams, upcomingAssignments, latestNotices, upcomingEvents, timetable, feesDue
        } });
    }
    if (req.userRole === "accountant") {
        const [studentCount, departmentCount, feeTotals, outstandingBorrowCount, latestNotices, upcomingEvents] = await Promise.all([
            Student.countDocuments(), Department.countDocuments(),
            Fee.aggregate([{ $group: { _id: null, revenue: { $sum: "$paidAmount" }, pending: { $sum: "$remainingAmount" } } }]),
            BorrowRecord.countDocuments({ status: { $in: ["Borrowed", "Overdue"] } }),
            Notice.find().sort({ date: -1 }).limit(3).select("title category priority date"),
            Event.find({ date: { $gte: startOfDay } }).sort({ date: 1 }).limit(3).select("name date time location")
        ]);
        return res.json({ success: true, data: { role: "accountant", studentCount, departmentCount, totalRevenue: feeTotals[0]?.revenue || 0, pendingFees: feeTotals[0]?.pending || 0, outstandingBorrowCount, latestNotices, upcomingEvents } });
    }
    if (req.userRole === "teacher") {
        const teacher = await Teacher.findOne({ user: req.user._id }).select("subjects");
        const courses = teacher?.subjects || [];
        const [studentIds, enrollmentCount, timetable, assignmentIds] = await Promise.all([
            Enrollment.distinct("student", { course: { $in: courses }, status: "active" }),
            Enrollment.countDocuments({ course: { $in: courses }, status: "active" }),
            Timetable.find({ teacher: teacher?._id, day: now.toLocaleDateString("en-US", { weekday: "long" }) }).populate("course", "courseName").sort({ startTime: 1 }).limit(5),
            Assignment.find({ teacher: teacher?._id }).distinct("_id")
        ]);
        const [pendingAssignmentCount, todayAttendanceCount, latestNotices, upcomingEvents, upcomingAssignments] = await Promise.all([
            Submission.countDocuments({ assignment: { $in: assignmentIds }, status: { $ne: "Graded" } }),
            Attendance.countDocuments({ course: { $in: courses }, date: { $gte: startOfDay, $lt: startOfTomorrow } }),
            Notice.find().sort({ date: -1 }).limit(3).select("title category priority date"),
            Event.find({ date: { $gte: startOfDay } }).sort({ date: 1 }).limit(3).select("name date time location"),
            Assignment.find({ teacher: teacher?._id, deadline: { $gte: now } }).populate("course", "courseName").sort({ deadline: 1 }).limit(3)
        ]);
        return res.json({ success: true, data: {
            role: "teacher",
            studentCount: studentIds.length,
            teacherCount: 1,
            courseCount: courses.length,
            departmentCount: 0,
            enrollmentCount,
            pendingAssignmentCount,
            todayAttendanceCount,
            timetable,
            todayClassCount: timetable.length,
            latestNotices,
            upcomingEvents,
            upcomingAssignments
        } });
    }
    const [studentCount, teacherCount, courseCount, departmentCount, enrollmentCount, feeTotals, todayAttendanceCount, upcomingExamCount, latestNotices, upcomingEvents] = await Promise.all([
        Student.countDocuments(), Teacher.countDocuments(), Course.countDocuments(),
        Department.countDocuments(), Enrollment.countDocuments({ status: "active" }),
        Fee.aggregate([{ $group: { _id: null, revenue: { $sum: "$paidAmount" }, pending: { $sum: "$remainingAmount" } } }]),
        Attendance.countDocuments({ date: { $gte: startOfDay, $lt: startOfTomorrow } }),
        Exam.countDocuments({ date: { $gte: now } }),
        Notice.find().sort({ date: -1 }).limit(3).select("title category priority date"),
        Event.find({ date: { $gte: startOfDay } }).sort({ date: 1 }).limit(3).select("name date time location")
    ]);
    const weekStart = new Date(startOfDay);
    weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [studentGrowth, attendanceByDay, feeCollection, departmentDistribution] = await Promise.all([
        Student.aggregate([
            { $match: { createdAt: { $gte: monthStart } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]),
        Attendance.aggregate([
            { $match: { date: { $gte: weekStart, $lt: startOfTomorrow } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } }, absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } }, late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } } } },
            { $sort: { _id: 1 } }
        ]),
        Fee.aggregate([
            { $match: { paymentDate: { $gte: monthStart } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } }, collected: { $sum: "$paidAmount" } } },
            { $sort: { _id: 1 } }
        ]),
        Department.aggregate([
            { $lookup: { from: Student.collection.name, localField: "_id", foreignField: "department", as: "students" } },
            { $project: { name: 1, code: 1, studentCount: { $size: "$students" } } },
            { $sort: { studentCount: -1, name: 1 } }
        ])
    ]);
    return res.json({
        success: true,
        data: { role: req.userRole, studentCount, teacherCount, courseCount, departmentCount, enrollmentCount, totalRevenue: feeTotals[0]?.revenue || 0, pendingFees: feeTotals[0]?.pending || 0, todayAttendanceCount, upcomingExamCount, latestNotices, upcomingEvents, studentGrowth, attendanceByDay, feeCollection, departmentDistribution }
    });
};

const studentOptions = async (req, res) => {
    const query = {};
    if (req.query.search) {
        const expression = new RegExp(String(req.query.search).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = [{ studentId: expression }, { program: expression }, { section: expression }];
    }
    const records = await Student.find(query).select("studentId").populate("user", "userName").sort({ studentId: 1 }).limit(300);
    return res.json({ success: true, data: records });
};

module.exports = { list, getOne, create, update, remove, dashboard, studentOptions };