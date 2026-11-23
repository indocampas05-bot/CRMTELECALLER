// src/pages/Agreements/agreementDocs.js
// Default (original-PDF) content for the 5 agreement categories + the
// doc -> XHTML generator used for the PDF / Super Admin view.
// A "doc" is plain JSON: every text in it is editable in AgreementDocumentEditor.

export const CATEGORIES = [
  { key: 'dm',      label: 'Digital Marketing',  sub: 'Admission platform + Digital Marketing', agreementType: 'DIGITAL_MARKETING' },
  { key: 'admin',   label: 'Admin Dashboard',    sub: 'Admission Dashboard – Rs.8,000 + GST',   agreementType: 'DIGITAL_MARKETING' },
  { key: 'pro',     label: 'Pro',                sub: 'ERP Pro plan & Admin Dashboard',         agreementType: 'ERP' },
  { key: 'proplus', label: 'Pro Plus',           sub: 'ERP Pro Plus plan',                      agreementType: 'ERP' },
  { key: 'promax',  label: 'Pro Max',            sub: 'ERP Pro Max plan',                       agreementType: 'ERP' },
];
export const categoryOf = (key) => CATEGORIES.find((c) => c.key === key);

// ── block helpers ───────────────────────────────────────────────────────────
const H  = (text) => ({ t: 'h1', text });
const S  = (text) => ({ t: 'h2', text });
const P  = (text) => ({ t: 'p', text });
const L  = (...items) => ({ t: 'ul', items });
const TB = (rows, head = true) => ({ t: 'table', head, rows });

const today = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

const PROVIDER_ERP = 'INDOCAMPAS TECH PRIVATE LIMITED, a company incorporated under the Companies Act, 2013, having its Branch office at TIDEL NEO - Thiruchitrambalam-Koot Road, Tamil Nadu 605111. Hereinafter referred to as the “Service Provider” (which expression shall, unless repugnant to the context, mean and include its successors, assigns, and representatives)';
const PROVIDER_SHORT = 'INDOCAMPAS TECH PRIVATE LIMITED\nA company registered under the Companies Act, 2013, having its branch office at TIDEL NEO – Thiruchitrambalam Koot Road, Tamil Nadu 605111, hereinafter referred to as the “Service Provider / IndoCampas”, which expression shall include its successors and assigns.';
const CLIENT_ERP_TAIL = 'hereinafter referred to as the “Educational Institution” (which expression shall, unless repugnant to the context, mean and include its administrators, representatives and assigns).';

// ── shared ERP clauses (identical in Pro / Pro Plus / Pro Max PDFs) ────────
const erpPurpose = (plan) => [
  H('1. PURPOSE OF THE AGREEMENT'),
  P('The Service Provider agrees to provide, and the Client educational institutes agrees to use, a cloud-based educational institutes management web dashboard and mobile application (“Services”) developed and maintained by Indocampas Tech Pvt. Ltd., for educational institutes management and communication purposes.'),
  P('The following terms and conditions constitute a permit agreement (“Terms and Conditions” or “Permit Agreement “or “Terms of Use”) between you (“You” or “Your” or “User” or “Permittee “) and Provider. By clicking the ‘Accept’ or similar options and registering and subscribing to the Software as a Service SAAS Product, the Permittee agrees to this Permit Agreement along with the Subscription Agreement. The Permit Agreement shall be read along with the Additional Documents and in case of any inconsistency, the terms and conditions of the Permit Agreement shall prevail.'),
  ...(plan ? [S('1.1 CHOOSE PLAN'), P(`Thank you for your update. This is to confirm that you have selected the ${plan}.`), P(`Your account will now enjoy all the features and benefits included in the ${plan}.`)] : []),
];

const framework = (extraRoles) => [
  S('I. Overview'), S('A. Framework'),
  L('Only Indocampas provides digital framework for self-management all private educational institutes other than Syllabus through this application.',
    'The framework includes modules for student management, academic planning and performance tracking and parents’ response and education-oriented activity.',
    'Indocampas tech Pvt Ltd Company has developed SAAS Product for private educational institutes in four categories listed below.'),
  L(...extraRoles),
];

const customization = [
  S('H. Customization'),
  P('This INDOCAMPAS tech application cannot be customized individually. Earlier, INDOCAMPAS tech application is divided into three categories for educational institutions. 1. PRO, 2. PRO plus 3. PRO max.'),
];

const erpScope = [
  H('2. SCOPE OF SERVICES'),
  P('The Services provided by the Provider through its Play store or app store or Website are (“Services” or “SAAS Product “).'),
  L('The Provider has developed a cloud-based platform, which it makes available to Permittee. The platform is used for maintaining the record and facilitating all the processes of the Institutions, from the admission of new students to graduation and thereafter. The platform is further used to manage classroom and examination timetables, attendance, examination details, examination Result, hostel information and details, lunch menu information and details, library information and functioning details, transportation arranged by the Institution, events organized by Institution and other Institutional activities, Students fees information and details, Students fees collection and pending information, Students fee loan reference information and details and details and processes and any other services provided by Provider from time to time. The platform provides an option to the Institutions and parents of the students to stay updated with regular updates regarding the examination, attendance etc. by SMS and other modes adopted by the Provider from time to time.'),
  P('The Services provided shall include:'),
  S('I. Student Information Management'),
  L('Student profile management', 'Admission and enrollment management', 'Students tracking', 'Student performance monitoring'),
  S('II. Academic Management'),
  L('Class and section management', 'Subject and syllabus management', 'Exam, fees and assessment management', 'Grade and report card management'),
  S('III. Teacher and Staff Management'),
  L('Teacher and staff profile management', 'Class and subject assignment management', 'Attendance and leave management', 'Role-based access for administrators, teachers, students and parents.', 'Creation and management of sub-profiles (staff assistants, guardians, etc.)'),
  S('IV. Parent and Student Engagement'),
  L('Parent-teacher communication', 'Student portal for assignments and grades', 'Parent portal for student progress tracking', 'Parent teachers’ meetings'),
  S('V. Administrative Management'),
  L('Fee management and payment tracking', 'Inventory management', 'Transport management', 'Hostel management'),
  S('VI. Reporting and Analytics'),
  L('Real-time dashboards and mobile applications for student academic performance and operational metrics', 'Customizable reports for compliance, audits, dashboard, mobile application and management review', 'Export options in multiple formats (PDF, Excel, CSV)', 'Attendance and fee collection reports'),
  S('VII. Integration and Security'),
  L('Integration with third-party applications', 'Data security and backup', 'User access control and authentication'),
  S('VIII. Support and Maintenance'),
  L('Regular websites, dashboards and mobile applications updates, maintenance, feature enhancements and technical support and troubleshooting.', 'Customer support via email, chat, and phone during business hours', 'Training resources, user manuals, and FAQs'),
  S('IX. Services Not Included'),
  P('While INDOCAMPAS provides a wide range of features, the following are outside the scope of the standard service offering:'),
  L('On-premise websites, dashboards and mobile applications installation (INDOCAMPAS is a cloud-based SAAS)', 'Customized websites, dashboards and mobile applications development beyond the standard feature set (available via separate contracts)', 'Hardware provisioning (e.g., tablets, servers)', 'Data migration services beyond initial onboarding (subject to additional charges)', 'Legal, financial, or educational consulting services'),
  S('X. Service Availability and Limitations'),
  L('INDOCAMPAS aims for high service, uptime but does not guarantee uninterrupted access due to possible maintenance, updates, or external factors.', 'The platform\'s performance depends on users’ internet connectivity and device compatibility.'),
];

