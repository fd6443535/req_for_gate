const express = require('express');
const { createHandler } = require('../controllers/proxyHandler');

const router = express.Router();

// Attendance
router.get('/api/getCheckinCheckoutHistory*', createHandler('getCheckinCheckoutHistory', 'GET'));
router.get('/api/getCheckinCheckoutTime*', createHandler('getCheckinCheckoutTime', 'GET'));

// Profile
router.get('/api/getProfile*', createHandler('getProfile', 'GET'));
router.get('/api/getPhoto*', createHandler('getPhoto', 'GET'));
router.get('/api/getProfileSummary*', createHandler('getProfileSummary', 'GET'));
router.get('/api/getEmployeeCompanies*', createHandler('getEmployeeCompanies', 'GET'));
router.get('/api/getCalendar*', createHandler('getCalendar', 'GET'));

// Request
router.get('/api/getRequestTransactions*', createHandler('getRequestTransactions', 'GET'));
router.get('/api/getDelegates*', createHandler('getDelegates', 'GET'));
router.get('/api/getRequestTimeline*', createHandler('getRequestTimeline', 'GET'));
router.get('/api/attachment*', createHandler('attachment', 'GET'));

// Leave
router.get('/api/getLeaveRequestTransactions*', createHandler('getLeaveRequestTransactions', 'GET'));
router.get('/api/getLeaveRequestDetails*', createHandler('getLeaveRequestDetails', 'GET'));
router.get('/api/getLeaveRequestTypes*', createHandler('getLeaveRequestTypes', 'GET'));
router.post('/api/submitLeaveRequest*', createHandler('submitLeaveRequest', 'POST'));
router.patch('/api/cancelLeaveRequest*', createHandler('cancelLeaveRequest', 'PATCH'));
router.patch('/api/editLeaveRequest*', createHandler('editLeaveRequest', 'PATCH'));
router.post('/api/draftSaveLeaveRequest*', createHandler('draftSaveLeaveRequest', 'POST'));
router.post('/api/submitLeaveRequestOnBehalf*', createHandler('submitLeaveRequestOnBehalf', 'POST'));
router.get('/api/getPendingLeaveRequests*', createHandler('getPendingLeaveRequests', 'GET'));
router.patch('/api/approveRejectLeaveRequest*', createHandler('approveRejectLeaveRequest', 'PATCH'));
router.patch('/api/changeLeaveRequestApproval*', createHandler('changeLeaveRequestApproval', 'PATCH'));
router.post('/api/delegateLeaveRequest*', createHandler('delegateLeaveRequest', 'POST'));

// Excuse
router.get('/api/getExcuseTransactions*', createHandler('getExcuseTransactions', 'GET'));
router.get('/api/getExcuseRequestDetails*', createHandler('getExcuseRequestDetails', 'GET'));
router.post('/api/submitExcuseRequest*', createHandler('submitExcuseRequest', 'POST'));
router.patch('/api/cancelExcuseRequest*', createHandler('cancelExcuseRequest', 'PATCH'));
router.patch('/api/editExcuseRequest*', createHandler('editExcuseRequest', 'PATCH'));
router.post('/api/draftSaveExcuseRequest*', createHandler('draftSaveExcuseRequest', 'POST'));
router.post('/api/submitExcuseRequestOnBehalf*', createHandler('submitExcuseRequestOnBehalf', 'POST'));
router.get('/api/getPendingExcuseRequests*', createHandler('getPendingExcuseRequests', 'GET'));
router.patch('/api/approveRejectExcuseRequest*', createHandler('approveRejectExcuseRequest', 'PATCH'));
router.patch('/api/changeExcuseApproval*', createHandler('changeExcuseApproval', 'PATCH'));
router.post('/api/delegateExcuseRequest*', createHandler('delegateExcuseRequest', 'POST'));

// Reimbursement
router.get('/api/getReimbursementTransactions*', createHandler('getReimbursementTransactions', 'GET'));
router.get('/api/getReimbursementRequestDetails*', createHandler('getReimbursementRequestDetails', 'GET'));
router.get('/api/getReimbursementRequestTypes*', createHandler('getReimbursementRequestTypes', 'GET'));
router.post('/api/submitReimbursementRequest*', createHandler('submitReimbursementRequest', 'POST'));
router.patch('/api/cancelReimbursementRequest*', createHandler('cancelReimbursementRequest', 'PATCH'));
router.patch('/api/editReimbursementRequest*', createHandler('editReimbursementRequest', 'PATCH'));
router.post('/api/draftSaveReimbursementRequest*', createHandler('draftSaveReimbursementRequest', 'POST'));
router.post('/api/submitReimbursementRequestOnBehalf*', createHandler('submitReimbursementRequestOnBehalf', 'POST'));
router.get('/api/getPendingReimbursementRequests*', createHandler('getPendingReimbursementRequests', 'GET'));
router.patch('/api/approveRejectReimbursementRequest*', createHandler('approveRejectReimbursementRequest', 'PATCH'));
router.patch('/api/changeReimbursementApproval*', createHandler('changeReimbursementApproval', 'PATCH'));
router.post('/api/delegateReimbursementRequest*', createHandler('delegateReimbursementRequest', 'POST'));

