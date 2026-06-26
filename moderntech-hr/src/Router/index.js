import { createRouter, createWebHistory } from "vue-router";
import LeaveManagement from "../components/LeaveManagement.vue";

const routes = [{ path: "/", component: LeaveManagement }];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