const erpTerm = [
  H('3. TERM'),
  P('This Agreement shall be valid for an initial period of 12 months (Subscription) commencing from the date of signing and may be renewed upon mutual agreement.'),
  S('3.1 Initial Term'), P('This Agreement shall commence on the Effective Date, as mentioned in the agreement header, and shall continue in force for an initial period of one (1) year ("Initial Term") unless terminated earlier in accordance with the provisions of this Agreement.'),
  S('3.2 Renewal'), P('Upon expiration of the Initial Term, this Agreement shall automatically renew for successive periods of one (1) year each ("Renewal Term") unless either party provides a written notice of non-renewal at least 30 (thirty) days prior to the end of the then-current term.'),
  S('3.3 Termination'), P('Either party may terminate this Agreement:'),
  L('For convenience, by providing 30 days’ prior written notice to the other party after the Initial Term.', 'For cause, if the other party materially breaches any of its obligations under this Agreement and fails to cure such breach within 30 days after receiving written notice of such breach.'),
  S('3.4 Effect of Termination'), P('Upon termination or expiration of this Agreement:'),
  L('The School shall immediately cease using the Web dashboard and Services.', 'Any outstanding payments due to the Service Provider shall be paid within 15 days.', 'Any data belonging to the School shall be returned or made available for export within 30 days, after which it may be permanently deleted from the Service Provider’s systems.'),
];

const erpFeesHead = [
  H('4. FEES AND PAYMENT TERMS'),
  S('4.1 Trail Terms'),
  L('You must represent educational institutes order to qualify for the 600 hours/24 trial period.', 'Your educational institutes can fully utilize the 600 hours/24 periods to examine all features of the Service.', 'If you need more time beyond the 600 hours/24 trial periods, contact INDOCAMPAS and tell us why. We reserve the right to refuse or approve the extension request.', 'After the trial period has ended, your educational institutes may choose to terminate the account or continue on a paying account.', 'Once your account is converted to a paying account, your trial period is over. You will be billed for your first month immediately upon conversion.'),
  S('4.2 Subscription Billing'),
  L('INDOCAMPAS operates on a subscription basis.', 'Subscription fees are charged annually, depending on the selected plan.', 'Billing begins upon activation of the account or renewal date, as applicable.', 'The Service is billed in advance on a yearly basis. There will be no refunds or credits for partial yearly of service, upgrade/downgrade refunds, or refunds for months unused with an open account. For other reasons not mentioned above, then refunds will be given at the discretion of the Company Management.', 'Calculation of how much you are billed is based on the number of students enrolled in the INDOCAMPAS student management feature on the bill date. Students whose records have been marked in the system as having left the educational institutes or as having been deleted do not count towards the student total.', 'All fees are exclusive of all taxes, levies, or duties imposed by taxing authorities, and you shall be responsible for payment of all such taxes, levies, or duties.'),
];

const erpFeesTail = [
  S('4.3 Mode of Payment'),
  L('Accepted payment methods include: Credit/Debit Cards (Visa, MasterCard, etc.); UPI / Net Banking (India only); RazorPay (for Indian users); Direct Bank Transfer (Enterprise customers)', 'Payment processing is handled via secure third-party gateways.'),
  S('4.4 Late Payment'), P('If the School fails to make any payment by the due date, the Service Provider reserves the right to:'),
  L('Charge a late payment fee of 2% per month on the outstanding amount.', 'Suspend or limit access to the web dashboard/services until the dues are cleared.', 'Accounts with overdue payments may be suspended or restricted until full payment is received.', 'INDOCAMPAS reserves the right to terminate accounts after 15 days of non-payment without further notice.'),
  S('4.5 Taxes'), P('All fees mentioned are exclusive of applicable taxes (GST or any other tax), which shall be borne by the School as per prevailing laws.'),
  S('4.6 Fee Revision'), P('The Service Provider reserves the right to revise the fees annually. Any such revision shall be notified in writing to the School at least 30 days in advance.'),
  S('4.7 Refund Policy'), P('Unless otherwise specified, all fees paid are non-refundable, except in the case of service failure attributable solely to the Service Provider, in which case the refund shall be made on a pro-rata basis.'),
];

const erpObligations = (extra = []) => [
  H('5. OBLIGATION OF THE SERVICE PROVIDER'),
  P('The Service Provider, i.e., Indocampas Tech Private Limited, agrees to undertake the following responsibilities:'),
  S('5.1 Web dashboard Provision'),
  P('a) Provide access to the Indocampas Schooling Web dashboard platform, including all features as per the selected service package.\nb) Ensure that the web dashboard is accessible to the School on a 24/7 basis, except during scheduled maintenance.'),
  ...extra,
  S('5.2 Implementation and Deployment'),
  P('a) Install and configure the web dashboard at the School’s premises or on a cloud server (as applicable).\nb) Complete the initial setup and customization (if any) within the agreed implementation timeline.'),
  S('5.3 Training and Support'),
  P('a) Provide adequate training to the School\'s staff for using the web dashboard effectively.\nb) Offer ongoing technical support via email, phone, or chat as per the support plan.\nc) Resolve technical issues within defined response and resolution timeframes (to be listed in a separate SLA if applicable).'),
  S('5.4 Data Security and Privacy'),
  P('a) Ensure all students, staff, and institutional data is stored securely in accordance with applicable data protection laws.\nb) Maintain confidentiality of the School\'s data and shall not disclose it to third parties without prior written consent, except as required by law.'),
  S('5.5 Updates and Maintenance'),
  P('a) Provide regular updates, bug fixes, and new features to improve the web dashboard.\nb) Perform scheduled maintenance with prior notice to the School to avoid disruption.'),
  S('5.6 Compliance'),
  P('a) Comply with all applicable local, state, and national laws and regulations relating to web dashboard service delivery and data handling.'),
  S('5.7 Performance Warranty'),
  P('a) Warrant that the web dashboard will function substantially in accordance with the documentation and agreed features during the term of the Agreement.\nb) In case of any failure, promptly rectify the issue at no additional cost to the School.'),
];

