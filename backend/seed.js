require("dotenv").config();
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const connectDB = require("./database/connection");
const User = require("./models/UserModel");
const Department = require("./models/Department");
const Student = require("./models/Student");
const Teacher = require("./models/Teacher");
const Course = require("./models/Course");
const Enrollment = require("./models/Enrollment");
const Attendance = require("./models/Attendance");
const Exam = require("./models/Exam");
const Mark = require("./models/Mark");
const Assignment = require("./models/Assignment");
const Book = require("./models/Book");
const BorrowRecord = require("./models/BorrowRecord");
const CollegeSettings = require("./models/CollegeSettings");
const Event = require("./models/Event");
const Fee = require("./models/Fee");
const Notice = require("./models/Notice");
const Timetable = require("./models/Timetable");

const upsertUser = async ({ email, phone, name, role, password }) => {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.findOneAndUpdate(
        { userEmail: email },
        {
            $set: {
                userPhoneNumber: phone,
                userName: name,
                userRole: role,
                userPassword: passwordHash,
                isActive: true
            },
            $setOnInsert: { userEmail: email }
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return user;
};

const runSeed = async () => {
    const requiredPasswords = [
        process.env.ADMIN_PASSWORD,
        process.env.DEMO_TEACHER_PASSWORD,
        process.env.DEMO_STUDENT_PASSWORD,
        process.env.DEMO_ACCOUNTANT_PASSWORD
    ];
    if (requiredPasswords.some((password) => !password || password.length < 8)) {
        throw new Error("Set ADMIN_PASSWORD and all DEMO_*_PASSWORD values to at least 8 characters before seeding");
    }

    await connectDB();

    const department = await Department.findOneAndUpdate(
        { code: "CS" },
        { $set: { name: "Computer Science", description: "Computing, software engineering, and information systems" } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    const informationTechnology = await Department.findOneAndUpdate(
        { code: "IT" },
        { $set: { name: "Information Technology", description: "Networks, infrastructure, and applied technology" } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const teacherUser = await upsertUser({
        email: process.env.DEMO_TEACHER_EMAIL || "teacher@scms.local",
        phone: "5550101001",
        name: "Avery Morgan",
        role: "teacher",
        password: process.env.DEMO_TEACHER_PASSWORD
    });
    const studentUser = await upsertUser({
        email: process.env.DEMO_STUDENT_EMAIL || "student@scms.local",
        phone: "5550101002",
        name: "Jordan Lee",
        role: "student",
        password: process.env.DEMO_STUDENT_PASSWORD
    });
    await upsertUser({
        email: process.env.DEMO_ACCOUNTANT_EMAIL || "accountant@scms.local",
        phone: "5550101003",
        name: "Taylor Patel",
        role: "accountant",
        password: process.env.DEMO_ACCOUNTANT_PASSWORD
    });

    const teacher = await Teacher.findOneAndUpdate(
        { teacherId: "TCH-2026-001" },
        { $set: { user: teacherUser._id, department: department._id, qualification: "M.Sc. Computer Science", joiningDate: new Date("2022-08-15") } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    const student = await Student.findOneAndUpdate(
        { studentId: "SCMS-2026-001" },
        { $set: {
            user: studentUser._id,
            department: department._id,
            program: "B.Sc. Computer Science",
            semester: 1,
            section: "A",
            rollNumber: "CS-1A-024",
            admissionDate: new Date("2026-08-01")
        } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const programming = await Course.findOneAndUpdate(
        { courseCode: "CS101" },
        { $set: {
            courseName: "Introduction to Computer Science",
            description: "Foundations of computing, problem solving, and programming concepts",
            creditHours: 3,
            department: department._id,
            semester: 1,
            teacher: teacher._id,
            courseType: "Core"
        } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    const mathematics = await Course.findOneAndUpdate(
        { courseCode: "IT105" },
        { $set: {
            courseName: "Digital Systems and Networks",
            description: "An introduction to digital systems, network fundamentals, and information technology",
            creditHours: 3,
            department: informationTechnology._id,
            semester: 1,
            teacher: teacher._id,
            courseType: "Core"
        } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    teacher.subjects = [programming._id, mathematics._id];
    await teacher.save();
    await Promise.all([programming, mathematics].map((course) => Enrollment.updateOne(
        { student: student._id, course: course._id, academicYear: "2026-2027" },
        { $setOnInsert: { student: student._id, course: course._id, semester: 1, academicYear: "2026-2027", status: "active" } },
        { upsert: true }
    )));

    const classDays = [
        { date: new Date("2026-09-21T09:00:00"), status: "Present" },
        { date: new Date("2026-09-23T09:00:00"), status: "Late" },
        { date: new Date("2026-09-25T09:00:00"), status: "Absent" }
    ];
    await Promise.all(classDays.map(({ date, status }) => Attendance.updateOne(
        { student: student._id, course: programming._id, date },
        { $setOnInsert: { student: student._id, course: programming._id, teacher: teacher._id, date, status } },
        { upsert: true }
    )));

    const exam = await Exam.findOneAndUpdate(
        { name: "Programming foundations assessment", course: programming._id },
        { $set: { semester: 1, date: new Date("2026-09-28"), fullMarks: 100, passMarks: 40, createdBy: teacherUser._id } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    const mark = await Mark.findOne({ student: student._id, exam: exam._id });
    if (mark) {
        mark.theoryMarks = 68;
        mark.practicalMarks = 18;
        await mark.save();
    } else {
        await Mark.create({ student: student._id, exam: exam._id, course: programming._id, theoryMarks: 68, practicalMarks: 18 });
    }

    const adminUser = await User.findOne({ userEmail: process.env.ADMIN_EMAIL });
    await Notice.findOneAndUpdate(
        { title: "Welcome to the 2026-2027 academic year" },
        { $set: { description: "Classes for the fall semester are underway. Students should review their course schedules and confirm their enrollment records.", category: "General", priority: "Normal", publishedBy: adminUser._id, date: new Date("2026-09-01") } },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    await Notice.findOneAndUpdate(
        { title: "Midterm assessment schedule" },
        { $set: { description: "The first assessment period begins in the final week of October. Review course announcements for room assignments.", category: "Exam", priority: "High", publishedBy: adminUser._id, date: new Date("2026-09-26") } },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await Assignment.findOneAndUpdate(
        { title: "Algorithm design exercise", course: programming._id },
        { $set: { description: "Submit a short analysis comparing two search strategies, including pseudocode and a worked example.", teacher: teacher._id, deadline: new Date("2026-10-12T23:59:00") } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const timetableRows = [
        { day: "Monday", startTime: "09:00", endTime: "10:30", course: programming._id, teacher: teacher._id, room: "CS-204", semester: 1, section: "A" },
        { day: "Wednesday", startTime: "11:00", endTime: "12:30", course: mathematics._id, teacher: teacher._id, room: "IT-112", semester: 1, section: "A" },
        { day: "Friday", startTime: "09:00", endTime: "10:30", course: programming._id, teacher: teacher._id, room: "CS-Lab-2", semester: 1, section: "A" }
    ];
    await Promise.all(timetableRows.map((entry) => Timetable.findOneAndUpdate(
        { day: entry.day, startTime: entry.startTime, course: entry.course, semester: entry.semester, section: entry.section },
        { $set: entry },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )));

    let fee = await Fee.findOne({ student: student._id, feeType: "Semester Fee", dueDate: new Date("2026-10-20") });
    if (!fee) fee = new Fee({ student: student._id, feeType: "Semester Fee", amount: 24000, paidAmount: 14000, dueDate: new Date("2026-10-20") });
    await fee.save();

    let book = await Book.findOne({ bookId: "LIB-CS-001" });
    if (!book) {
        book = await Book.create({ bookId: "LIB-CS-001", title: "Structure and Interpretation of Computer Programs", author: "Harold Abelson and Gerald Jay Sussman", isbn: "9780262510875", category: "Computer Science", quantity: 8, availableQuantity: 8 });
    }
    const existingBorrow = await BorrowRecord.findOne({ student: student._id, book: book._id, status: { $in: ["Borrowed", "Overdue"] } });
    if (!existingBorrow) {
        const availableBook = await Book.findOneAndUpdate({ _id: book._id, availableQuantity: { $gt: 0 } }, { $inc: { availableQuantity: -1 } }, { new: true });
        if (availableBook) await BorrowRecord.create({ student: student._id, book: book._id, issueDate: new Date("2026-09-18"), dueDate: new Date("2026-10-09") });
    }

    await Event.findOneAndUpdate(
        { name: "Campus science and innovation day", date: new Date("2026-10-18") },
        { $set: { description: "Student project demonstrations, faculty talks, and hands-on computing workshops.", time: "10:00", location: "Main campus auditorium", organizer: "School of Computing" } },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    await CollegeSettings.findOneAndUpdate(
        { key: "college" },
        { $set: { collegeName: "Northbridge College of Technology", academicYear: "2026-2027", currentSemester: 1, gradingScale: [{ grade: "A", minimumPercentage: 90 }, { grade: "B", minimumPercentage: 80 }, { grade: "C", minimumPercentage: 70 }, { grade: "D", minimumPercentage: 60 }, { grade: "F", minimumPercentage: 0 }], contactInformation: "Registrar office: weekdays, 09:00-16:00", address: "18 University Road, Northbridge", email: "registrar@northbridge.edu", phone: "+1-555-0100" }, $setOnInsert: { key: "college" } },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    console.log("SCMS demo data is ready.");
    console.log(`Admin: ${process.env.ADMIN_EMAIL}`);
    console.log(`Teacher: ${process.env.DEMO_TEACHER_EMAIL || "teacher@scms.local"}`);
    console.log(`Student: ${process.env.DEMO_STUDENT_EMAIL || "student@scms.local"}`);
    console.log(`Accountant: ${process.env.DEMO_ACCOUNTANT_EMAIL || "accountant@scms.local"}`);
};

runSeed()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    });