import { defineStore } from "pinia";

export const useEmployeeStore = defineStore("employee", {
  state: () => ({
    employees: [],
    leaveRequests: [],
    payrollRecords: [],
    nextId: 16,
    nextLeaveId: 1,
    nextPayrollId: 1,
  }),

  getters: {
    getEmployeeById: (state) => (id) => {
      return state.employees.find((e) => e.id === id);
    },
    getPayrollByEmployee: (state) => (employeeId) => {
      return state.payrollRecords.filter((p) => p.employeeId === employeeId);
    },
  },

  actions: {
    loadDummyData() {
      const savedEmployees = localStorage.getItem("employees");
      const savedRequests = localStorage.getItem("leaveRequests");
      const savedPayroll = localStorage.getItem("payrollRecords");

      if (savedEmployees) {
        this.employees = JSON.parse(savedEmployees);
        this.nextId = Math.max(...this.employees.map((e) => e.id), 15) + 1;
      } else {
        this.employees = [
          {
            id: 1,
            name: "John Smith",
            email: "john.smith@moderntech.com",
            position: "Software Engineer",
            department: "IT",
            leaveBalance: 21,
            salary: 75000,
          },
          {
            id: 2,
            name: "Sarah Johnson",
            email: "sarah.j@moderntech.com",
            position: "HR Manager",
            department: "HR",
            leaveBalance: 25,
            salary: 68000,
          },
          {
            id: 3,
            name: "Mike Chen",
            email: "mike.chen@moderntech.com",
            position: "Sales Rep",
            department: "Sales",
            leaveBalance: 18,
            salary: 55000,
          },
          {
            id: 4,
            name: "Emily Davis",
            email: "emily.d@moderntech.com",
            position: "Marketing Lead",
            department: "Marketing",
            leaveBalance: 20,
            salary: 62000,
          },
          {
            id: 5,
            name: "David Wilson",
            email: "david.w@moderntech.com",
            position: "DevOps Engineer",
            department: "IT",
            leaveBalance: 22,
            salary: 82000,
          },
          {
            id: 6,
            name: "Lisa Brown",
            email: "lisa.b@moderntech.com",
            position: "Accountant",
            department: "Finance",
            leaveBalance: 19,
            salary: 58000,
          },
          {
            id: 7,
            name: "Tom Anderson",
            email: "tom.a@moderntech.com",
            position: "Product Manager",
            department: "Product",
            leaveBalance: 24,
            salary: 90000,
          },
          {
            id: 8,
            name: "Rachel Green",
            email: "rachel.g@moderntech.com",
            position: "UX Designer",
            department: "Design",
            leaveBalance: 21,
            salary: 70000,
          },
          {
            id: 9,
            name: "James Taylor",
            email: "james.t@moderntech.com",
            position: "QA Engineer",
            department: "IT",
            leaveBalance: 20,
            salary: 65000,
          },
          {
            id: 10,
            name: "Anna White",
            email: "anna.w@moderntech.com",
            position: "Recruiter",
            department: "HR",
            leaveBalance: 18,
            salary: 52000,
          },
          {
            id: 11,
            name: "Chris Lee",
            email: "chris.l@moderntech.com",
            position: "Data Analyst",
            department: "Analytics",
            leaveBalance: 23,
            salary: 68000,
          },
          {
            id: 12,
            name: "Maria Garcia",
            email: "maria.g@moderntech.com",
            position: "Sales Manager",
            department: "Sales",
            leaveBalance: 25,
            salary: 78000,
          },
          {
            id: 13,
            name: "Kevin Moore",
            email: "kevin.m@moderntech.com",
            position: "Backend Dev",
            department: "IT",
            leaveBalance: 22,
            salary: 76000,
          },
          {
            id: 14,
            name: "Jessica Hall",
            email: "jessica.h@moderntech.com",
            position: "Content Writer",
            department: "Marketing",
            leaveBalance: 19,
            salary: 48000,
          },
          {
            id: 15,
            name: "Ryan Clark",
            email: "ryan.c@moderntech.com",
            position: "Support Lead",
            department: "Support",
            leaveBalance: 20,
            salary: 55000,
          },
        ];
      }

      if (savedRequests) {
        this.leaveRequests = JSON.parse(savedRequests);
        this.nextLeaveId =
          Math.max(...this.leaveRequests.map((r) => r.id), 0) + 1;
      }

      if (savedPayroll) {
        this.payrollRecords = JSON.parse(savedPayroll);
        this.nextPayrollId =
          Math.max(...this.payrollRecords.map((p) => p.id), 0) + 1;
      }

      this.saveToLocal();
    },

    saveToLocal() {
      localStorage.setItem("employees", JSON.stringify(this.employees));
      localStorage.setItem("leaveRequests", JSON.stringify(this.leaveRequests));
      localStorage.setItem(
        "payrollRecords",
        JSON.stringify(this.payrollRecords),
      );
    },

    addEmployee(employee) {
      employee.id = this.nextId++;
      if (!employee.salary) employee.salary = 50000;
      this.employees.push(employee);
      this.saveToLocal();
    },

    updateEmployee(updatedEmployee) {
      const index = this.employees.findIndex(
        (e) => e.id === updatedEmployee.id,
      );
      if (index !== -1) {
        this.employees[index] = updatedEmployee;
        this.saveToLocal();
      }
    },

    deleteEmployee(id) {
      this.employees = this.employees.filter((e) => e.id !== id);
      this.leaveRequests = this.leaveRequests.filter(
        (r) => r.employeeId !== id,
      );
      this.payrollRecords = this.payrollRecords.filter(
        (p) => p.employeeId !== id,
      );
      this.saveToLocal();
    },

    requestLeave(employeeId, startDate, endDate, days, reason) {
      const employee = this.getEmployeeById(employeeId);
      if (!employee) return { success: false, message: "Employee not found" };
      if (employee.leaveBalance < days)
        return { success: false, message: "Insufficient leave balance" };

      this.leaveRequests.push({
        id: this.nextLeaveId++,
        employeeId,
        employeeName: employee.name,
        startDate,
        endDate,
        days,
        reason,
        status: "Pending",
        requestDate: new Date().toISOString().split("T")[0],
      });
      this.saveToLocal();
      return { success: true, message: "Leave requested" };
    },

    approveLeave(requestId) {
      const request = this.leaveRequests.find((r) => r.id === requestId);
      if (!request || request.status !== "Pending") return;
      const employee = this.getEmployeeById(request.employeeId);
      if (employee && employee.leaveBalance >= request.days) {
        employee.leaveBalance -= request.days;
        request.status = "Approved";
        this.saveToLocal();
      }
    },

    rejectLeave(requestId) {
      const request = this.leaveRequests.find((r) => r.id === requestId);
      if (request && request.status === "Pending") {
        request.status = "Rejected";
        this.saveToLocal();
      }
    },

    generatePayroll(employeeId, month, year) {
      const employee = this.getEmployeeById(employeeId);
      if (!employee) return { success: false, message: "Employee not found" };

      const exists = this.payrollRecords.find(
        (p) =>
          p.employeeId === employeeId && p.month === month && p.year === year,
      );
      if (exists)
        return {
          success: false,
          message: "Payroll already exists for this period",
        };

      const baseSalary = employee.salary / 12;
      const tax = baseSalary * 0.22;
      const insurance = 250;
      const unpaidLeave = 0; // Calculate if you track unpaid leave
      const netPay = baseSalary - tax - insurance - unpaidLeave;

      const record = {
        id: this.nextPayrollId++,
        employeeId,
        employeeName: employee.name,
        month,
        year,
        baseSalary: parseFloat(baseSalary.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        insurance,
        unpaidLeaveDeduction: unpaidLeave,
        netPay: parseFloat(netPay.toFixed(2)),
        generatedDate: new Date().toISOString().split("T")[0],
      };

      this.payrollRecords.push(record);
      this.saveToLocal();
      return { success: true, message: "Payroll generated", data: record };
    },
  },
});