const erpClient = [
  H('6. OBLIGATION OF THE CLIENT SCHOOL'),
  P('The School agrees to fulfill the following obligations to ensure smooth operation and cooperation throughout the term of this Agreement:'),
  S('6.1 Access and Cooperation'),
  P('a) Provide the Service Provider with timely access to relevant data, staff, infrastructure, and technical resources required for web dashboard setup and deployment.\nb) Designate a staff member as a point of contact for all communications related to the web dashboard and services.'),
  S('6.2 Payment of Fees'),
  P('a) Pay all fees and charges as per the Fees and Payment Terms clause of this Agreement.\nb) Ensure timely payments and inform the Service Provider of any disputes or issues regarding invoices.'),
  S('6.3 Use of Web dashboard'),
  P('a) Use the Indocampas web dashboard only for internal school purposes and in accordance with the terms of this Agreement.\nb) Prevent unauthorized access to the web dashboard and services by third parties or unregistered users.\nc) Ensure that staff members use the web dashboard responsibly and do not engage in any misuse or tampering.'),
  S('6.4 Infrastructure Support'),
  P('a) Provide the required hardware (e.g., computers, internet connectivity, etc.) necessary to run the web dashboard effectively.\nb) Maintain minimum system requirements and internet bandwidth as recommended by the Service Provider.'),
  S('6.5 Data Accuracy'),
  P('a) Ensure that all data provided to the Service Provider (e.g., student records, staff details, academic schedules) is accurate, complete, and up to date.\nb) Promptly update any data changes or errors in the system.'),
  S('6.6 Confidentiality'),
  P('a) Maintain the confidentiality of all credentials, passwords, and sensitive data shared by the Service Provider.\nb) Not disclose any proprietary information of the Service Provider to third parties without prior written consent.'),
  S('6.7 Legal and Ethical Use'),
  P('a) Ensure that the web dashboard is not used to violate any applicable laws, regulations, or school policies.\nb) Not use the web dashboard to upload or transmit any illegal, abusive, or harmful content.'),
];

const confidentiality = (n = 7) => [
  H(`${n}. CONFIDENTIALITY`),
  S(`${n}.1 Definition of Confidential Information`),
  P('For the purposes of this Agreement, "Confidential Information" includes all written, electronic, or oral information disclosed by either party to the other, directly or indirectly, that is designated as confidential or that reasonably should be understood to be confidential. This includes, but is not limited to:'),
  L('Student, staff, and administrative data', 'Financial information and pricing', 'Technical details, web dashboard code, or specifications', 'Business strategies, reports, and internal communications', 'Usernames, passwords, and system access details'),
  S(`${n}.2 Confidentiality Obligations`), P('Each party agrees that:'),
  P('a) It shall maintain the confidentiality of the other party’s Confidential Information using at least the same degree of care it uses to protect its own confidential information (and in no case less than reasonable care).\nb) It shall not disclose any Confidential Information to any third party without the prior written consent of the disclosing party.\nc) It shall use Confidential Information solely for the purpose of performing its obligations under this Agreement.'),
  S(`${n}.3 Exceptions`), P('The obligations under this clause shall not apply to information that:'),
  P('a) Is or becomes publicly available through no breach of this Agreement;\nb) Is lawfully received from a third party without breach of any obligation of confidentiality;\nc) Is independently developed without reference to the other party\'s Confidential Information;\nd) Is required to be disclosed by law, regulation, or court order, provided that the receiving party gives prompt notice to the disclosing party (if legally permitted) and cooperates in seeking protective measures.'),
  S(`${n}.4 Duration`), P('The confidentiality obligations shall survive the termination or expiration of this Agreement and remain in effect for a period of three (3) years from the date of termination.'),
  S(`${n}.5 Return or Destruction of Information`), P('Upon termination or expiration of this Agreement, each party shall promptly return or destroy all Confidential Information of the other party, including all copies in any form, except for archival copies retained for legal or compliance purposes.'),
];

