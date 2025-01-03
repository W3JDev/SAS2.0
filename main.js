/***********************************************
 * main.js - Phase 2
 ***********************************************/

// Hard-coded admin credentials remain
const ADMIN_CREDENTIALS = {
  username: "admin@example.com",
  password: "admin123"
};

/* LOCAL STORAGE KEYS now expanded:
   - staffList:       [{ passcode, name, role, wageType, wageRate, startDate, imageBase64, etc. }]
   - attendanceList:  [{ passcode, clockIn, clockOut, hours, faceImg }]
   - shiftList:       [{ shiftId, passcode?, date, startTime, endTime }]
   - missedPunchList: [{ mpId, passcode, date, desiredIn, desiredOut, status }]
   - leaveList:       [{ leaveId, passcode, date, leaveType, docFileBase64?, status }]
   - payslipList:     [{ payslipId, passcode, month, basePay, lateDeduction, absentDeduction, netPay, status }]
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
  if (!localStorage.getItem("shiftList")) {
    localStorage.setItem("shiftList", JSON.stringify([]));
  }
  if (!localStorage.getItem("missedPunchList")) {
    localStorage.setItem("missedPunchList", JSON.stringify([]));
  }
  if (!localStorage.getItem("leaveList")) {
    localStorage.setItem("leaveList", JSON.stringify([]));
  }
  if (!localStorage.getItem("payslipList")) {
    localStorage.setItem("payslipList", JSON.stringify([]));
  }
})();

/* ----- GET/SET localStorage HELPERS ----- */
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

function getShiftList() {
  return JSON.parse(localStorage.getItem("shiftList")) || [];
}
function saveShiftList(arr) {
  localStorage.setItem("shiftList", JSON.stringify(arr));
}

function getMissedPunchList() {
  return JSON.parse(localStorage.getItem("missedPunchList")) || [];
}
function saveMissedPunchList(arr) {
  localStorage.setItem("missedPunchList", JSON.stringify(arr));
}

function getLeaveList() {
  return JSON.parse(localStorage.getItem("leaveList")) || [];
}
function saveLeaveList(arr) {
  localStorage.setItem("leaveList", JSON.stringify(arr));
}

function getPayslipList() {
  return JSON.parse(localStorage.getItem("payslipList")) || [];
}
function savePayslipList(arr) {
  localStorage.setItem("payslipList", JSON.stringify(arr));
}