// Document
router.get('/api/getDocumentTransactions*', createHandler('getDocumentTransactions', 'GET'));
router.get('/api/getDocumentRequestDetails*', createHandler('getDocumentRequestDetails', 'GET'));
router.get('/api/getDocumentRequestTypes*', createHandler('getDocumentRequestTypes', 'GET'));
router.post('/api/submitDocumentRequest*', createHandler('submitDocumentRequest', 'POST'));
router.patch('/api/cancelDocumentRequest*', createHandler('cancelDocumentRequest', 'PATCH'));
router.patch('/api/editDocumentRequest*', createHandler('editDocumentRequest', 'PATCH'));
router.post('/api/draftSaveDocumentRequest*', createHandler('draftSaveDocumentRequest', 'POST'));
router.post('/api/submitDocumentRequestOnBehalf*', createHandler('submitDocumentRequestOnBehalf', 'POST'));
router.get('/api/getPendingDocumentRequests*', createHandler('getPendingDocumentRequests', 'GET'));
router.patch('/api/approveRejectDocumentRequest*', createHandler('approveRejectDocumentRequest', 'PATCH'));
router.patch('/api/changeDocumentApproval*', createHandler('changeDocumentApproval', 'PATCH'));
router.post('/api/delegateDocumentRequest*', createHandler('delegateDocumentRequest', 'POST'));

// BusinessTrip
router.get('/api/getBusinessTripTransactions*', createHandler('getBusinessTripTransactions', 'GET'));
router.get('/api/getBusinessTripRequestDetails*', createHandler('getBusinessTripRequestDetails', 'GET'));
router.post('/api/submitBusinessTripRequest*', createHandler('submitBusinessTripRequest', 'POST'));
router.patch('/api/cancelBusinessTripRequest*', createHandler('cancelBusinessTripRequest', 'PATCH'));
router.patch('/api/editBusinessTripRequest*', createHandler('editBusinessTripRequest', 'PATCH'));
router.post('/api/draftSaveBusinessTripRequest*', createHandler('draftSaveBusinessTripRequest', 'POST'));
router.post('/api/submitBusinessTripRequestOnBehalf*', createHandler('submitBusinessTripRequestOnBehalf', 'POST'));
router.get('/api/getPendingBusinessTripRequests*', createHandler('getPendingBusinessTripRequests', 'GET'));
router.patch('/api/approveRejectBusinessTripRequest*', createHandler('approveRejectBusinessTripRequest', 'PATCH'));
router.patch('/api/changeBusinessTripApproval*', createHandler('changeBusinessTripApproval', 'PATCH'));
router.post('/api/delegateBusinessTripRequest*', createHandler('delegateBusinessTripRequest', 'POST'));

// FlightTicket
router.get('/api/getFlightTicketTransactions*', createHandler('getFlightTicketTransactions', 'GET'));
router.get('/api/getFlightTicketRequestDetails*', createHandler('getFlightTicketRequestDetails', 'GET'));
router.post('/api/submitFlightTicketRequest*', createHandler('submitFlightTicketRequest', 'POST'));
router.patch('/api/cancelFlightTicketRequest*', createHandler('cancelFlightTicketRequest', 'PATCH'));
router.patch('/api/editFlightTicketRequest*', createHandler('editFlightTicketRequest', 'PATCH'));
router.post('/api/draftSaveFlightTicketRequest*', createHandler('draftSaveFlightTicketRequest', 'POST'));
router.post('/api/submitFlightTicketRequestOnBehalf*', createHandler('submitFlightTicketRequestOnBehalf', 'POST'));
router.get('/api/getPendingFlightTicketRequests*', createHandler('getPendingFlightTicketRequests', 'GET'));
router.patch('/api/approveRejectFlightTicketRequest*', createHandler('approveRejectFlightTicketRequest', 'PATCH'));
router.patch('/api/changeFlightTicketApproval*', createHandler('changeFlightTicketApproval', 'PATCH'));
router.post('/api/delegateFlightTicketRequest*', createHandler('delegateFlightTicketRequest', 'POST'));

// Team
router.get('/api/getTeamHierarchy*', createHandler('getTeamHierarchy', 'GET'));
router.get('/api/getTeamCalendar*', createHandler('getTeamCalendar', 'GET'));

// Notification
//router.get('/api/getNotifications*', createHandler('getNotifications', 'GET'));

module.exports = router;