const erpIpToEnd = [
  H('8. INTELLECTUAL PROPERTY RIGHTS'),
  P('All rights, titles, and interests in the web dashboard and mobile application remain the sole property of Indocampas Tech Pvt. Ltd.'),
  S('8.1 Ownership by Service Provider'), P('All intellectual property rights, including but not limited to copyrights, trademarks, patents, trade secrets, web dashboard code, design elements, user interfaces, and documentation related to the Indocampas schooling web dashboard and services, shall remain the exclusive property of Indocampas Tech Private Limited.'),
  S('8.2 License to Use'), P('Subject to the terms of this Agreement, the Service Provider grants the School a non-exclusive, non-transferable, non-sub licensable, and limited license to access and use the web dashboard and related services solely for the School\'s internal educational and administrative purposes during the term of the Agreement.'),
  S('8.3 Restrictions'), P('The School shall not:'),
  L('Copy, modify, distribute, or create derivative works of the web dashboard;', 'Reverse engineer, decompile, disassemble, or attempt to derive the source code;', 'Use the web dashboard for any commercial resale, third-party training, or shared service offering;', 'Remove or alter any proprietary notices or labels on the web dashboard.'),
  S('8.4 School Data'), P('All students, staff, academic, and operational data input or uploaded by the School remains the sole and exclusive property of the School. The Service Provider shall use such data solely to provide the agreed services and shall not use or share it for any other purpose without written consent, except as required by law.'),
  S('8.5 Developed Customizations'), P('Any custom features, modules, or reports developed specifically for the School based on written requirements may be:'),
  L('Owned by the Service Provider, with a perpetual license granted to the School for its use; or', 'Jointly owned or licensed, as mutually agreed in writing before development begins.'),
  S('8.6 Infringement'), P('The Service Provider warrants that the Indocampas web dashboard does not infringe on any third-party intellectual property rights. If a claim of infringement arises, the Service Provider shall, at its own expense, defend and settle such claims and indemnify the School against any resulting liabilities.'),
  H('9. TERMINATION'),
  S('9.1 Termination for Convenience'), P('Either party may terminate this Agreement for any reason by providing thirty (30) days’ prior written notice to the other party, after the completion of the Initial Term.'),
  S('9.2 Termination for Cause'), P('Either party may terminate this Agreement with thirty (30) days’ written notice if the other party:\na) Materially breaches any provision of this Agreement and fails to cure such breach within the notice period;\nb) Becomes insolvent or files for bankruptcy;\nc) Engages in unlawful or unethical activities in relation to the Agreement.'),
  S('9.3 Immediate Termination'), P('The Service Provider reserves the right to terminate the Agreement immediately and without notice if:\na) The School fails to make payments within the stipulated time and does not respond to reminders within a 15-day grace period;\nb) There is evidence of misuse, tampering, or unauthorized access to the web dashboard by School staff or third parties.'),
  S('9.4 Consequences of Termination'), P('Upon termination of this Agreement:\na) The School shall immediately stop using the web dashboard and services;\nb) All outstanding dues shall become payable within fifteen (15) days of termination;\nc) The Service Provider shall provide the School with a final data export (in readable format) upon written request, within thirty (30) days of termination;\nd) All Confidential Information must be returned or securely destroyed by both parties.'),
  S('9.5 Survival'), P('The provisions of this Agreement which by their nature should survive termination, including but not limited to Confidentiality, Intellectual Property, Limitation of Liability, and Governing Law, shall survive and continue to be enforceable.'),
  H('10. LIMITATION OF LIABILITY'),
  S('10.1 Exclusion of Indirect Damages'), P('To the maximum extent permitted by applicable law, neither party shall be liable to the other for any indirect, incidental, special, punitive, or consequential damages, including but not limited to loss of profits, loss of data, business interruption, or reputational harm, arising out of or in connection with this Agreement, even if advised of the possibility of such damages.'),
  S('10.2 Cap on Liability'), P('Except for liability arising from gross negligence, willful misconduct, breach of confidentiality, or violation of intellectual property rights, the total aggregate liability of either party to the other under this Agreement shall not exceed the total fees actually paid by the School to the Service Provider in the preceding twelve (12) months.'),
  S('10.3 Data Loss'), P('While the Service Provider shall take reasonable measures to protect the School\'s data, it shall not be liable for any data loss or corruption caused by factors beyond its reasonable control, including but not limited to force majeure events, hardware failure, or third-party attacks.'),
  S('10.4 No Warranty of Uninterrupted Service'), P('The Service Provider does not guarantee that the web dashboard or services will be error-free or uninterrupted, and shall not be liable for downtime caused by scheduled maintenance, upgrades, or unforeseen technical issues.'),
  S('10.5 Essential Basis'), P('The School acknowledges and agrees that the limitations of liability set forth in this section are an essential basis of the bargain and that Indocampas Tech Private Limited would not have entered into this Agreement without such limitations.'),
  H('11. FORCE MAJURE'),
  S('11.1 Definition'), P('Neither party shall be held liable for any delay or failure to perform its obligations under this Agreement if such delay or failure arises due to Force Majeure events beyond its reasonable control, including but not limited to:'),
  L('Natural disasters (e.g., floods, earthquakes, fires)', 'Epidemics or pandemics', 'Acts of government or legal authorities', 'War, riots, or civil disturbances', 'Cyber-attacks or internet outages', 'Labor strikes or industrial actions', 'Power outages or utility disruptions'),
  S('11.2 Notification and Mitigation'), P('The affected party must:\na) Promptly notify the other party in writing of the occurrence of a Force Majeure event;\nb) Use all reasonable efforts to mitigate the impact and resume full performance as soon as practicable.'),
  S('11.3 Suspension of Obligations'), P('The obligations of the affected party shall be suspended for the duration of the Force Majeure event. Timeframes for performance shall be extended accordingly, without penalty.'),
  S('11.4 Right to Terminate'), P('If a Force Majeure event continues for a period exceeding thirty (30) consecutive days, either party may terminate this Agreement by providing fifteen (15) days\' written notice to the other party, without incurring liability for such termination.'),
  H('12. DISPUTE RESOLUTION'),
  S('12.1 Amicable Settlement'), P('In the event of any dispute, difference, or disagreement arising out of or in connection with this Agreement, the parties shall first attempt to resolve the matter through good faith negotiations within fifteen (15) days of written notice by either party.'),
  S('12.2 Mediation'), P('If the dispute cannot be resolved through mutual discussions, the parties agree to attempt resolution through mediation, conducted by a neutral third party mutually agreed upon. Mediation shall be conducted within thirty (30) days from the date amicable settlement fails.'),
  S('12.3 Arbitration'), P('If mediation also fails, the dispute shall be referred to and finally resolved by binding arbitration under the Arbitration and Conciliation Act, 1996, as amended from time to time.'),
  L('The arbitration shall be conducted by a sole arbitrator mutually appointed by both parties.', 'The venue of arbitration shall be puducherry and the language shall be English.', 'The decision of the arbitrator shall be final and binding on both parties.'),
  S('12.4 Jurisdiction and Governing Law'), P('This Agreement shall be governed by and construed in accordance with the laws of India. Subject to the above arbitration clause, the courts of puducherry shall have exclusive jurisdiction over any matters arising from this Agreement.'),
  H('13. ENTIRE AGREEMENT'),
  P('This Agreement, including all its annexures, schedules, and attachments, constitutes the entire agreement between Indocampas Tech Private Limited (“Service Provider”) and the Client School with respect to the subject matter hereof and supersedes all prior discussions, understandings, proposals, negotiations, representations, and agreements, whether oral or written.'),
  P('No amendment, modification, or waiver of any provision of this Agreement shall be valid unless made in writing and signed by both parties.'),
  P('Each party acknowledges that it is entering into this Agreement based solely on the terms and conditions contained herein and not relying on any prior representations or warranties, except those expressly set forth in this Agreement.'),
];

