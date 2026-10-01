const router = require("express").Router();
const path = require("path");
const isAuthenticated = require("../middleware/isAuthenticated");
const checkRole = require("../middleware/checkRole");
const catchAsync = require("../services/catchAsync");
const controller = require("../controller/college/collegeController");
const academic = require("../controller/college/academicController");
const campus = require("../controller/college/campusController");
const collegeUpload = require("../middleware/collegeUpload");

router.use(isAuthenticated);
router.get("/dashboard", checkRole("admin", "teacher", "student", "accountant"), catchAsync(controller.dashboard));
router.get("/attendance", checkRole("admin", "teacher", "student"), catchAsync(academic.listAttendance));
router.post("/attendance", checkRole("admin", "teacher"), catchAsync(academic.writeAttendance));
router.patch("/attendance/:id", checkRole("admin", "teacher"), catchAsync(academic.updateAttendance));
router.get("/attendance/summary", checkRole("admin", "teacher", "student"), catchAsync(academic.attendanceSummary));
router.get("/exams", checkRole("admin", "teacher", "student"), catchAsync(academic.listExams));
router.post("/exams", checkRole("admin", "teacher"), catchAsync(academic.createExam));
router.put("/exams/:id", checkRole("admin", "teacher"), catchAsync(academic.updateExam));
router.delete("/exams/:id", checkRole("admin", "teacher"), catchAsync(academic.deleteExam));
router.get("/marks", checkRole("admin", "teacher", "student"), catchAsync(academic.listMarks));
router.post("/marks", checkRole("admin", "teacher"), catchAsync(academic.writeMarks));

router.get("/notices", checkRole("admin", "teacher", "student", "accountant"), catchAsync(campus.listNotices));
router.post("/notices", checkRole("admin", "teacher"), catchAsync(campus.createNotice));
router.put("/notices/:id", checkRole("admin", "teacher"), catchAsync(campus.updateNotice));
router.delete("/notices/:id", checkRole("admin", "teacher"), catchAsync(campus.deleteNotice));

router.get("/assignments", checkRole("admin", "teacher", "student"), catchAsync(campus.listAssignments));
router.post("/assignments", checkRole("admin", "teacher"), catchAsync(campus.createAssignment));
router.put("/assignments/:id", checkRole("admin", "teacher"), catchAsync(campus.updateAssignment));
router.delete("/assignments/:id", checkRole("admin", "teacher"), catchAsync(campus.deleteAssignment));
router.get("/submissions", checkRole("admin", "teacher", "student"), catchAsync(campus.listSubmissions));
router.post("/submissions", checkRole("student"), catchAsync(campus.submitAssignment));
router.patch("/submissions/:id/grade", checkRole("admin", "teacher"), catchAsync(campus.gradeSubmission));

router.get("/timetable", checkRole("admin", "teacher", "student"), catchAsync(campus.listTimetable));
router.post("/timetable", checkRole("admin"), catchAsync(campus.createTimetableEntry));
router.put("/timetable/:id", checkRole("admin"), catchAsync(campus.updateTimetableEntry));
router.delete("/timetable/:id", checkRole("admin"), catchAsync(campus.deleteTimetableEntry));

router.get("/fees", checkRole("admin", "accountant", "student"), catchAsync(campus.listFees));
router.post("/fees", checkRole("admin", "accountant"), catchAsync(campus.createFee));
router.put("/fees/:id", checkRole("admin", "accountant"), catchAsync(campus.updateFee));
router.delete("/fees/:id", checkRole("admin", "accountant"), catchAsync(campus.deleteFee));

router.get("/books", checkRole("admin", "accountant", "teacher", "student"), catchAsync(campus.listBooks));
router.post("/books", checkRole("admin", "accountant"), catchAsync(campus.createBook));
router.put("/books/:id", checkRole("admin", "accountant"), catchAsync(campus.updateBook));
router.delete("/books/:id", checkRole("admin", "accountant"), catchAsync(campus.deleteBook));
router.get("/borrows", checkRole("admin", "accountant", "student"), catchAsync(campus.listBorrows));
router.post("/borrows", checkRole("admin", "accountant"), catchAsync(campus.issueBook));
router.patch("/borrows/:id/return", checkRole("admin", "accountant"), catchAsync(campus.returnBook));

router.get("/events", checkRole("admin", "teacher", "student", "accountant"), catchAsync(campus.listEvents));
router.post("/events", checkRole("admin"), catchAsync(campus.createEvent));
router.put("/events/:id", checkRole("admin"), catchAsync(campus.updateEvent));
router.delete("/events/:id", checkRole("admin"), catchAsync(campus.deleteEvent));
router.get("/settings", checkRole("admin", "teacher", "student", "accountant"), catchAsync(campus.getSettings));
router.put("/settings", checkRole("admin"), catchAsync(campus.updateSettings));

router.post("/uploads", checkRole("admin", "teacher", "student", "accountant"), (req, res) => {
    collegeUpload.single("file")(req, res, (error) => {
        if (error) {
            const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            return res.status(status).json({ success: false, message: error.message });
        }
        if (!req.file) return res.status(400).json({ success: false, message: "Select a file to upload" });
        return res.status(201).json({ success: true, data: { path: `/uploads/college/${req.file.filename}` } });
    });
});
router.get("/uploads/:filename", checkRole("admin", "teacher", "student", "accountant"), (req, res) => {
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/i.test(req.params.filename)) {
        return res.status(404).json({ success: false, message: "File not found" });
    }
    return res.sendFile(path.join(__dirname, "../uploads/college", req.params.filename), (error) => {
        if (error && !res.headersSent) res.status(404).json({ success: false, message: "File not found" });
    });
});

const registerResource = (path, resource, permissions) => {
    const roles = permissions.read;
    const resourceRouter = require("express").Router();
    resourceRouter.get("/", checkRole(...roles), catchAsync(controller.list(resource)));
    resourceRouter.get("/:id", checkRole(...roles), catchAsync(controller.getOne(resource)));
    if (permissions.write.length) {
        resourceRouter.post("/", checkRole(...permissions.write), catchAsync(controller.create(resource)));
        resourceRouter.put("/:id", checkRole(...permissions.write), catchAsync(controller.update(resource)));
        resourceRouter.delete("/:id", checkRole(...permissions.write), catchAsync(controller.remove(resource)));
    }
    router.use(`/${path}`, resourceRouter);
};

registerResource("departments", "departments", { read: ["admin", "teacher", "student", "accountant"], write: ["admin"] });
registerResource("courses", "courses", { read: ["admin", "teacher", "student", "accountant"], write: ["admin"] });
router.get("/students/options", checkRole("admin", "accountant"), catchAsync(controller.studentOptions));
registerResource("students", "students", { read: ["admin", "teacher"], write: ["admin"] });
registerResource("teachers", "teachers", { read: ["admin"], write: ["admin"] });
registerResource("enrollments", "enrollments", { read: ["admin", "teacher", "student"], write: [] });
router.post("/enrollments", checkRole("admin", "student"), catchAsync(controller.create("enrollments")));
router.put("/enrollments/:id", checkRole("admin"), catchAsync(controller.update("enrollments")));
router.delete("/enrollments/:id", checkRole("admin"), catchAsync(controller.remove("enrollments")));

module.exports = router;