const test = require("node:test");
const assert = require("node:assert/strict");
const checkRole = require("../middleware/checkRole");

const authorize = (role, ...allowedRoles) => {
    let statusCode = 200;
    let responseBody;
    let nextCalled = false;
    const req = { user: role ? { userRole: role } : null };
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(body) {
            responseBody = body;
            return this;
        }
    };
    checkRole(...allowedRoles)(req, res, () => { nextCalled = true; });
    return { statusCode, responseBody, nextCalled, normalizedRole: req.userRole };
};

test("allows an admin role and exposes the normalized role", () => {
    const result = authorize("admin", "admin");
    assert.equal(result.nextCalled, true);
    assert.equal(result.normalizedRole, "admin");
});

test("preserves access for legacy seller accounts on admin routes", () => {
    const result = authorize("seller", "admin");
    assert.equal(result.nextCalled, true);
    assert.equal(result.normalizedRole, "admin");
});

test("denies students access to admin routes", () => {
    const result = authorize("student", "admin");
    assert.equal(result.nextCalled, false);
    assert.equal(result.statusCode, 403);
    assert.equal(result.responseBody.success, false);
});

test("denies requests without an authenticated user", () => {
    const result = authorize(null, "admin");
    assert.equal(result.nextCalled, false);
    assert.equal(result.statusCode, 403);
});