const feeTable = (fee, gst, total, label = 'ERP Software Subscription Fee') => [
  S('ERP Software Subscription Charges:'),
  TB([['Description', 'Amount'], [label, fee], ['GST @ 18%', gst], ['Total Amount Payable', total]]),
];

const ROLES_4 = ['1. Educational institution admin', '2. Teachers’ application', '3. Parent and student application'];
const ROLES_PROPLUS = ['1. Super admin', '2. Educational institution admin', '3. Teachers’ application', '4. Parent and student application'];

// ── per-plan overview (modules) ─────────────────────────────────────────────
const proOverview = [
  ...framework(ROLES_4),
  L('User Role-Based Views: Admin | Teacher | Student | Parent', 'Quick Stats Panel: Total Students / Teachers / Classes; Today’s Attendance; Upcoming Events; Notifications (Assignments, Circulars)'),
  S('B. Modules'),
  S('a. Academic Management'), L('Class & Section Management', 'Subject Allocation', 'Timetable Generator', 'Lesson Planning', 'Syllabus Progress Tracker'),
  S('b. Student Information System (SIS)'), L('Student Profiles (Photo, ID, Contact, Parent Info)', 'Enrollment Management', 'Promotion/Graduation Handling', 'Health & Discipline Records'),
  S('c. Teacher Management'), L('Staff Directory', 'Teacher Timetables'),
  S('d. Examination & Assessment'), L('Exam Scheduler', 'Mark Entry & Grade book'),
  S('e. Attendance Management'), L('Daily Attendance (digitally one click / digital Radio-Frequency Identification ID card method / Biometric)', 'SMS/Email Alerts for Absentees', 'Monthly Attendance Reports', 'Late Entry Tracking', 'Permission Tracking method'),
  S('f. Fees & Finance'), L('Fee Structure Setup', 'Online Payments Gateway Integration', 'Dues & Discount Management', 'Invoice Generator', 'Financial Reports & Ledgers'),
  S('g. Communication & Notifications'), L('SMS/Email/Push Notifications', 'Chat Interface (Educational institute management admin - Teacher, Teacher–Parent or Students, Parent or Students – Teacher)', 'Alerts for Exams, Fees, Attendance'),
  S('h. User Management & Security'), L('Role-Based Access Controls (RBAC)', 'Login History & Session Logs', 'Password Policies', 'Two-Factor Authentication (2FA)'),
  S('i. Reports & Analytics'), L('Attendance Reports (Student/Staff)', 'Academic Performance Charts', 'Fee Collection Reports', 'Custom Report Builder (Drag & Drop)'),
  S('j. Settings & Configuration'), L('Educational institutes Information', 'Academic Year Setup', 'Language Options (Multi-lingual Support)'),
  S('k. Key Components'),
  L('Education institutes internal accounts managements through admin dashboard.', 'Separate section accounts managements through admin dashboard.', 'Educational institutes students’ fees collection through admin dashboard.', 'Manages institution and teachers and students’ data.', 'Teachers and parents two ways communication of educational performance for students.', 'Maintain events-oriented data indoor and outdoor cultural activities and Sports any other activities.', 'Teachers and students Time table for examination and classes.', 'Students’ homework.', 'Digital attendance for teachers and students, educational institute and teachers’ students leave statues.', 'Tracking of van and students for the current location. Etc.,', 'Performance Tracking: monitors teachers Performance and student progress, assessments and feedback.'),
  S('L. Benefits'), L('Streamlined operations: automates administrative tasks and reduces paperwork.', 'Data-driven insights: provides actionable insights to improve student outcomes.', 'Enhanced collaboration: facilitates communication among educational institutes, teachers, students and parents.'),
  { ...customization[0], text: 'M. Customization' }, customization[1],
];

const proMaxOverview = [
  ...framework(ROLES_4),
  L('User Role-Based Views: Admin | Teacher | Student | Parent', 'Quick Stats Panel: Total Students / Teachers / Classes; Today’s Attendance; Upcoming Events; Notifications (Assignments, Circulars)'),
  S('B. Modules'),
  S('a. Academic Management'), L('Class & Section Management', 'Subject Allocation', 'Timetable Generator', 'Lesson Planning', 'Syllabus Progress Tracker'),
  S('b. Student Information System (SIS)'), L('Student Profiles(Photo, ID, Contact, Parent Info)', 'Enrollment Management', 'Promotion/Graduation Handling', 'Health & Discipline Records'),
  S('c. Teacher Management'), L('Staff Directory', 'Teacher Timetables', 'Leave Requests & Approvals', 'Performance Evaluation'),
  S('d. Examination & Assessment'), L('Exam Scheduler', 'Mark Entry & Grade book', 'Report Cards(Auto-generated PDFs)', 'Result Analysis(Graphical Reports)'),
  S('e. Attendance Management'), L('Daily Attendance (digitally one click / digital Radio-Frequency Identification ID card method / Biometric)', 'SMS/Email Alerts for Absentees', 'Monthly Attendance Reports', 'Late Entry Tracking', 'Permission Tracking method'),
  S('f. Fees & Finance'), L('Fee Structure Setup', 'Online Payments Gateway Integration', 'Dues & Discount Management', 'Invoice Generator', 'Financial Reports & Ledgers'),
  S('g. Communication & Notifications'), L('SMS/Email/Push Notifications', 'Notice Board (Digital)', 'Chat Interface (Educational institute management admin - Teacher, Teacher–Parent or Students, Parent or Students – Teacher)', 'Alerts for Exams, Fees, Attendance'),
  S('h. Library Management'), L('Book Inventory', 'Issue/Return Tracking', 'Barcode Scanning Integration', 'Book Requests & Reservations'),
  S('i. Canteen / Hostel / Transport'), L('Hostel Room Allotment', 'Meal Plans & Billing', 'Transport Routes & Tracking (GPS Integration)', 'RFID Boarding Alerts'),
  S('j. Assignments & Homework'), L('Upload Homework', 'Submission Tracker', 'Evaluation Panel', 'Late Submission Alerts'),
  S('k. Co-Curricular & Events'), L('Event Calendar', 'Registration Module', 'Achievement Tracking', 'Certificates Generator'),
  S('C. User Management & Security'), L('Role-Based Access Controls (RBAC)', 'Login History & Session Logs', 'Password Policies', 'Two-Factor Authentication (2FA)'),
  S('D. Reports & Analytics'), L('Attendance Reports(Student/Staff)', 'Academic Performance Charts', 'Fee Collection Reports', 'Custom Report Builder (Drag & Drop)'),
  S('E. Settings & Configuration'), L('Educational institutes Information', 'Academic Year Setup', 'Language Options(Multi-lingual Support)'),
  S('F. Key Components'),
  L('Education institutes internal accounts managements through admin dashboard.', 'Separate section accounts managements through admin dashboard.', 'Educational institutes students’ fees collection through admin dashboard.', 'Manages institution and teachers and students’ data.', 'Teachers and parents two ways communication of educational performance for students.', 'Maintain events-oriented data indoor and outdoor cultural activities and Sports any other activities.', 'Teachers and students Time table for examination and classes.', 'Students’ homework.', 'Digital attendance for teachers and students, educational institute and teachers’ students leave statues.', 'Tracking of van and students for the current location. Etc.,', 'Performance Tracking: monitors teachers Performance and student progress, assessments and feedback.'),
  S('G. Benefits'), L('Streamlined operations: automates administrative tasks and reduces paperwork.', 'Data-driven insights: provides actionable insights to improve student outcomes.', 'Enhanced collaboration: facilitates communication among educational institutes, teachers, students and parents.'),
  ...customization,
];

