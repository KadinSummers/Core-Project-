<script setup>
import { ref, onMounted, computed } from "vue";
import { useEmployeeStore } from "../stores/employeeStore";

const store = useEmployeeStore();
const activeTab = ref("employees");
const showEmployeeForm = ref(false);
const showLeaveForm = ref(false);
const showPayrollModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const searchQuery = ref("");
const filterDept = ref("");
const sortBy = ref("name");

const form = ref({
  name: "",
  email: "",
  position: "",
  department: "",
  leaveBalance: 21,
  salary: 50000,
});

const leaveForm = ref({
  employeeId: "",
  startDate: "",
  endDate: "",
  days: 1,
  reason: "",
});

const payrollForm = ref({
  employeeId: "",
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
});

const errors = ref({});
const leaveErrors = ref({});
const selectedPayslip = ref(null);

const departments = [
  "IT",
  "HR",
  "Sales",
  "Marketing",
  "Finance",
  "Product",
  "Design",
  "Analytics",
  "Support",
];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const filteredEmployees = computed(() => {
  let result = store.employees;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q),
    );
  }
  if (filterDept.value) {
    result = result.filter((e) => e.department === filterDept.value);
  }
  return result.sort((a, b) => {
    if (sortBy.value === "leaveBalance") return b.leaveBalance - a.leaveBalance;
    if (sortBy.value === "salary") return b.salary - a.salary;
    if (sortBy.value === "department")
      return a.department.localeCompare(b.department);
    return a.name.localeCompare(b.name);
  });
});

const pendingRequests = computed(() =>
  store.leaveRequests.filter((r) => r.status === "Pending"),
);

const validate = () => {
  errors.value = {};
  if (!form.value.name.trim()) errors.value.name = "Name required";
  if (!form.value.email.trim()) errors.value.email = "Email required";
  else if (!/^\S+@\S+\.\S+$/.test(form.value.email))
    errors.value.email = "Invalid email";
  if (!form.value.position.trim()) errors.value.position = "Position required";
  if (!form.value.department) errors.value.department = "Department required";
  if (form.value.leaveBalance < 0 || form.value.leaveBalance > 30)
    errors.value.leaveBalance = "Leave must be 0-30";
  if (form.value.salary < 0) errors.value.salary = "Salary must be positive";
  return Object.keys(errors.value).length === 0;
};

const validateLeave = () => {
  leaveErrors.value = {};
  if (!leaveForm.value.employeeId)
    leaveErrors.value.employeeId = "Select employee";
  if (!leaveForm.value.startDate)
    leaveErrors.value.startDate = "Start date required";
  if (!leaveForm.value.endDate) leaveErrors.value.endDate = "End date required";
  if (leaveForm.value.days < 1) leaveErrors.value.days = "Min 1 day";
  if (!leaveForm.value.reason.trim())
    leaveErrors.value.reason = "Reason required";
  if (leaveForm.value.startDate && leaveForm.value.endDate) {
    if (
      new Date(leaveForm.value.endDate) < new Date(leaveForm.value.startDate)
    ) {
      leaveErrors.value.endDate = "End date must be after start date";
    }
  }
  return Object.keys(leaveErrors.value).length === 0;
};

const resetForm = () => {
  form.value = {
    name: "",
    email: "",
    position: "",
    department: "",
    leaveBalance: 21,
    salary: 50000,
  };
  errors.value = {};
  isEditing.value = false;
  editingId.value = null;
};

const resetLeaveForm = () => {
  leaveForm.value = {
    employeeId: "",
    startDate: "",
    endDate: "",
    days: 1,
    reason: "",
  };
  leaveErrors.value = {};
};

const openAddForm = () => {
  resetForm();
  showEmployeeForm.value = true;
};

const submitForm = () => {
  if (!validate()) return;
  if (isEditing.value) {
    store.updateEmployee({ ...form.value, id: editingId.value });
  } else {
    store.addEmployee({ ...form.value });
  }
  showEmployeeForm.value = false;
  resetForm();
};

