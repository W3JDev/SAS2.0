/***********************************************
 * main.js - Phase 1 with localStorage
 * Admin login is hard-coded for demonstration
 ***********************************************/

// Hard-coded admin credentials for Phase 1
const ADMIN_CREDENTIALS = {
  username: "admin@example.com",
  password: "admin123"
};

/* LOCAL STORAGE KEYS:
   - staffList: [{ passcode, name, role, startDate, wageType, wageRate, etc. }]
   - attendanceList: [{ passcode, clockIn, clockOut, hours, faceImgBase64, etc. }]
*/

// Initialize data if not present
(function initData() {
  if (!localStorage.getItem("staffList")) {
    const dummyStaff = [
      { passcode: "9999", name: "Boss", role: "admin", wageType: "hourly", wageRate: 20, startDate: "2025-01-01" },
      { passcode: "3793", name: "Siska", role: "staff", wageType: "fixed", wageRate: 2000, startDate: "2025-01-15" }
    ];
    localStorage.setItem("staffList", JSON.stringify(dummyStaff));
  }
  if (!localStorage.getItem("attendanceList")) {
    localStorage.setItem("attendanceList", JSON.stringify([]));
  }
})();

/* ----- GET/SET LOCALSTORAGE ----- */
function getStaffList() {
  return JSON.parse(localStorage.getItem("staffList")) || [];
}
function saveStaffList(arr) {
  localStorage.setItem("staffList", JSON.stringify(arr));
}
function getAttendanceList() {
  return JSON.parse(localStorage.getItem("attendanceList")) || [];
}
function saveAttendanceList(arr) {
  localStorage.setItem("attendanceList", JSON.stringify(arr));
}

/* ----- ADMIN LOGIN LOGIC ----- */
function adminLogin(username, password) {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    // success
    localStorage.setItem("adminSession", "true");
    return true;
  }
  return false;
}
function isAdminLoggedIn() {
  return localStorage.getItem("adminSession") === "true";
}
function adminLogout() {
  localStorage.removeItem("adminSession");
}

/* ----- STAFF LOGIN LOGIC (by passcode) ----- */
function findStaffByPasscode(passcode) {
  let list = getStaffList();
  return list.find(s => s.passcode === passcode);
}

/* ----- CLOCK IN / CLOCK OUT LOGIC ----- */
function clockIn(passcode, faceImg=null) {
  let staff = findStaffByPasscode(passcode);
  if (!staff) {
    return { error: "Invalid passcode." };
  }
  // Check if already clocked in
  let attList = getAttendanceList();
  let openShift = attList.find(a => a.passcode === passcode && !a.clockOut);
  if (openShift) {
    return { error: `Already clocked in at ${new Date(openShift.clockIn).toLocaleString()}.` };
  }
  let now = new Date();
  attList.push({
    passcode,
    clockIn: now.toISOString(),
    clockOut: null,
    hours: 0,
    faceImg
  });
  saveAttendanceList(attList);
  return { success: `Clock In at ${now.toLocaleString()}` };
}

function clockOut(passcode) {
  let staff = findStaffByPasscode(passcode);
  if (!staff) {
    return { error: "Invalid passcode." };
  }
  let attList = getAttendanceList();
  let idx = attList.findIndex(a => a.passcode === passcode && !a.clockOut);
  if (idx === -1) {
    return { error: "You have not clocked in yet." };
  }
  let now = new Date();
  let inTime = new Date(attList[idx].clockIn);
  let diff = (now - inTime) / (1000 * 60 * 60);
  attList[idx].clockOut = now.toISOString();
  attList[idx].hours = parseFloat(diff.toFixed(2));
  saveAttendanceList(attList);
  return { success: `Clock Out at ${now.toLocaleString()}, Hours: ${diff.toFixed(2)}` };
}