const proPlusOverview = [
  ...framework(ROLES_PROPLUS),
  L('User Role-Based Views: Admin | Teacher | Student | Parent', 'Quick Stats Panel: Total Students / Teachers / Classes (View data); Today\'s Attendance (View student attendance + Staff attendance) -> Now includes Staff; Upcoming Events (View only); Notifications (Assignments, Circulars)'),
  S('B. Modules'),
  S('a. Academic Management'), L('Class & Section Management (Basic view/management)', 'Subject Allocation (Assign subjects to staff)', 'Timetable Generator (Manage Class & Exam timetables for students & staffs) -> Now includes Exam Timetables'),
  S('b. Student Information System (SIS)'), L('Student Profiles (ID, Contact, Parent Info - Add/remove student logins, Staff create profile with official details) -> Staff profile management added', 'Enrolment Management (Approve/reject online admissions, Online/offline admissions via dashboard/app)'),
  S('c. Teacher Management'), L('Staff Directory (Add/remove staff logins)', 'Teacher Timetables (View own class & exam timetables) -> Now includes Exam Timetables', 'Leave Requests & Approvals (Apply for child\'s leave via Parent App - Staff leave management not explicit)', 'Performance Evaluation (Feed & monitor staff attendance) -> Staff attendance monitoring added'),
  S('d. Examination & Assessment'), L('Exam Scheduler (Manage Exam Timetables) -> Explicit scheduling capability', 'Mark Entry & Grade book (Manage student exam results - web -> mobile sync) -> Result management added', 'Result Analysis (View student exam results)'),
  S('e. Attendance Management'), L('Daily Attendance (Monitor student attendance - class-wise, Mark student attendance via Staff App)', 'Daily Attendance (Staff) (Feed & monitor staff attendance) -> Staff attendance management added'),
  S('f. Fees & Finance'), L('Fee Structure Setup (Basic/Middle/Full Loan Fee Structures)', 'Online Payments Gateway Integration (Fees payable via parent app)', 'Dues & Discount Management (View student fee status)', 'Invoice Generator (Issue online/offline fee bills)', 'Financial Reports & Ledgers (Handle institute-specific accounts) -> Institute accounts management added', 'Fee Collection Method: Internal app notification -> Explicit method added'),
  S('g. Communication & Notifications'), L('SMS/Email/Push Notifications (Send messages/notifications to staff & parents)', 'Notice Board (Not included in Pro Plus)', 'Chat Interface (Staff-Parent communication, Monitor staff-parent chats) -> Chat monitoring added'),
  S('i. Canteen / Hostel / Transport'), L('Only van-notifications will be provided through the App. No live tracking or attendance view is included in this module'),
  S('j. Assignments & Homework'), L('Upload Homework (Send/receive assignments and homework - TEXT & PHOTOS) -> Image support added', 'Submission Tracker (View student assignments & homework)'),
  S('C. User Management & Security'), L('Role-Based Access Controls (RBAC) (Assign privileges to 2 logins) -> Increased Admin logins', 'Login History & Session Logs (Individual login ID & password)'),
  S('D. Reports & Analytics'), L('Attendance Reports (Print reports - attendance, accounts, etc.) -> Basic report printing added', 'Fee Collection Reports (Print reports - accounts, etc.) -> Basic report printing added'),
  S('E. Settings & Configuration'), L('Educational institutes Information (Update institution profile)'),
  S('F. Key Components'),
  L('Education institutes internal accounts managements through admin dashboard. -> New key function', 'Teachers and students Time table for examination and classes. -> Enhanced', 'Digital attendance for teachers and students. -> Enhanced', 'Tracking of van and students (Attendance only) -> Basic van tracking added', 'Parent App supports managing up to 5 children (same/different schools). -> New key feature', 'Performance Tracking (Monitors teacher performance based on attendance/timetables)'),
  S('G. Benefits'), L('Streamlined operations: automates administrative tasks and reduces paperwork.', 'Data-driven insights: provides actionable insights into accounts and staff attendance.', 'Enhanced collaboration: Chat interface is monitored for safety.'),
  ...customization,
];


