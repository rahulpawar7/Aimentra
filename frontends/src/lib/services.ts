import api from './api';

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function getAdminDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data.data;
}

export async function getAdminUsers(params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) {
  const { data } = await api.get('/admin/users', { params });
  return data.data;
}

export async function updateAdminUser(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/admin/users/${id}`, body);
  return data.data;
}

export async function suspendUser(id: string) {
  const { data } = await api.post(`/admin/users/${id}/suspend`);
  return data.data;
}

export async function activateUser(id: string) {
  const { data } = await api.post(`/admin/users/${id}/activate`);
  return data.data;
}

export async function grantUserAccess(userId: string, body: { planId: string; validUntil?: string }) {
  const { data } = await api.post(`/admin/users/${userId}/grant`, body);
  return data.data;
}

export async function revokeUserAccess(userId: string, entitlementId: string) {
  const { data } = await api.post(`/admin/users/${userId}/revoke/${entitlementId}`);
  return data.data;
}

export async function getAdminPlans() {
  const { data } = await api.get('/admin/plans');
  return data.data as Plan[];
}

export async function createPlan(body: Partial<Plan>) {
  const { data } = await api.post('/admin/plans', body);
  return data.data;
}

export async function updatePlan(id: string, body: Partial<Plan>) {
  const { data } = await api.patch(`/admin/plans/${id}`, body);
  return data.data;
}

export async function togglePlan(id: string) {
  const { data } = await api.post(`/admin/plans/${id}/toggle`);
  return data.data;
}

export async function getAdminOrders(params?: { page?: number; limit?: number; status?: string }) {
  const { data } = await api.get('/admin/orders', { params });
  return data.data;
}

export async function refundOrder(id: string) {
  const { data } = await api.post(`/admin/orders/${id}/refund`);
  return data.data;
}

export async function getAdminCoupons() {
  const { data } = await api.get('/admin/coupons');
  return data.data;
}

export async function createCoupon(body: Record<string, unknown>) {
  const { data } = await api.post('/admin/coupons', body);
  return data.data;
}

export async function deleteCoupon(id: string) {
  const { data } = await api.delete(`/admin/coupons/${id}`);
  return data.data;
}

export async function updateCoupon(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/admin/coupons/${id}`, body);
  return data.data;
}

export async function getAdminAnalytics() {
  const { data } = await api.get('/admin/analytics');
  return data.data;
}

export async function getAuditLog(params?: { page?: number; limit?: number }) {
  const { data } = await api.get('/admin/audit-log', { params });
  return data.data;
}

// ─── User Dashboard ──────────────────────────────────────────────────────────

export async function getProgressSummary() {
  const { data } = await api.get('/progress/summary');
  return data.data;
}

export async function getContinueLearning() {
  const { data } = await api.get('/progress/continue-learning');
  return data.data;
}

export async function getRecentActivity() {
  const { data } = await api.get('/progress/activity');
  return data.data;
}

export async function getMyCourses() {
  const { data } = await api.get('/progress/my-courses');
  return data.data;
}

export async function getMyOrders(params?: { page?: number; limit?: number }) {
  const { data } = await api.get('/orders', { params });
  return data.data;
}

export async function getMyCertificates() {
  const { data } = await api.get('/certificates/my');
  return data.data;
}

export async function getMyEntitlements() {
  const { data } = await api.get('/entitlements/my');
  return data.data;
}

export async function getPlans() {
  const { data } = await api.get('/plans');
  return data.data as Plan[];
}

export async function getUserProfile() {
  const { data } = await api.get('/users/profile');
  return data.data;
}

export async function updateUserProfile(body: Record<string, unknown>) {
  const { data } = await api.put('/users/profile', body);
  return data.data;
}

export async function getUserSubscription() {
  const { data } = await api.get('/users/subscription');
  return data.data;
}

export async function getNotifications() {
  const { data } = await api.get('/notifications');
  return data.data;
}

export async function markNotificationRead(id: string) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch('/notifications/read-all');
  return data.data;
}

export async function getSupportTickets() {
  const { data } = await api.get('/support');
  return data.data;
}

export async function getSupportTicket(id: string) {
  const { data } = await api.get(`/support/${id}`);
  return data.data;
}

export async function createSupportTicket(body: { subject: string; category: string; content: string; priority?: string }) {
  const { data } = await api.post('/support', body);
  return data.data;
}

export async function replySupportTicket(id: string, content: string) {
  const { data } = await api.post(`/support/${id}/reply`, { content });
  return data.data;
}

// ─── Public ──────────────────────────────────────────────────────────────────

export async function getBlogPosts(params?: { page?: number; limit?: number }) {
  const { data } = await api.get('/blog', { params });
  return data.data;
}

export async function getEvents(params?: { upcoming?: boolean }) {
  const { data } = await api.get('/events', { params: { ...params, upcoming: params?.upcoming ? 'true' : undefined } });
  return data.data;
}

export async function registerForEvent(eventId: string) {
  const { data } = await api.post(`/events/${eventId}/register`);
  return data.data;
}

export async function downloadCertificate(id: string) {
  const { data } = await api.get(`/certificates/${id}/download`);
  return data.data;
}

export async function getTestimonials(featured?: boolean) {
  const { data } = await api.get('/testimonials', { params: featured ? { featured: 'true' } : {} });
  return data.data;
}

export async function submitContactForm(body: { name: string; email: string; message: string; phone?: string }) {
  const { data } = await api.post('/contact', body);
  return data;
}

export async function verifyCertificate(number: string) {
  const { data } = await api.get(`/certificates/verify/${number}`);
  return data.data;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type Plan = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  badge?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  billingType: string;
  lifetime: boolean;
  status: string;
  featured: boolean;
  sortOrder: number;
  features: string[];
  highlights: string[];
  durationDays?: number;
};

export type Order = {
  _id: string;
  userId: { _id: string; name: string; email: string } | string;
  planId?: { _id: string; name: string; price: number } | null;
  totalAmount: number;
  currency: string;
  status: string;
  invoiceNumber?: string;
  createdAt: string;
};

export type UserRecord = {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  createdAt: string;
  avatar?: string;
};

export type Entitlement = {
  _id: string;
  planId: Plan;
  status: string;
  expiryDate?: string;
  lifetime: boolean;
  features: string[];
  startDate: string;
};

export type Certificate = {
  _id: string;
  certificateNumber: string;
  courseName: string;
  courseId?: { title: string; slug: string; thumbnail?: string };
  issuedAt: string;
  verificationUrl?: string;
  studentName: string;
};

export type Notification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
};

export type SupportTicket = {
  _id: string;
  ticketId: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  messages: Array<{
    sender: { _id: string; name: string; role?: string } | string;
    role: string;
    content: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type BlogPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  category: string;
  publishedAt?: string;
  readTime: number;
  authorName: string;
};

export type Event = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  endDate: string;
  timezone: string;
  venue?: string;
  isOnline: boolean;
  meetingUrl?: string;
  capacity?: number;
  registeredCount: number;
  status: string;
  price: number;
};