/* ----- ADMIN LOGIN ----- */
function adminLogin(username, password) {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
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

/* ----- STAFF LOGIN (passcode) ----- */
function findStaffByPasscode(passcode) {
  let list = getStaffList();
  return list.find(s => s.passcode === passcode);
}

/* ----- CLOCK IN / CLOCK OUT ----- */
function clockIn(passcode, faceImg=null) {
  let staff = findStaffByPasscode(passcode);
  if (!staff) {
    return { error: "Invalid passcode." };
  }
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

/* ----- STAFF MANAGEMENT (Add/Update) ----- */
function saveOrUpdateStaff(staffObj) {
  // staffObj = { passcode, name, role, wageType, wageRate, startDate, imageBase64?, ...}
  let list = getStaffList();
  let idx = list.findIndex(s => s.passcode === staffObj.passcode);
  if (idx === -1) {
    list.push(staffObj);
  } else {
    list[idx] = staffObj; // overwrite existing
  }
  saveStaffList(list);
}

/* ----- SHIFT MANAGEMENT ----- */
function createShift(shiftObj) {
  // shiftObj = { shiftId, passcode?(optional), date, startTime, endTime }
  let sList = getShiftList();
  sList.push(shiftObj);
  saveShiftList(sList);
  return { success: "Shift Created." };
}

/* ----- MISSED PUNCH ----- */
function submitMissedPunch(passcode, date, desiredIn, desiredOut) {
  // Validate that date is within last 7 days
  let now = new Date();
  let mpDate = new Date(date);
  if ((now - mpDate) > 7*24*60*60*1000) {
    return { error: "You can only submit missed punch within the last 7 days." };
  }
  let mpList = getMissedPunchList();
  let mpId = "MP_" + Date.now();
  let req = {
    mpId,
    passcode,
    date,
    desiredIn,
    desiredOut,
    status: "Pending"
  };
  mpList.push(req);
  saveMissedPunchList(mpList);
  return { success: "Missed Punch request submitted." };
}

function approveMissedPunch(mpId) {
  let mpList = getMissedPunchList();
  let idx = mpList.findIndex(m => m.mpId === mpId);
  if (idx === -1) return { error: "Not found." };
  
  mpList[idx].status = "Approved";
  // Insert or update attendance record
  let attendance = getAttendanceList();
  
  // Check if there's an existing record for that passcode & date
  // We'll do a simple approach: create a brand new record with clockIn=desiredIn, clockOut=desiredOut
  let clockInDate = mpList[idx].desiredIn ? new Date(mpList[idx].desiredIn) : null;
  let clockOutDate = mpList[idx].desiredOut ? new Date(mpList[idx].desiredOut) : null;
  let hours = 0;
  if (clockInDate && clockOutDate) {
    hours = parseFloat(((clockOutDate - clockInDate) / (1000*60*60)).toFixed(2));
  }
  
  attendance.push({
    passcode: mpList[idx].passcode,
    clockIn: clockInDate ? clockInDate.toISOString() : null,
    clockOut: clockOutDate ? clockOutDate.toISOString() : null,
    hours: hours,
    faceImg: null
  });
  saveAttendanceList(attendance);
  
  saveMissedPunchList(mpList);
  return { success: "Missed Punch Approved & attendance record updated." };
}

function rejectMissedPunch(mpId) {
  let mpList = getMissedPunchList();
  let idx = mpList.findIndex(m => m.mpId === mpId);
  if (idx === -1) return { error: "Not found." };
  mpList[idx].status = "Rejected";
  saveMissedPunchList(mpList);
  return { success: "Missed Punch Rejected." };
}

/* ----- LEAVE / MC ----- */
function submitLeave(passcode, date, leaveType, docFileBase64=null) {
  // create new leave request
  let lvList = getLeaveList();
  let leaveId = "LV_" + Date.now();
  let req = {
    leaveId,
    passcode,
    date,
    leaveType, // "MC", "AL", "UL"
    docFileBase64,
    status: "Pending"
  };
  lvList.push(req);
  saveLeaveList(lvList);
  return { success: "Leave/MC Request Submitted. Pending Approval." };
}

function approveLeave(leaveId) {
  let lvList = getLeaveList();
  let idx = lvList.findIndex(l => l.leaveId === leaveId);
  if (idx === -1) return { error: "Not found." };
  lvList[idx].status = "Approved";
  // Optionally mark attendance for that date as "leave" or skip attendance
  saveLeaveList(lvList);
  return { success: "Leave Approved." };
}
function rejectLeave(leaveId) {
  let lvList = getLeaveList();
  let idx = lvList.findIndex(l => l.leaveId === leaveId);
  if (idx === -1) return { error: "Not found." };
  lvList[idx].status = "Rejected";
  saveLeaveList(lvList);
  return { success: "Leave Rejected." };
}

/* ----- PAYSLIP GENERATION ----- 
   Simple approach:
   - If wageType = "hourly": total hours * wageRate
   - If wageType = "fixed": base monthly pay
   - If absent > 4 days => deduct dailyRate * (absentDays - 4)
   - Lateness => compute from shift start vs. actual clockIn, 
     sum up, convert to hours * hourly portion or partial daily portion. 
   In reality, you'd track each day. We'll do a simplified monthly approach.
*/
function generatePayslipsForMonth(monthStr) {
  // monthStr example: "2025-03" (YYYY-MM)
  let staffList = getStaffList();
  let shiftList = getShiftList();
  let attendance = getAttendanceList();
  
  let psList = getPayslipList();
  
  // For each staff
  staffList.forEach(staff => {
    if (staff.role !== "staff") return; // skip admins
    
    let staffAtt = attendance.filter(a => {
      let d = new Date(a.clockIn);
      let ym = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
      return a.passcode === staff.passcode && ym === monthStr;
    });
    
    // 1) Calculate total hours
    let totalHours = staffAtt.reduce((sum, a) => sum + a.hours, 0);
    
    // 2) Count absences
    // We'll consider "absence" if staff had a shift but no attendance. 
    let staffShifts = shiftList.filter(s => {
      let sYm = s.date.substring(0,7); // if date is "2025-03-15", substring(0,7) => "2025-03"
      return (s.passcode === staff.passcode || !s.passcode) && sYm === monthStr;
    });
    // For each shift, check if there's an attendance record matching that date
    // If none => absent
    let absentDays = 0;
    staffShifts.forEach(shift => {
      let dayAtt = staffAtt.find(a => new Date(a.clockIn).toISOString().substring(0,10) === shift.date);
      if(!dayAtt) absentDays++;
    });
    
    // 3) Basic pay
    let basePay = 0;
    if (staff.wageType === "hourly") {
      basePay = totalHours * staff.wageRate;
    } else {
      // "fixed"
      basePay = staff.wageRate; // assume monthly
    }
    
    // 4) Lateness deduction 
    // We'll do a naive approach: for each shift, if staff clockIn is after shiftStart, sum up the difference
    let totalLateMinutes = 0;
    staffShifts.forEach(shift => {
      // find attendance record for that day
      let rec = staffAtt.find(a => new Date(a.clockIn).toISOString().substring(0,10) === shift.date);
      if (!rec) return;
      // compare rec.clockIn time vs shift.startTime
      let shiftStart = new Date(shift.date + "T" + shift.startTime + ":00");
      let actualIn = new Date(rec.clockIn);
      if (actualIn > shiftStart) {
        let diffMs = actualIn - shiftStart;
        let diffMin = diffMs / (1000 * 60);
        totalLateMinutes += diffMin;
      }
    });
    // convert late minutes to fraction of hour, then multiply by hourly or daily portion
    let lateHours = totalLateMinutes / 60;
    let lateDeduction = 0;
    if (staff.wageType === "hourly") {
      lateDeduction = lateHours * staff.wageRate;
    } else {
      // if "fixed", assume monthly wage / 26 = daily, then / 8 = hourly
      let dailyRate = staff.wageRate / 26;
      let hourlyRate = dailyRate / 8;
      lateDeduction = lateHours * hourlyRate;
    }
    
    // 5) Absent deduction if absentDays > 4
    let absentDeduction = 0;
    if (staff.wageType === "fixed" && absentDays > 4) {
      let dailyRate = staff.wageRate / 26;
      absentDeduction = dailyRate * (absentDays - 4);
    }
    
    let netPay = basePay - lateDeduction - absentDeduction;
    
    let payslipId = `PS_${staff.passcode}_${monthStr}`;
    // Store or update payslip
    let existingIdx = psList.findIndex(p => p.payslipId === payslipId);
    let slipObj = {
      payslipId,
      passcode: staff.passcode,
      month: monthStr,
      basePay: parseFloat(basePay.toFixed(2)),
      lateDeduction: parseFloat(lateDeduction.toFixed(2)),
      absentDeduction: parseFloat(absentDeduction.toFixed(2)),
      netPay: parseFloat(netPay.toFixed(2)),
      status: "Published"
    };
    if (existingIdx === -1) {
      psList.push(slipObj);
    } else {
      psList[existingIdx] = slipObj; // update
    }
  });
  
  savePayslipList(psList);
  return { success: "Payslips generated for " + monthStr };
}

/* For staff to view their payslips */
function getStaffPayslips(passcode) {
  let psList = getPayslipList();
  return psList.filter(p => p.passcode === passcode);
}

/* Staff can "acknowledge" or "accept" payslip if desired. */
function acceptPayslip(payslipId) {
  let psList = getPayslipList();
  let idx = psList.findIndex(p => p.payslipId === payslipId);
  if (idx === -1) return { error: "Payslip not found." };
  psList[idx].status = "Accepted by Staff";
  savePayslipList(psList);
  return { success: "Payslip accepted." };
}

/* ----- Optional PDF Generation with jsPDF (demo) ----- */
function downloadPayslipPDF(payslip) {
  // Using jsPDF
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Payslip", 10, 10);
  doc.setFontSize(12);
  doc.text(`Month: ${payslip.month}`, 10, 20);
  doc.text(`Passcode: ${payslip.passcode}`, 10, 30);
  doc.text(`Base Pay: ${payslip.basePay}`, 10, 40);
  doc.text(`Late Deduction: ${payslip.lateDeduction}`, 10, 50);
  doc.text(`Absent Deduction: ${payslip.absentDeduction}`, 10, 60);
  doc.text(`Net Pay: ${payslip.netPay}`, 10, 70);
  doc.text(`Status: ${payslip.status}`, 10, 80);
  
  doc.save(`Payslip_${payslip.passcode}_${payslip.month}.pdf`);
}