// ── Digital Marketing / Admission Dashboard agreements ──────────────────────
const shortPurpose = [
  H('1. PURPOSE OF THE AGREEMENT'),
  P('The purpose of this Agreement is to establish a formal partnership between the Service Provider and the Institution to provide Student Admission Management Services through the Service Provider’s digital software platform.'),
  P('The platform enables the Institution to manage student admissions in a systematic, secure, and efficient manner including student application collection, verification, processing, and record maintenance.'),
  H('2. SCOPE OF SERVICES'),
  P('The Service Provider agrees to provide the following services:'),
  S('2.1 Admission Management Platform Access (For 1 login)'),
  P('The Service Provider shall provide access to its schooling software platform for managing the admission process digitally.'),
  S('2.2 Application & Workflow Management'), P('The platform shall allow the Institution to:'),
  L('Receive and process student applications online', 'Track admission status and workflow stages'),
  S('2.4 Dashboard & Reports'),
  L('The Service Provider shall provide dashboards and reports for monitoring', 'Admission statistics', 'Student details', 'Fee related status (if applicable within the system)'),
  S('2.6 System Updates'), P('The Service Provider shall provide periodic updates and maintenance to ensure smooth platform performance.'),
];
const shortData = [
  H('4. DATA PROTECTION AND CONFIDENTIALITY'),
  S('4.1 Data Ownership'), L('All student and institutional data remains the property of the Institution.', 'The Service Provider shall act only as a processor of data.'),
  S('4.2 Data Security'), P('The Service Provider shall implement security measures including:'), L('Encryption during storage and transfer', 'Role-based access controls', 'Backup and recovery mechanisms'),
  S('4.3 Data Breach Notification'), P('In case of any breach, the Service Provider shall notify the Institution within 48 hours with details and corrective actions.'),
  S('4.4 Data Return & Deletion'), P('Upon termination, the Service Provider shall return all data and delete it from its system within 30 days, unless retention is required by law.'),
];
const shortTerm = (n) => [
  H(`${n}. TERM AND TERMINATION`),
  S(`${n}.1 Term`), P('This Agreement shall be valid for 1 year from the date of execution.'),
  S(`${n}.2 Renewal`), P('The Agreement may be renewed automatically for another 1 year unless either party gives a written notice of non-renewal at least 90 days prior.'),
  S(`${n}.3 Termination for Convenience`), P('Either Party may terminate the agreement by giving 90 days’ written notice.'),
  S(`${n}.4 Termination for Cause`), L('Immediate termination may occur if:', 'Material breach is not corrected within 30 days', 'Insolvency or closure of either Party', 'Data misuse or confidentiality breach'),
  S(`${n}.5 Consequences of Termination`), P('Upon termination:'), L('Pending dues must be cleared within 30 days', 'Services will stop immediately unless transition is mutually agreed', 'Data shall be returned/deleted as per clause 4'),
];
const shortLegal = (n) => [
  H(`${n}. REPRESENTATIONS AND WARRANTIES`), P('Both Parties confirm:'), L('They have authority to enter into this Agreement', 'The agreement does not violate any law', 'The agreement is legally valid and enforceable'),
  H(`${n + 1}. LIMITATION OF LIABILITY`),
  P('Neither Party shall be liable for indirect or consequential damages including loss of profits or goodwill.'),
  P('Total liability of either Party shall not exceed the total fees paid by the Institution in the preceding 12 months, except in cases of fraud, gross negligence, or confidentiality breach.'),
  H(`${n + 2}. GOVERNING LAW AND JURISDICTION`),
  L('This Agreement shall be governed by the laws of India.', 'Courts at Puducherry shall have exclusive jurisdiction.', 'Disputes shall first be resolved amicably, failing which arbitration shall be conducted under the Arbitration and Conciliation Act, 1996.', 'Seat/Venue of arbitration: Karaikal.', 'Language: English.'),
];

const DEFAULTS = {
  dm: () => ({
    title: '', providerText: PROVIDER_SHORT, clientTail: 'A private educational institution having its address at {{address}}, hereinafter referred to as the “Institution”, which expression shall include its administrators and authorized representatives.',
    intro: 'This Agreement is entered into between:', bothSigns: false,
    blocks: [
      P('The Service Provider and the Institution are collectively referred to as the “Parties”.'),
      ...shortPurpose,
      H('3. FEES AND PAYMENTS'),
      S('3.1 Fees Structure'), P('The Institution agrees to pay the Service Provider:'),
      P('A fee of Rs. 1,000/- per student shall be applicable only upon confirmed admission of the student through the platform.'),
      S('3.2 Invoicing'), P('The Service Provider shall raise invoices on a monthly basis based on admissions processed.'),
      S('3.3 Payment Terms'), P('All invoices shall be payable within 5 days from the invoice date'),
      S('3.5 Mode of Payment'), P('Payments shall be made via NEFT/RTGS/UPI/Bank Transfer to the account details mentioned in the invoice.'),
      S('3.6 Taxes'), P('All charges are exclusive of GST and applicable taxes, which shall be charged additionally as per law.'),
      ...shortData, ...shortTerm(5),
      H('6. DIGITAL MARKETING SERVICES (1 Months)'),
      P('The Service Provider shall offer Digital Marketing Services for a period of One (1) months at a total professional fee of ₹16,000/- plus applicable GST at 18%.'),
      P('Fee Structure:'), L('Professional Fee: ₹16,000/-'),
      ...shortLegal(7),
    ],
  }),
  admin: () => ({
    title: '', providerText: PROVIDER_SHORT, clientTail: 'A private educational institution having its address at {{address}}, hereinafter referred to as the “Institution”, which expression shall include its administrators and authorized representatives.',
    intro: 'This Agreement is entered into between:', bothSigns: true,
    blocks: [
      P('The Service Provider and the Institution are collectively referred to as the “Parties”.'),
      ...shortPurpose,
      H('3. FEES AND PAYMENTS'),
      S('3.1 Fees Structure'), S('3.2 Admission Dashboard – Rs.8,000 + GST'), P('The Institution agrees to pay the Service Provider:'),
      P('3.3 A fee of Rs.1,000/- per student shall be applicable only upon confirmed admission of the student through the platform.'),
      S('3.4 Invoicing'), P('The Service Provider shall raise invoices on a monthly basis based on admissions processed.'),
      S('3.5 Payment Terms'), P('All invoices shall be payable within 10 days from the invoice date.'),
      S('3.6 Mode of Payment'), P('Payments shall be made via NEFT/RTGS/UPI/Bank Transfer to the account details mentioned in the invoice.'),
      S('3.7 Taxes'), P('All charges are exclusive of GST and applicable taxes, which shall be charged additionally as per law.'),
      ...shortData,
      S('4.5 Confidentiality'), P('Both Parties agree not to disclose confidential information to any third party without written consent, except when legally required.'),
      ...shortTerm(5), ...shortLegal(6),
      H('9. ENTIRE AGREEMENT'), P('This Agreement constitutes the entire understanding between the Parties. Any amendments must be in writing and signed by both Parties.'),
    ],
  }),
  pro: () => ({
    title: '', providerText: PROVIDER_ERP, clientTail: `, a private educational institution, having its address at {{address}}, ${CLIENT_ERP_TAIL}`, intro: '', bothSigns: true,
    blocks: [
      ...erpPurpose('Pro plan & Admin Dashboard'), ...proOverview, ...erpScope, ...erpTerm, ...erpFeesHead,
      ...feeTable('₹3,166', '', '₹3,166'), ...erpFeesTail,
      ...erpObligations([S('5.1A Admission Fee'), P('The Institution agrees to pay the Service Provider:\n1.1 A fee of Rs. 1,000/- per student shall be applicable only upon confirmed admission of the student through the platform.\n1.2 Invoicing: The Service Provider shall raise invoices on a monthly basis based on admissions processed')]),
      ...erpClient, ...confidentiality(), ...erpIpToEnd,
    ],
  }),
  proplus: () => ({
    title: '', providerText: PROVIDER_ERP, clientTail: `, a private educational institution, having its address at {{address}}, ${CLIENT_ERP_TAIL}`, intro: '', bothSigns: false,
    blocks: [
      ...erpPurpose(''), ...proPlusOverview, ...erpScope, ...erpTerm, ...erpFeesHead,
      ...feeTable('₹15,000', '₹2,700', '₹17,700'), ...erpFeesTail,
      ...erpObligations(), ...erpClient, ...confidentiality(), ...erpIpToEnd,
    ],
  }),
  promax: () => ({
    title: '', providerText: PROVIDER_ERP, clientTail: `, a private educational institution, having its address at {{address}}, ${CLIENT_ERP_TAIL}`, intro: '', bothSigns: true,
    blocks: [
      ...erpPurpose('pro max'), ...proMaxOverview, ...erpScope, ...erpTerm, ...erpFeesHead,
      H('FEES AND PAYMENTS'), S('1. Fees Structure'),
      P('The Institution agrees to pay the Service Provider the following fees for the services rendered under this Agreement:'),
      S('1.1 Student Admission Management Fees'),
      P('a) Per Student Admission Fee:\nWe have added an admission fee of RS.1,000 per student for students admitted via the service provider’s admission management platform. The software charges amount to RS 31,000, Exclusive of GST'),
      ...erpFeesTail,
      ...erpObligations(), ...erpClient, ...confidentiality(), ...erpIpToEnd,
    ],
  }),
};