const editEmployee = (emp) => {
  form.value = { ...emp };
  editingId.value = emp.id;
  isEditing.value = true;
  showEmployeeForm.value = true;
};

const removeEmployee = (id) => {
  if (
    confirm(
      "Delete this employee? This will also delete their leave requests and payroll.",
    )
  ) {
    store.deleteEmployee(id);
  }
};

const submitLeaveRequest = () => {
  if (!validateLeave()) return;
  const result = store.requestLeave(
    parseInt(leaveForm.value.employeeId),
    leaveForm.value.startDate,
    leaveForm.value.endDate,
    leaveForm.value.days,
    leaveForm.value.reason,
  );
  if (result.success) {
    alert("Leave request submitted!");
    showLeaveForm.value = false;
    resetLeaveForm();
  } else {
    alert(result.message);
  }
};

const generatePayslip = () => {
  const result = store.generatePayroll(
    parseInt(payrollForm.value.employeeId),
    payrollForm.value.month,
    payrollForm.value.year,
  );
  if (result.success) {
    alert("Payroll generated!");
    selectedPayslip.value = result.data;
  } else {
    alert(result.message);
  }
};

onMounted(() => {
  store.loadDummyData();
});
</script>

<template>
  <div class="container mt-4">
    <h1 class="mb-4">ModernTech HR Dashboard</h1>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'employees' }"
          @click="activeTab = 'employees'"
          href="#"
          >Employees</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'payroll' }"
          @click="activeTab = 'payroll'"
          href="#"
          >Payroll</a
        >
      </li>
    </ul>

    <!-- Employees Tab -->
    <div v-if="activeTab === 'employees'">
      <div class="mb-3">
        <button @click="openAddForm" class="btn btn-primary me-2">
          + Add Employee
        </button>
        <button @click="showLeaveForm = !showLeaveForm" class="btn btn-success">
          {{ showLeaveForm ? "Hide" : "Request Leave" }}
        </button>
      </div>

      <!-- Leave Request Form -->
      <div v-if="showLeaveForm" class="card mb-4">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0">Request Leave</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Employee *</label>
              <select
                v-model="leaveForm.employeeId"
                class="form-select"
                :class="{ 'is-invalid': leaveErrors.employeeId }"
              >
                <option value="">Select employee...</option>
                <option
                  v-for="emp in store.employees"
                  :key="emp.id"
                  :value="emp.id"
                >
                  {{ emp.name }} ({{ emp.leaveBalance }} days left)
                </option>
              </select>
              <div v-if="leaveErrors.employeeId" class="invalid-feedback">
                {{ leaveErrors.employeeId }}
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <label class="form-label">Start Date *</label>
              <input
                v-model="leaveForm.startDate"
                type="date"
                class="form-control"
                :class="{ 'is-invalid': leaveErrors.startDate }"
              />
              <div v-if="leaveErrors.startDate" class="invalid-feedback">
                {{ leaveErrors.startDate }}
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <label class="form-label">End Date *</label>
              <input
                v-model="leaveForm.endDate"
                type="date"
                class="form-control"
                :class="{ 'is-invalid': leaveErrors.endDate }"
              />
              <div v-if="leaveErrors.endDate" class="invalid-feedback">
                {{ leaveErrors.endDate }}
              </div>
            </div>
            <div class="col-md-2 mb-3">
              <label class="form-label">Days *</label>
              <input
                v-model.number="leaveForm.days"
                type="number"
                min="1"
                class="form-control"
                :class="{ 'is-invalid': leaveErrors.days }"
              />
              <div v-if="leaveErrors.days" class="invalid-feedback">
                {{ leaveErrors.days }}
              </div>
            </div>
            <div class="col-md-10 mb-3">
              <label class="form-label">Reason *</label>
              <input
                v-model="leaveForm.reason"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': leaveErrors.reason }"
              />
              <div v-if="leaveErrors.reason" class="invalid-feedback">
                {{ leaveErrors.reason }}
              </div>
            </div>
          </div>
          <button @click="submitLeaveRequest" class="btn btn-success me-2">
            Submit Request
          </button>
          <button
            @click="
              showLeaveForm = false;
              resetLeaveForm();
            "
            class="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Add/Edit Employee Form -->
      <div v-if="showEmployeeForm" class="card mb-4">
        <div class="card-header bg-info text-white">
          <h5 class="mb-0">
            {{ isEditing ? "Edit Employee" : "Add New Employee" }}
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Name *</label>
              <input
                v-model="form.name"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': errors.name }"
              />
              <div v-if="errors.name" class="invalid-feedback">
                {{ errors.name }}
              </div>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Email *</label>
              <input
                v-model="form.email"
                type="email"
                class="form-control"
                :class="{ 'is-invalid': errors.email }"
              />
              <div v-if="errors.email" class="invalid-feedback">
                {{ errors.email }}
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <label class="form-label">Position *</label>
              <input
                v-model="form.position"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': errors.position }"
              />
              <div v-if="errors.position" class="invalid-feedback">
                {{ errors.position }}
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <label class="form-label">Department *</label>
              <select
                v-model="form.department"
                class="form-select"
                :class="{ 'is-invalid': errors.department }"
              >
                <option value="">Select...</option>
                <option v-for="dept in departments" :key="dept" :value="dept">
                  {{ dept }}
                </option>
              </select>
              <div v-if="errors.department" class="invalid-feedback">
                {{ errors.department }}
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <label class="form-label">Leave Balance *</label>
              <input
                v-model.number="form.leaveBalance"
                type="number"
                min="0"
                max="30"
                class="form-control"
                :class="{ 'is-invalid': errors.leaveBalance }"
              />
              <div v-if="errors.leaveBalance" class="invalid-feedback">
                {{ errors.leaveBalance }}
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <label class="form-label">Annual Salary *</label>
              <input
                v-model.number="form.salary"
                type="number"
                min="0"
                class="form-control"
                :class="{ 'is-invalid': errors.salary }"
              />
              <div v-if="errors.salary" class="invalid-feedback">
                {{ errors.salary }}
              </div>
            </div>
          </div>
          <button @click="submitForm" class="btn btn-success me-2">
            {{ isEditing ? "Update" : "Add" }} Employee
          </button>
          <button
            @click="
              showEmployeeForm = false;
              resetForm();
            "
            class="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Pending Leave Requests -->
      <div v-if="pendingRequests.length > 0" class="card mb-4">
        <div class="card-header bg-warning">
          <h5 class="mb-0">
            Pending Leave Requests ({{ pendingRequests.length }})
          </h5>
        </div>
        <div class="card-body">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="req in pendingRequests" :key="req.id">
                <td>{{ req.employeeName }}</td>
                <td>{{ req.startDate }} to {{ req.endDate }}</td>
                <td>{{ req.days }}</td>
                <td>{{ req.reason }}</td>
                <td>
                  <button
                    @click="store.approveLeave(req.id)"
                    class="btn btn-sm btn-success me-1"
                  >
                    Approve
                  </button>
                  <button
                    @click="store.rejectLeave(req.id)"
                    class="btn btn-sm btn-danger"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="row">
            <div class="col-md-4">
              <input
                v-model="searchQuery"
                type="text"
                class="form-control"
                placeholder="Search name, email, position..."
              />
            </div>
            <div class="col-md-3">
              <select v-model="filterDept" class="form-select">
                <option value="">All Departments</option>
                <option v-for="dept in departments" :key="dept" :value="dept">
                  {{ dept }}
                </option>
              </select>
            </div>
            <div class="col-md-3">
              <select v-model="sortBy" class="form-select">
                <option value="name">Sort by Name</option>
                <option value="department">Sort by Department</option>
                <option value="leaveBalance">Sort by Leave Balance</option>
                <option value="salary">Sort by Salary</option>
              </select>
            </div>
            <div class="col-md-2">
              <span class="badge bg-primary fs-6"
                >{{ filteredEmployees.length }} employees</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Employee Table -->
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Employee Leave Management</h5>
        </div>
        <div class="card-body">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Department</th>
                <th>Leave</th>
                <th>Salary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in filteredEmployees" :key="emp.id">
                <td>
                  <strong>{{ emp.name }}</strong
                  ><br /><small class="text-muted">{{ emp.email }}</small>
                </td>
                <td>{{ emp.position }}</td>
                <td>
                  <span class="badge bg-secondary">{{ emp.department }}</span>
                </td>
                <td>
                  <span
                    class="badge"
                    :class="emp.leaveBalance < 5 ? 'bg-danger' : 'bg-success'"
                    >{{ emp.leaveBalance }} days</span
                  >
                </td>
                <td>${{ (emp.salary || 0).toLocaleString() }}</td>
                <td>
                  <button
                    @click="editEmployee(emp)"
                    class="btn btn-sm btn-warning me-2"
                  >
                    Edit
                  </button>
                  <button
                    @click="removeEmployee(emp.id)"
                    class="btn btn-sm btn-danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p
            v-if="filteredEmployees.length === 0"
            class="text-center text-muted mt-3"
          >
            No employees found.
          </p>
        </div>
      </div>
    </div>

    <!-- Payroll Tab -->
    <div v-if="activeTab === 'payroll'">
      <div class="card mb-4">
        <div class="card-header bg-dark text-white">
          <h5 class="mb-0">Generate Payroll</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-4">
              <label class="form-label">Employee</label>
              <select v-model="payrollForm.employeeId" class="form-select">
                <option value="">Select employee...</option>
                <option
                  v-for="emp in store.employees"
                  :key="emp.id"
                  :value="emp.id"
                >
                  {{ emp.name }}
                </option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Month</label>
              <select v-model="payrollForm.month" class="form-select">
                <option v-for="(month, i) in months" :key="i" :value="i + 1">
                  {{ month }}
                </option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Year</label>
              <input
                v-model.number="payrollForm.year"
                type="number"
                class="form-control"
              />
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button @click="generatePayslip" class="btn btn-primary w-100">
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Payslip Display -->
      <div v-if="selectedPayslip" class="card mb-4">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0">Payslip: {{ selectedPayslip.employeeName }}</h5>
        </div>
        <div class="card-body">
          <p>
            <strong>Period:</strong> {{ months[selectedPayslip.month - 1] }}
            {{ selectedPayslip.year }}
          </p>
          <table class="table">
            <tr>
              <td>Base Salary (Monthly)</td>
              <td class="text-end">${{ selectedPayslip.baseSalary }}</td>
            </tr>
            <tr>
              <td>Tax Deduction (22%)</td>
              <td class="text-end text-danger">-${{ selectedPayslip.tax }}</td>
            </tr>
            <tr>
              <td>Insurance</td>
              <td class="text-end text-danger">
                -${{ selectedPayslip.insurance }}
              </td>
            </tr>
            <tr>
              <td>Unpaid Leave</td>
              <td class="text-end text-danger">
                -${{ selectedPayslip.unpaidLeaveDeduction }}
              </td>
            </tr>
            <tr class="table-active">
              <td><strong>Net Pay</strong></td>
              <td class="text-end">
                <strong>${{ selectedPayslip.netPay }}</strong>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Payroll History -->
      <div class="card">
        <div class="card-header bg-secondary text-white">
          <h5 class="mb-0">Payroll History</h5>
        </div>
        <div class="card-body">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Base</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Generated</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="pay in store.payrollRecords.slice().reverse()"
                :key="pay.id"
              >
                <td>{{ pay.employeeName }}</td>
                <td>{{ months[pay.month - 1] }} {{ pay.year }}</td>
                <td>${{ pay.baseSalary }}</td>
                <td>
                  ${{
                    (
                      pay.tax +
                      pay.insurance +
                      pay.unpaidLeaveDeduction
                    ).toFixed(2)
                  }}
                </td>
                <td>
                  <strong>${{ pay.netPay }}</strong>
                </td>
                <td>{{ pay.generatedDate }}</td>
              </tr>
            </tbody>
          </table>
          <p
            v-if="store.payrollRecords.length === 0"
            class="text-center text-muted"
          >
            No payroll generated yet.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nav-link {
  cursor: pointer;
}
</style>