export const defaultDoc = (kind, client = {}) => {
  const d = (DEFAULTS[kind] || DEFAULTS.pro)();
  return {
    __kind: kind, date: today(), ...d,
    clientName: client.clientName || '', clientAddress: client.clientAddress || '',
    providerSign: { name: 'R. Aravinda Raj', designation: 'Chief Executive Officer', date: '' },
    clientSign: { name: client.signName || '', designation: client.signDesignation || '', date: '' },
  };
};

export const parseDoc = (mergeValues, kind) => {
  try {
    const raw = mergeValues && mergeValues.doc;
    if (!raw) return null;
    const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return d && Array.isArray(d.blocks) ? { ...defaultDoc(kind), ...d, __kind: kind } : null;
  } catch { return null; }
};

// ── doc -> XHTML (inline styles only, strict XML safe for openhtmltopdf) ────
const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rich = (v = '') => esc(v).replace(/₹/g, '<span style="font-family:\'DejaVu Sans\'">₹</span>').replace(/\n/g, '<br/>');
const fillAddress = (tpl, doc) => String(tpl || '').replace(/\{\{address\}\}/g, doc.clientAddress || '__________');

export const docToHtml = (doc) => {
  const out = [];
  const T = 'font-family:\'Liberation Serif\',\'Times New Roman\',serif;';
  out.push(`<div id="agr-doc" style="${T}font-size:11pt;color:#111;line-height:1.35;">`);
  if (doc.intro) out.push(`<p style="text-align:center;margin:0 0 8px 0;">${rich(doc.intro)}</p>`);
  out.push(`<p style="margin:6px 0;"><b>${rich(doc.providerText).replace(/^(INDOCAMPAS TECH PRIVATE LIMITED)/, '$1')}</b></p>`);
  out.push('<p style="text-align:center;margin:8px 0;"><b><u>AND</u></b></p>');
  out.push(`<p style="margin:6px 0;"><b>${rich(String(doc.clientName || '').toUpperCase())}</b>${rich(fillAddress(doc.clientTail, doc))}</p>`);
  doc.blocks.forEach((b) => {
    if (b.t === 'h1') out.push(`<h3 style="font-size:12.5pt;margin:14px 0 6px 0;text-transform:none;">${rich(b.text)}</h3>`);
    else if (b.t === 'h2') out.push(`<h4 style="font-size:11pt;margin:9px 0 3px 0;">${rich(b.text)}</h4>`);
    else if (b.t === 'p') out.push(`<p style="margin:3px 0;text-align:justify;">${rich(b.text)}</p>`);
    else if (b.t === 'ul') out.push(`<ul style="margin:3px 0 6px 22px;padding:0;">${(b.items || []).map((i) => `<li style="margin:1px 0;text-align:justify;">${rich(i)}</li>`).join('')}</ul>`);
    else if (b.t === 'table') {
      out.push('<table style="border-collapse:collapse;width:70%;margin:8px 0;">' + (b.rows || []).map((r, ri) =>
        '<tr>' + r.map((c) => `<td style="border:1px solid #000;padding:4px 8px;${b.head && ri === 0 || ri === b.rows.length - 1 ? 'font-weight:bold;' : ''}">${rich(c)}</td>`).join('') + '</tr>').join('') + '</table>');
    }
  });
  const sign = (title, s) => `<td style="width:48%;vertical-align:top;"><p style="margin:2px 0;"><b>${rich(title)}</b></p><p style="margin:14px 0 2px 0;">Signature: ____________________</p><p style="margin:2px 0;">Name: ${rich(s.name) || '____________________'}</p><p style="margin:2px 0;">Designation: ${rich(s.designation) || '____________________'}</p><p style="margin:2px 0;">Date: ${rich(s.date) || '____________________'}</p></td>`;
  out.push('<h3 style="font-size:12.5pt;margin:16px 0 6px 0;">SIGNATURES</h3>');
  out.push('<p style="margin:3px 0;">IN WITNESS WHEREOF, the parties have executed this Agreement on the date first written above.</p>');
  out.push(`<table style="width:100%;margin-top:14px;"><tr>${sign('For INDOCAMPAS TECH PRIVATE LIMITED', doc.providerSign || {})}<td style="width:4%;"></td>${sign('For ' + String(doc.clientName || 'THE INSTITUTION').toUpperCase(), doc.clientSign || {})}</tr></table>`);
  out.push('</div>');
  return out.join('');
};
